package com.trainrecorder.viewmodel

import com.trainrecorder.domain.model.OtherSportRecord
import com.trainrecorder.domain.model.TrainingDay
import com.trainrecorder.domain.model.WorkoutSession
import com.trainrecorder.domain.repository.TrainingPlanRepository
import com.trainrecorder.domain.repository.WorkoutRepository
import com.trainrecorder.domain.usecase.DayType
import com.trainrecorder.domain.usecase.ScheduleCalculator
import com.trainrecorder.domain.usecase.ScheduleDay
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.LocalDate
import kotlinx.datetime.Month
import kotlinx.datetime.minus
import kotlinx.datetime.plus

/**
 * Represents a year-month pair for calendar navigation.
 * Not provided by kotlinx-datetime, so we define our own.
 */
data class YearMonth(
    val year: Int,
    val monthNumber: Int,
) {
    val month: Month get() = Month(monthNumber)

    fun startDate(): LocalDate = LocalDate(year, monthNumber, 1)

    fun endDate(): LocalDate {
        val start = startDate()
        val nextMonthStart = start.plus(1, DateTimeUnit.MONTH)
        return nextMonthStart.minus(1, DateTimeUnit.DAY)
    }

    /**
     * Add [months] to this YearMonth, wrapping year as needed.
     */
    fun plus(months: Int): YearMonth {
        val totalMonths = (year * 12 + (monthNumber - 1)) + months
        val newYear = totalMonths / 12
        val newMonth = (totalMonths % 12) + 1
        return YearMonth(newYear, newMonth)
    }

    /**
     * Subtract [months] from this YearMonth, wrapping year as needed.
     */
    fun minus(months: Int): YearMonth = plus(-months)

    companion object {
        fun from(date: LocalDate): YearMonth = YearMonth(date.year, date.monthNumber)
    }
}

data class CalendarUiState(
    val month: YearMonth,
    val scheduleDays: List<ScheduleDay>,
    val todaySummary: TodaySummary?,
    val consecutiveSkips: Int,
    val isLoaded: Boolean,
    val isLoading: Boolean = false,
    val error: String? = null,
) {
    companion object {
        fun initial(today: LocalDate) = CalendarUiState(
            month = YearMonth.from(today),
            scheduleDays = emptyList(),
            todaySummary = null,
            consecutiveSkips = 0,
            isLoaded = false,
        )
    }
}

data class TodaySummary(
    val date: LocalDate,
    val trainingDay: TrainingDay?,
    val workoutSession: WorkoutSession?,
    val otherSportRecords: List<OtherSportRecord>,
)

sealed class CalendarEvent {
    data class ChangeMonth(val month: YearMonth) : CalendarEvent()
    data class SelectDate(val date: LocalDate) : CalendarEvent()
    data class StartWorkout(val date: LocalDate) : CalendarEvent()
    data class SkipDay(val date: LocalDate) : CalendarEvent()
    data class UnskipDay(val date: LocalDate) : CalendarEvent()
    data class AdjustDate(val fromDate: LocalDate, val toDate: LocalDate) : CalendarEvent()
    data class DragReschedule(val fromDate: LocalDate, val toDate: LocalDate) : CalendarEvent()
    data object RecordOtherSport : CalendarEvent()
}

class CalendarViewModel(
    private val planRepository: TrainingPlanRepository,
    private val workoutRepository: WorkoutRepository,
    private val scheduleCalculator: ScheduleCalculator,
    private val today: LocalDate,
    initialMonth: YearMonth = YearMonth.from(today),
    coroutineScope: CoroutineScope? = null,
) : BaseViewModel<CalendarUiState>(CalendarUiState.initial(today)) {

    private val scope = coroutineScope ?: CoroutineScope(SupervisorJob() + Dispatchers.Default)

    private val _selectedDate = MutableStateFlow<LocalDate?>(null)
    val selectedDate: StateFlow<LocalDate?> = _selectedDate.asStateFlow()

    private val _skippedDates = MutableStateFlow<Set<LocalDate>>(emptySet())

    init {
        loadMonth(initialMonth)
    }

    fun onEvent(event: CalendarEvent) {
        when (event) {
            is CalendarEvent.ChangeMonth -> loadMonth(event.month)
            is CalendarEvent.SelectDate -> selectDate(event.date)
            is CalendarEvent.StartWorkout -> { /* Handled by UI navigation */ }
            is CalendarEvent.SkipDay -> skipDay(event.date)
            is CalendarEvent.UnskipDay -> unskipDay(event.date)
            is CalendarEvent.AdjustDate -> adjustDate(event.fromDate, event.toDate)
            is CalendarEvent.DragReschedule -> dragReschedule(event.fromDate, event.toDate)
            is CalendarEvent.RecordOtherSport -> { /* Handled by UI navigation */ }
        }
    }

    private fun loadMonth(month: YearMonth) {
        setState { copy(month = month, isLoading = true, error = null) }
        scope.launch {
            try {
                val startDate = month.startDate()
                val endDate = month.endDate()
                val skipped = _skippedDates.value

                planRepository.getActivePlan()
                    .combine(planRepository.getAllPlans()) { active, _ -> active }
                    .collect { plan ->
                        if (plan == null) {
                            setState {
                                copy(
                                    scheduleDays = emptyList(),
                                    isLoaded = true,
                                    isLoading = false,
                                )
                            }
                            return@collect
                        }

                        val daysFlow = planRepository.getPlanWithDays(plan.id)
                        val sessionsFlow = workoutRepository.getSessionsByDateRange(startDate, endDate)

                        daysFlow.combine(sessionsFlow) { planWithDays, sessions ->
                            val trainingDays = planWithDays?.days?.map { it.day } ?: emptyList()
                            val computed = scheduleCalculator.computeSchedule(
                                plan = plan,
                                trainingDays = trainingDays,
                                workoutSessions = sessions,
                                startDate = startDate,
                                endDate = endDate,
                                today = today,
                            )

                            val finalDays = computed.map { day ->
                                if (day.date in skipped) {
                                    day.copy(isSkipped = true)
                                } else {
                                    day
                                }
                            }

                            val todayDay = finalDays.firstOrNull { it.isToday }
                            val summary = todayDay?.let {
                                TodaySummary(
                                    date = it.date,
                                    trainingDay = it.trainingDay,
                                    workoutSession = it.workoutSession,
                                    otherSportRecords = emptyList(),
                                )
                            }

                            val consecutiveSkips = scheduleCalculator.computeConsecutiveSkips(
                                finalDays, today,
                            )

                            setState {
                                copy(
                                    scheduleDays = finalDays,
                                    todaySummary = summary,
                                    consecutiveSkips = consecutiveSkips,
                                    isLoaded = true,
                                    isLoading = false,
                                )
                            }
                        }.collect { /* Trigger collection */ }
                    }
            } catch (e: Exception) {
                setState {
                    copy(
                        isLoading = false,
                        error = e.message,
                    )
                }
            }
        }
    }

    private fun selectDate(date: LocalDate) {
        _selectedDate.update { date }
    }

    private fun skipDay(date: LocalDate) {
        _skippedDates.update { it + date }
        refreshSkippedDays()
    }

    private fun unskipDay(date: LocalDate) {
        _skippedDates.update { it - date }
        refreshSkippedDays()
    }

    private fun refreshSkippedDays() {
        val skipped = _skippedDates.value
        setState {
            val updatedDays = scheduleDays.map { day ->
                if (day.date in skipped) {
                    day.copy(isSkipped = true)
                } else {
                    day.copy(isSkipped = false)
                }
            }
            val consecutiveSkips = scheduleCalculator.computeConsecutiveSkips(
                updatedDays, today,
            )
            copy(
                scheduleDays = updatedDays,
                consecutiveSkips = consecutiveSkips,
            )
        }
    }

    private fun adjustDate(fromDate: LocalDate, toDate: LocalDate) {
        setState {
            val updatedDays = scheduleDays.map { day ->
                when {
                    day.date == fromDate -> day.copy(trainingDay = null, type = DayType.REST)
                    day.date == toDate -> {
                        val sourceDay = scheduleDays.firstOrNull { it.date == fromDate }
                        day.copy(
                            trainingDay = sourceDay?.trainingDay,
                            type = sourceDay?.type ?: DayType.REST,
                        )
                    }
                    else -> day
                }
            }
            copy(scheduleDays = updatedDays)
        }
    }

    private fun dragReschedule(fromDate: LocalDate, toDate: LocalDate) {
        adjustDate(fromDate, toDate)
    }
}
