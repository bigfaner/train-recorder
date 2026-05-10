package com.trainrecorder.ui.screens

import com.trainrecorder.domain.model.TrainingType
import com.trainrecorder.domain.usecase.DayType
import com.trainrecorder.domain.usecase.ScheduleDay
import kotlinx.datetime.DatePeriod
import kotlinx.datetime.DayOfWeek
import kotlinx.datetime.LocalDate
import kotlinx.datetime.Month
import kotlinx.datetime.minus
import kotlinx.datetime.plus

/**
 * Calendar grid cell representing a single day in the month view.
 */
data class CalendarGridCell(
    val date: LocalDate,
    val isCurrentMonth: Boolean,
    val scheduleDay: ScheduleDay?,
)

/**
 * A row of 7 calendar grid cells (one week row).
 */
typealias CalendarWeekRow = List<CalendarGridCell>

/**
 * Training type color mapping per the design system:
 * - Push = blue (#0071e3)
 * - Pull = green (#30d158)
 * - Legs = orange (#ff9500)
 * - Other = purple (#af52de)
 */
enum class TrainingTypeColor(val hex: ULong) {
    PUSH(0xFF0071E3u),
    PULL(0xFF30D158u),
    LEGS(0xFFFF9500u),
    OTHER(0xFFAF52DEu),
    REST(0xFF86868Bu),
    ;

    companion object {
        /**
         * Map a TrainingType to its color.
         */
        fun fromTrainingType(type: TrainingType): TrainingTypeColor = when (type) {
            TrainingType.PUSH -> PUSH
            TrainingType.PULL -> PULL
            TrainingType.LEGS -> LEGS
            TrainingType.OTHER -> OTHER
            TrainingType.CUSTOM -> OTHER
        }
    }
}

/**
 * Filter chip state for training type filtering.
 */
data class FilterChipState(
    val trainingType: TrainingType,
    val label: String,
    val isSelected: Boolean,
)

/**
 * Day-of-week header labels starting from Sunday.
 */
val DAY_OF_WEEK_HEADERS: List<String> = listOf(
    "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
)

/**
 * Compute the calendar grid for a given month.
 *
 * The grid always starts on Sunday and may include leading/trailing
 * days from adjacent months. Each row has exactly 7 cells.
 *
 * @param year The year.
 * @param month The month (1-12).
 * @param scheduleDays The schedule days for the month, indexed by date.
 * @return List of week rows, each containing 7 cells.
 */
fun computeCalendarGrid(
    year: Int,
    month: Int,
    scheduleDays: List<ScheduleDay>,
): List<CalendarWeekRow> {
    val firstOfMonth = LocalDate(year, month, 1)
    val scheduleByDate = scheduleDays.associateBy { it.date }

    // Determine the start of the grid: first Sunday on or before the 1st
    // kotlinx-datetime DayOfWeek: MONDAY(0) .. SUNDAY(6) via ordinal
    // For a Sun-start grid, we need: Sun=0, Mon=1, Tue=2, ..., Sat=6
    val isoDayOfWeek = firstOfMonth.dayOfWeek
    val offsetFromSunday = isoDayOfWeek.ordinal.let { ord ->
        // MONDAY=0 -> 1, TUESDAY=1 -> 2, ..., SATURDAY=5 -> 6, SUNDAY=6 -> 0
        (ord + 1) % 7
    }
    val gridStartDate = firstOfMonth.minus(DatePeriod(days = offsetFromSunday))

    // Build rows of 7
    val rows = mutableListOf<CalendarWeekRow>()
    var currentRow = mutableListOf<CalendarGridCell>()
    var currentDate = gridStartDate

    // We need enough rows to cover the entire month.
    // Worst case: 6 rows (e.g., a 31-day month starting on Saturday).
    val lastOfMonth = firstOfMonth.plus(DatePeriod(months = 1)).minus(DatePeriod(days = 1))
    val rowsNeeded = ((offsetFromSunday + lastOfMonth.dayOfMonth) + 6) / 7

    for (i in 0 until rowsNeeded * 7) {
        val isCurrentMonth = currentDate.monthNumber == month && currentDate.year == year
        currentRow.add(
            CalendarGridCell(
                date = currentDate,
                isCurrentMonth = isCurrentMonth,
                scheduleDay = scheduleByDate[currentDate],
            ),
        )
        if (currentRow.size == 7) {
            rows.add(currentRow.toList())
            currentRow = mutableListOf()
        }
        currentDate = currentDate.plus(DatePeriod(days = 1))
    }

    return rows
}

/**
 * Format a YearMonth for display (e.g., "May 2026").
 */
fun formatMonthYear(year: Int, month: Int): String {
    val monthName = Month(month).name.lowercase().replaceFirstChar { it.uppercase() }
    return "$monthName $year"
}

/**
 * Get the status description for a schedule day.
 * Returns one of: "completed", "skipped", "planned", "rest", or "empty".
 */
fun getDayStatus(day: ScheduleDay?): String = when {
    day == null -> "empty"
    day.isSkipped -> "skipped"
    day.type == DayType.REST -> "rest"
    day.workoutSession != null -> when (day.workoutSession.workoutStatus) {
        com.trainrecorder.domain.model.WorkoutStatus.COMPLETED -> "completed"
        com.trainrecorder.domain.model.WorkoutStatus.COMPLETED_PARTIAL -> "completed"
        com.trainrecorder.domain.model.WorkoutStatus.IN_PROGRESS -> "planned"
    }
    day.type == DayType.TRAINING -> "planned"
    else -> "rest"
}

/**
 * Check if a schedule day should show a training type color bar.
 */
fun hasTrainingBar(day: ScheduleDay?): Boolean {
    if (day == null) return false
    if (day.isSkipped) return true
    return day.type == DayType.TRAINING
}

/**
 * Get the display color for a schedule day's training type.
 */
fun getTrainingColor(day: ScheduleDay?): TrainingTypeColor = when {
    day == null -> TrainingTypeColor.REST
    day.isSkipped -> TrainingTypeColor.REST
    day.trainingDay != null -> TrainingTypeColor.fromTrainingType(day.trainingDay.dayType)
    else -> TrainingTypeColor.REST
}

/**
 * Get the list of filter chips for the available training types in the schedule.
 */
fun getFilterChips(
    scheduleDays: List<ScheduleDay>,
    selectedType: TrainingType?,
): List<FilterChipState> {
    val availableTypes = scheduleDays
        .mapNotNull { it.trainingDay?.dayType }
        .distinctBy { it }

    val labels = mapOf(
        TrainingType.PUSH to "Push",
        TrainingType.PULL to "Pull",
        TrainingType.LEGS to "Legs",
        TrainingType.OTHER to "Other",
        TrainingType.CUSTOM to "Custom",
    )

    return availableTypes.map { type ->
        FilterChipState(
            trainingType = type,
            label = labels[type] ?: type.name,
            isSelected = selectedType == type,
        )
    }
}

/**
 * Filter schedule days to only show days matching the selected training type.
 * Returns all days if selectedType is null (no filter).
 */
fun filterByTrainingType(
    scheduleDays: List<ScheduleDay>,
    selectedType: TrainingType?,
): List<ScheduleDay> {
    if (selectedType == null) return scheduleDays
    return scheduleDays.filter { day ->
        day.trainingDay?.dayType == selectedType
    }
}
