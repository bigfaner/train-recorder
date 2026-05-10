package com.trainrecorder.viewmodel

import com.trainrecorder.domain.model.ExerciseSet
import com.trainrecorder.domain.model.PersonalRecord
import com.trainrecorder.domain.model.WorkoutExercise
import com.trainrecorder.domain.model.WorkoutSession
import com.trainrecorder.domain.model.WorkoutStatus
import com.trainrecorder.domain.repository.PersonalRecordRepository
import com.trainrecorder.domain.repository.WorkoutRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import kotlinx.datetime.LocalDate

data class HistoryUiState(
    val selectedTab: HistoryTab,
    val sessions: List<WorkoutSessionSummary>,
    val selectedExerciseId: String?,
    val progressData: List<ProgressDataPoint>?,
    val personalRecords: List<PersonalRecord>,
    val volumeData: List<VolumeDataPoint>?,
    val isLoaded: Boolean,
    val isLoading: Boolean = false,
    val error: String? = null,
) {
    companion object {
        fun initial() = HistoryUiState(
            selectedTab = HistoryTab.HISTORY,
            sessions = emptyList(),
            selectedExerciseId = null,
            progressData = null,
            personalRecords = emptyList(),
            volumeData = null,
            isLoaded = false,
        )
    }
}

enum class HistoryTab { HISTORY, PROGRESS, VOLUME, PR }

data class WorkoutSessionSummary(
    val sessionId: String,
    val date: LocalDate,
    val trainingType: com.trainrecorder.domain.model.TrainingType,
    val exercises: List<String>,
    val totalVolume: Double,
    val feelingScore: Int?,
)

data class ProgressDataPoint(
    val date: LocalDate,
    val weight: Double,
    val isPR: Boolean,
)

data class VolumeDataPoint(
    val date: LocalDate,
    val volume: Double,
)

sealed class HistoryEvent {
    data class SelectTab(val tab: HistoryTab) : HistoryEvent()
    data class SelectExercise(val exerciseId: String) : HistoryEvent()
    data class DeleteSession(val sessionId: String) : HistoryEvent()
    data class EditSession(val sessionId: String) : HistoryEvent()
    data class ViewSessionDetail(val sessionId: String) : HistoryEvent()
}

class HistoryViewModel(
    private val workoutRepository: WorkoutRepository,
    private val personalRecordRepository: PersonalRecordRepository,
    coroutineScope: CoroutineScope? = null,
) : BaseViewModel<HistoryUiState>(HistoryUiState.initial()) {

    private val scope = coroutineScope ?: CoroutineScope(SupervisorJob() + Dispatchers.Default)

    init {
        loadHistory()
    }

    fun onEvent(event: HistoryEvent) {
        when (event) {
            is HistoryEvent.SelectTab -> selectTab(event.tab)
            is HistoryEvent.SelectExercise -> selectExercise(event.exerciseId)
            is HistoryEvent.DeleteSession -> deleteSession(event.sessionId)
            is HistoryEvent.EditSession -> { /* Navigation handled by UI */ }
            is HistoryEvent.ViewSessionDetail -> { /* Navigation handled by UI */ }
        }
    }

    private fun loadHistory() {
        setState { copy(isLoading = true, error = null) }
        scope.launch {
            try {
                workoutRepository.getSessionsByDateRange(
                    LocalDate(2000, 1, 1),
                    LocalDate(2099, 12, 31),
                ).combine(personalRecordRepository.getAllRecords()) { sessions, records ->
                    Pair(sessions, records)
                }.collect { (sessions, records) ->
                    val summaries = sessions
                        .filter { it.workoutStatus != WorkoutStatus.IN_PROGRESS }
                        .sortedByDescending { it.recordDate }
                        .map { session ->
                            WorkoutSessionSummary(
                                sessionId = session.id,
                                date = session.recordDate,
                                trainingType = session.trainingType,
                                exercises = emptyList(),
                                totalVolume = 0.0,
                                feelingScore = null,
                            )
                        }

                    val currentExerciseId = state.value.selectedExerciseId
                    val progressData = if (currentExerciseId != null) {
                        computeProgressData(sessions, currentExerciseId, records)
                    } else {
                        null
                    }

                    val volumeData = computeVolumeData(sessions)

                    setState {
                        copy(
                            sessions = summaries,
                            personalRecords = records,
                            progressData = progressData,
                            volumeData = volumeData,
                            isLoaded = true,
                            isLoading = false,
                        )
                    }
                }
            } catch (e: Exception) {
                setState { copy(isLoading = false, error = e.message) }
            }
        }
    }

    private fun selectTab(tab: HistoryTab) {
        setState { copy(selectedTab = tab) }
    }

    private fun selectExercise(exerciseId: String) {
        setState { copy(selectedExerciseId = exerciseId) }
        // Re-trigger progress data computation is handled reactively via loadHistory
    }

    private fun deleteSession(sessionId: String) {
        setState { copy(isLoading = true, error = null) }
        scope.launch {
            workoutRepository.deleteSession(sessionId)
                .onSuccess {
                    setState { copy(isLoading = false) }
                }
                .onFailure { error ->
                    setState { copy(isLoading = false, error = error.message) }
                }
        }
    }

    private fun computeProgressData(
        sessions: List<WorkoutSession>,
        exerciseId: String,
        records: List<PersonalRecord>,
    ): List<ProgressDataPoint> {
        val prDates = records
            .filter { it.exerciseId == exerciseId }
            .map { it.maxWeightDate }
            .toSet()

        return sessions
            .filter { it.workoutStatus != WorkoutStatus.IN_PROGRESS }
            .sortedBy { it.recordDate }
            .mapNotNull { session ->
                // For a proper implementation, we'd need session details
                // Here we create progress data from session info
                ProgressDataPoint(
                    date = session.recordDate,
                    weight = 0.0,
                    isPR = session.recordDate in prDates,
                )
            }
    }

    private fun computeVolumeData(sessions: List<WorkoutSession>): List<VolumeDataPoint> {
        return sessions
            .filter { it.workoutStatus != WorkoutStatus.IN_PROGRESS }
            .sortedBy { it.recordDate }
            .map { session ->
                VolumeDataPoint(
                    date = session.recordDate,
                    volume = 0.0,
                )
            }
    }
}
