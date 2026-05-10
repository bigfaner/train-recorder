package com.trainrecorder.viewmodel

import com.trainrecorder.domain.model.TrainingType
import com.trainrecorder.domain.repository.ExerciseFeelingInput
import com.trainrecorder.domain.repository.FeelingRepository
import com.trainrecorder.domain.repository.WorkoutRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDate

data class FeelingUiState(
    val sessionId: String,
    val trainingSummary: WorkoutSessionSummary?,
    val fatigue: Int,
    val satisfaction: Int,
    val exerciseFeelings: List<ExerciseFeelingUi>,
    val notes: String?,
    val isSaving: Boolean,
    val showHighFatigueWarning: Boolean,
    val isLoaded: Boolean = false,
    val error: String? = null,
) {
    companion object {
        fun initial(sessionId: String) = FeelingUiState(
            sessionId = sessionId,
            trainingSummary = null,
            fatigue = 5,
            satisfaction = 5,
            exerciseFeelings = emptyList(),
            notes = null,
            isSaving = false,
            showHighFatigueWarning = false,
        )
    }
}

data class ExerciseFeelingUi(
    val exerciseId: String,
    val exerciseName: String,
    val notes: String?,
)

sealed class FeelingEvent {
    data class SetFatigue(val level: Int) : FeelingEvent()
    data class SetSatisfaction(val level: Int) : FeelingEvent()
    data class SetExerciseNotes(val exerciseId: String, val notes: String) : FeelingEvent()
    data class SetNotes(val notes: String) : FeelingEvent()
    data object Save : FeelingEvent()
}

class FeelingViewModel(
    private val feelingRepository: FeelingRepository,
    private val workoutRepository: WorkoutRepository,
    sessionId: String,
    coroutineScope: CoroutineScope? = null,
) : BaseViewModel<FeelingUiState>(FeelingUiState.initial(sessionId)) {

    private val scope = coroutineScope ?: CoroutineScope(SupervisorJob() + Dispatchers.Default)

    init {
        loadSessionSummary(sessionId)
        loadExistingFeeling(sessionId)
    }

    fun onEvent(event: FeelingEvent) {
        when (event) {
            is FeelingEvent.SetFatigue -> setFatigue(event.level)
            is FeelingEvent.SetSatisfaction -> setSatisfaction(event.level)
            is FeelingEvent.SetExerciseNotes -> setExerciseNotes(event.exerciseId, event.notes)
            is FeelingEvent.SetNotes -> setNotes(event.notes)
            is FeelingEvent.Save -> saveFeeling()
        }
    }

    private fun loadSessionSummary(sessionId: String) {
        setState { copy(isLoaded = false) }
        scope.launch {
            workoutRepository.getSessionWithDetails(sessionId).collect { detail ->
                if (detail == null) {
                    setState { copy(isLoaded = true, error = "Session not found") }
                    return@collect
                }

                val summary = WorkoutSessionSummary(
                    sessionId = detail.session.id,
                    date = detail.session.recordDate,
                    trainingType = detail.session.trainingType,
                    exercises = detail.exercises.map { it.workoutExercise.exerciseId },
                    totalVolume = detail.exercises.sumOf { exerciseWithSets ->
                        exerciseWithSets.sets.sumOf { set ->
                            if (set.isCompleted) set.actualWeight * (set.actualReps ?: 0) else 0.0
                        }
                    },
                    feelingScore = null,
                )

                val exerciseFeelings = detail.exercises.map { exerciseWithSets ->
                    ExerciseFeelingUi(
                        exerciseId = exerciseWithSets.workoutExercise.exerciseId,
                        exerciseName = "",
                        notes = null,
                    )
                }

                setState {
                    copy(
                        trainingSummary = summary,
                        exerciseFeelings = exerciseFeelings,
                        isLoaded = true,
                    )
                }
            }
        }
    }

    private fun loadExistingFeeling(sessionId: String) {
        scope.launch {
            feelingRepository.getFeelingForSession(sessionId).collect { feeling ->
                if (feeling != null) {
                    setState {
                        copy(
                            fatigue = feeling.fatigueLevel,
                            satisfaction = feeling.satisfactionLevel,
                            notes = feeling.notes,
                            showHighFatigueWarning = shouldShowHighFatigueWarning(
                                feeling.fatigueLevel,
                                feeling.satisfactionLevel,
                            ),
                        )
                    }
                }
            }
        }
    }

    private fun setFatigue(level: Int) {
        val clamped = level.coerceIn(1, 10)
        setState {
            copy(
                fatigue = clamped,
                showHighFatigueWarning = shouldShowHighFatigueWarning(clamped, satisfaction),
            )
        }
    }

    private fun setSatisfaction(level: Int) {
        val clamped = level.coerceIn(1, 10)
        setState {
            copy(
                satisfaction = clamped,
                showHighFatigueWarning = shouldShowHighFatigueWarning(fatigue, clamped),
            )
        }
    }

    private fun setExerciseNotes(exerciseId: String, notes: String) {
        setState {
            val updated = exerciseFeelings.map { feeling ->
                if (feeling.exerciseId == exerciseId) feeling.copy(notes = notes) else feeling
            }
            copy(exerciseFeelings = updated)
        }
    }

    private fun setNotes(notes: String) {
        setState { copy(notes = notes) }
    }

    private fun saveFeeling() {
        val current = state.value
        setState { copy(isSaving = true, error = null) }
        scope.launch {
            val exerciseNotes = current.exerciseFeelings.map {
                ExerciseFeelingInput(it.exerciseId, it.notes)
            }

            feelingRepository.saveFeeling(
                sessionId = current.sessionId,
                fatigue = current.fatigue,
                satisfaction = current.satisfaction,
                notes = current.notes,
                exerciseNotes = exerciseNotes,
            ).onSuccess {
                setState { copy(isSaving = false) }
            }.onFailure { error ->
                setState { copy(isSaving = false, error = error.message) }
            }
        }
    }

    companion object {
        fun shouldShowHighFatigueWarning(fatigue: Int, satisfaction: Int): Boolean {
            return fatigue >= 8 && satisfaction <= 4
        }
    }
}
