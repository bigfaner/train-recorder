package com.trainrecorder.viewmodel

import com.trainrecorder.domain.model.ExerciseSet
import com.trainrecorder.domain.model.ExerciseStatus
import com.trainrecorder.domain.model.TrainingType
import com.trainrecorder.domain.model.WorkoutExercise
import com.trainrecorder.domain.model.WorkoutStatus
import com.trainrecorder.domain.repository.ExerciseSetInput
import com.trainrecorder.domain.repository.TimerService
import com.trainrecorder.domain.repository.WeightSuggestionRepository
import com.trainrecorder.domain.repository.WorkoutExerciseInput
import com.trainrecorder.domain.repository.WorkoutRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class WorkoutUiState(
    val sessionId: String,
    val trainingType: TrainingType,
    val exercises: List<WorkoutExerciseUi>,
    val currentExerciseIndex: Int,
    val timerState: TimerDisplayState?,
    val progress: WorkoutProgress,
    val isSaving: Boolean,
    val isLoaded: Boolean = false,
    val error: String? = null,
) {
    companion object {
        fun initial(sessionId: String = "", trainingType: TrainingType = TrainingType.PUSH) =
            WorkoutUiState(
                sessionId = sessionId,
                trainingType = trainingType,
                exercises = emptyList(),
                currentExerciseIndex = 0,
                timerState = null,
                progress = WorkoutProgress(0, 0),
                isSaving = false,
            )
    }
}

data class WorkoutExerciseUi(
    val exerciseId: String,
    val exerciseName: String,
    val exerciseStatus: ExerciseStatus,
    val suggestedWeight: Double?,
    val isCustomWeight: Boolean,
    val sets: List<ExerciseSetUi>,
    val targetSets: Int,
    val targetReps: Int,
    val restSeconds: Int,
    val weightIncrement: Double,
    val workoutExerciseId: String = "",
)

data class ExerciseSetUi(
    val setIndex: Int,
    val targetWeight: Double,
    val actualWeight: Double?,
    val actualReps: Int?,
    val isCompleted: Boolean,
)

data class TimerDisplayState(
    val remainingSeconds: Int,
    val totalDuration: Int,
    val isExpired: Boolean,
)

data class WorkoutProgress(
    val completedExercises: Int,
    val totalExercises: Int,
) {
    val fraction: Float get() = if (totalExercises > 0) completedExercises.toFloat() / totalExercises else 0f
}

sealed class WorkoutEvent {
    data class RecordSet(val exerciseId: String, val weight: Double, val reps: Int) : WorkoutEvent()
    data class UpdateWeight(val exerciseId: String, val weight: Double) : WorkoutEvent()
    data class SkipExercise(val exerciseId: String) : WorkoutEvent()
    data class ReorderExercise(val fromIndex: Int, val toIndex: Int) : WorkoutEvent()
    data object SkipTimer : WorkoutEvent()
    data class AdjustTimer(val deltaSeconds: Int) : WorkoutEvent()
    data object CompleteWorkout : WorkoutEvent()
    data object PartialComplete : WorkoutEvent()
}

class WorkoutViewModel(
    private val workoutRepository: WorkoutRepository,
    private val weightSuggestionRepository: WeightSuggestionRepository,
    private val timerService: TimerService,
    sessionId: String,
    coroutineScope: CoroutineScope? = null,
) : BaseViewModel<WorkoutUiState>(WorkoutUiState.initial(sessionId = sessionId)) {

    private val scope = coroutineScope ?: CoroutineScope(SupervisorJob() + Dispatchers.Default)

    private val _timerDisplay = MutableStateFlow<TimerDisplayState?>(null)

    init {
        loadSession(sessionId)
        observeTimer()
    }

    fun onEvent(event: WorkoutEvent) {
        when (event) {
            is WorkoutEvent.RecordSet -> recordSet(event.exerciseId, event.weight, event.reps)
            is WorkoutEvent.UpdateWeight -> updateWeight(event.exerciseId, event.weight)
            is WorkoutEvent.SkipExercise -> skipExercise(event.exerciseId)
            is WorkoutEvent.ReorderExercise -> reorderExercise(event.fromIndex, event.toIndex)
            is WorkoutEvent.SkipTimer -> skipTimer()
            is WorkoutEvent.AdjustTimer -> adjustTimer(event.deltaSeconds)
            is WorkoutEvent.CompleteWorkout -> completeWorkout()
            is WorkoutEvent.PartialComplete -> partialComplete()
        }
    }

    private fun loadSession(sessionId: String) {
        setState { copy(isLoaded = false) }
        scope.launch {
            workoutRepository.getSessionWithDetails(sessionId).collect { detail ->
                if (detail == null) {
                    setState { copy(isLoaded = true, error = "Session not found") }
                    return@collect
                }

                val exerciseUis = detail.exercises.map { exerciseWithSets ->
                    val exercise = exerciseWithSets.workoutExercise
                    val setUis = exerciseWithSets.sets.map { set ->
                        ExerciseSetUi(
                            setIndex = set.setIndex,
                            targetWeight = set.targetWeight,
                            actualWeight = if (set.isCompleted) set.actualWeight else null,
                            actualReps = if (set.isCompleted) set.actualReps else null,
                            isCompleted = set.isCompleted,
                        )
                    }
                    WorkoutExerciseUi(
                        exerciseId = exercise.exerciseId,
                        exerciseName = "",
                        exerciseStatus = exercise.exerciseStatus,
                        suggestedWeight = exercise.suggestedWeight,
                        isCustomWeight = exercise.isCustomWeight,
                        sets = setUis,
                        targetSets = exercise.targetSets,
                        targetReps = exercise.targetReps,
                        restSeconds = 90,
                        weightIncrement = 2.5,
                        workoutExerciseId = exercise.id,
                    )
                }

                val completedCount = exerciseUis.count {
                    it.exerciseStatus == ExerciseStatus.COMPLETED || it.exerciseStatus == ExerciseStatus.SKIPPED
                }

                val state = this@WorkoutViewModel.state.value
                setState {
                    copy(
                        sessionId = detail.session.id,
                        trainingType = detail.session.trainingType,
                        exercises = exerciseUis,
                        currentExerciseIndex = findNextExerciseIndex(exerciseUis),
                        progress = WorkoutProgress(
                            completedExercises = completedCount,
                            totalExercises = exerciseUis.size,
                        ),
                        isLoaded = true,
                    )
                }
            }
        }
    }

    private fun observeTimer() {
        scope.launch {
            timerService.remainingSeconds.collect { remaining ->
                _timerDisplay.update { current ->
                    current?.copy(remainingSeconds = remaining ?: 0)
                }
            }
        }
        scope.launch {
            _timerDisplay.collect { display ->
                setState { copy(timerState = display) }
            }
        }
    }

    private fun recordSet(exerciseId: String, weight: Double, reps: Int) {
        val currentState = state.value
        val exercise = currentState.exercises.find { it.exerciseId == exerciseId } ?: return
        val nextSetIndex = exercise.sets.indexOfFirst { !it.isCompleted }
        if (nextSetIndex == -1) return

        scope.launch {
            workoutRepository.recordSet(
                exercise.workoutExerciseId,
                ExerciseSetInput(
                    setIndex = nextSetIndex,
                    targetWeight = exercise.sets[nextSetIndex].targetWeight,
                    actualWeight = weight,
                    targetReps = exercise.targetReps,
                    actualReps = reps,
                ),
            ).onSuccess { recordedSet ->
                setState {
                    val updatedExercises = exercises.map { ex ->
                        if (ex.exerciseId == exerciseId) {
                            val updatedSets = ex.sets.mapIndexed { idx, set ->
                                if (idx == nextSetIndex) {
                                    set.copy(
                                        actualWeight = weight,
                                        actualReps = reps,
                                        isCompleted = true,
                                    )
                                } else {
                                    set
                                }
                            }
                            ex.copy(sets = updatedSets)
                        } else {
                            ex
                        }
                    }
                    copy(exercises = updatedExercises)
                }

                val restSeconds = exercise.restSeconds
                if (restSeconds > 0) {
                    timerService.startTimer(state.value.sessionId, restSeconds)
                    _timerDisplay.update {
                        TimerDisplayState(
                            remainingSeconds = restSeconds,
                            totalDuration = restSeconds,
                            isExpired = false,
                        )
                    }
                }
            }.onFailure { error ->
                setState { copy(error = error.message) }
            }
        }
    }

    private fun updateWeight(exerciseId: String, weight: Double) {
        setState {
            val updatedExercises = exercises.map { ex ->
                if (ex.exerciseId == exerciseId) {
                    ex.copy(
                        suggestedWeight = weight,
                        isCustomWeight = true,
                        sets = ex.sets.map { set ->
                            if (!set.isCompleted) set.copy(targetWeight = weight) else set
                        },
                    )
                } else {
                    ex
                }
            }
            copy(exercises = updatedExercises)
        }
    }

    private fun skipExercise(exerciseId: String) {
        scope.launch {
            val exercise = state.value.exercises.find { it.exerciseId == exerciseId } ?: return@launch
            workoutRepository.updateExerciseStatus(
                exercise.workoutExerciseId,
                ExerciseStatus.SKIPPED,
            ).onSuccess {
                updateExerciseStatusInState(exerciseId, ExerciseStatus.SKIPPED)
            }.onFailure { error ->
                setState { copy(error = error.message) }
            }
        }
    }

    private fun updateExerciseStatusInState(exerciseId: String, status: ExerciseStatus) {
        setState {
            val updatedExercises = exercises.map { ex ->
                if (ex.exerciseId == exerciseId) ex.copy(exerciseStatus = status) else ex
            }
            val completedCount = updatedExercises.count {
                it.exerciseStatus == ExerciseStatus.COMPLETED || it.exerciseStatus == ExerciseStatus.SKIPPED
            }
            copy(
                exercises = updatedExercises,
                currentExerciseIndex = findNextExerciseIndex(updatedExercises),
                progress = WorkoutProgress(
                    completedExercises = completedCount,
                    totalExercises = updatedExercises.size,
                ),
            )
        }
    }

    private fun reorderExercise(fromIndex: Int, toIndex: Int) {
        setState {
            val exercisesList = exercises.toMutableList()
            if (fromIndex in exercisesList.indices && toIndex in exercisesList.indices) {
                val moved = exercisesList.removeAt(fromIndex)
                exercisesList.add(toIndex, moved)
            }
            copy(exercises = exercisesList.toList())
        }
    }

    private fun skipTimer() {
        scope.launch {
            timerService.cancelTimer()
            _timerDisplay.update { null }
        }
    }

    private fun adjustTimer(deltaSeconds: Int) {
        _timerDisplay.update { current ->
            current?.let {
                val newRemaining = (it.remainingSeconds + deltaSeconds).coerceAtLeast(0)
                it.copy(remainingSeconds = newRemaining)
            }
        }
    }

    private fun completeWorkout() {
        setState { copy(isSaving = true) }
        scope.launch {
            workoutRepository.completeSession(state.value.sessionId)
                .onSuccess {
                    setState { copy(isSaving = false) }
                }
                .onFailure { error ->
                    setState { copy(isSaving = false, error = error.message) }
                }
        }
    }

    private fun partialComplete() {
        setState { copy(isSaving = true) }
        scope.launch {
            workoutRepository.partialCompleteSession(state.value.sessionId)
                .onSuccess {
                    setState { copy(isSaving = false) }
                }
                .onFailure { error ->
                    setState { copy(isSaving = false, error = error.message) }
                }
        }
    }

    private fun findNextExerciseIndex(exercises: List<WorkoutExerciseUi>): Int {
        return exercises.indexOfFirst {
            it.exerciseStatus == ExerciseStatus.PENDING || it.exerciseStatus == ExerciseStatus.IN_PROGRESS
        }.coerceAtLeast(0)
    }
}
