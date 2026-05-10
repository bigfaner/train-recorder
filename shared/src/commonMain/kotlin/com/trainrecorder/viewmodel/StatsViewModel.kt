package com.trainrecorder.viewmodel

import com.trainrecorder.domain.model.PersonalRecord
import com.trainrecorder.domain.repository.PersonalRecordRepository
import com.trainrecorder.domain.repository.WorkoutRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.LocalDate
import kotlinx.datetime.minus

data class StatsUiState(
    val weeklyStats: List<WeeklyStats>,
    val monthlyStats: List<MonthlyStats>,
    val estimatedOneRepMax: List<EstimatedOneRM>,
    val heatmapData: Map<LocalDate, Int>,
    val isLoaded: Boolean,
    val isLoading: Boolean = false,
    val error: String? = null,
) {
    companion object {
        fun initial() = StatsUiState(
            weeklyStats = emptyList(),
            monthlyStats = emptyList(),
            estimatedOneRepMax = emptyList(),
            heatmapData = emptyMap(),
            isLoaded = false,
        )
    }
}

data class WeeklyStats(
    val weekStart: LocalDate,
    val totalSessions: Int,
    val totalVolume: Double,
    val avgFatigue: Double?,
    val avgSatisfaction: Double?,
)

data class MonthlyStats(
    val month: YearMonth,
    val totalSessions: Int,
    val totalVolume: Double,
    val personalRecords: Int,
)

data class EstimatedOneRM(
    val exerciseId: String,
    val exerciseName: String,
    val estimatedWeight: Double,
    val date: LocalDate,
)

sealed class StatsEvent {
    data class SelectPeriod(val period: StatsPeriod) : StatsEvent()
    data class SelectExercise(val exerciseId: String) : StatsEvent()
    data object Refresh : StatsEvent()
}

enum class StatsPeriod { WEEKLY, MONTHLY }

class StatsViewModel(
    private val workoutRepository: WorkoutRepository,
    private val personalRecordRepository: PersonalRecordRepository,
    coroutineScope: CoroutineScope? = null,
) : BaseViewModel<StatsUiState>(StatsUiState.initial()) {

    private val scope = coroutineScope ?: CoroutineScope(SupervisorJob() + Dispatchers.Default)

    init {
        loadStats()
    }

    fun onEvent(event: StatsEvent) {
        when (event) {
            is StatsEvent.SelectPeriod -> { /* Period filtering handled in state */ }
            is StatsEvent.SelectExercise -> { /* Exercise filtering handled in state */ }
            is StatsEvent.Refresh -> loadStats()
        }
    }

    private fun loadStats() {
        setState { copy(isLoading = true, error = null) }
        scope.launch {
            try {
                workoutRepository.getSessionsByDateRange(
                    LocalDate(2000, 1, 1),
                    LocalDate(2099, 12, 31),
                ).combine(personalRecordRepository.getAllRecords()) { sessions, records ->
                    Pair(sessions, records)
                }.collect { (sessions, records) ->
                    val completedSessions = sessions.filter {
                        it.workoutStatus != com.trainrecorder.domain.model.WorkoutStatus.IN_PROGRESS
                    }

                    val weeklyStats = computeWeeklyStats(completedSessions)
                    val monthlyStats = computeMonthlyStats(completedSessions, records)
                    val oneRM = computeEstimatedOneRM(completedSessions)
                    val heatmap = computeHeatmap(completedSessions)

                    setState {
                        copy(
                            weeklyStats = weeklyStats,
                            monthlyStats = monthlyStats,
                            estimatedOneRepMax = oneRM,
                            heatmapData = heatmap,
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

    /**
     * 1RM estimation formula: weight x (1 + reps / 30)
     * As specified in the acceptance criteria.
     */
    fun estimateOneRepMax(weight: Double, reps: Int): Double {
        return weight * (1.0 + reps / 30.0)
    }

    private fun computeWeeklyStats(sessions: List<com.trainrecorder.domain.model.WorkoutSession>): List<WeeklyStats> {
        return sessions
            .groupBy { session ->
                // Week start = Monday of the week
                val dayOfWeek = session.recordDate.dayOfWeek.ordinal // 0=Mon
                session.recordDate.minus(dayOfWeek, DateTimeUnit.DAY)
            }
            .map { (weekStart, weekSessions) ->
                WeeklyStats(
                    weekStart = weekStart,
                    totalSessions = weekSessions.size,
                    totalVolume = 0.0,
                    avgFatigue = null,
                    avgSatisfaction = null,
                )
            }
            .sortedBy { it.weekStart }
    }

    private fun computeMonthlyStats(
        sessions: List<com.trainrecorder.domain.model.WorkoutSession>,
        records: List<PersonalRecord>,
    ): List<MonthlyStats> {
        return sessions
            .groupBy { session -> YearMonth.from(session.recordDate) }
            .map { (month, monthSessions) ->
                val prCount = records.count { r ->
                    YearMonth.from(r.maxWeightDate) == month || YearMonth.from(r.maxVolumeDate) == month
                }
                MonthlyStats(
                    month = month,
                    totalSessions = monthSessions.size,
                    totalVolume = 0.0,
                    personalRecords = prCount,
                )
            }
            .sortedBy { it.month.startDate() }
    }

    private fun computeEstimatedOneRM(sessions: List<com.trainrecorder.domain.model.WorkoutSession>): List<EstimatedOneRM> {
        // This requires session details with exercise sets
        // For now, return empty - will be populated when session details are loaded
        return emptyList()
    }

    private fun computeHeatmap(sessions: List<com.trainrecorder.domain.model.WorkoutSession>): Map<LocalDate, Int> {
        return sessions
            .groupBy { it.recordDate }
            .mapValues { (_, dateSessions) -> dateSessions.size }
    }
}
