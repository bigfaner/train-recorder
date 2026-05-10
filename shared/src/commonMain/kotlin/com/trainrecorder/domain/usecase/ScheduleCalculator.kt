package com.trainrecorder.domain.usecase

import com.trainrecorder.domain.model.OtherSportRecord
import com.trainrecorder.domain.model.TrainingDay
import com.trainrecorder.domain.model.TrainingPlan
import com.trainrecorder.domain.model.WorkoutSession
import kotlinx.datetime.DateTimePeriod
import kotlinx.datetime.DatePeriod
import kotlinx.datetime.LocalDate
import kotlinx.datetime.plus

/**
 * Type of day in the schedule.
 */
enum class DayType(val value: String) {
    TRAINING("training"),
    REST("rest"),
    OTHER_SPORT("other_sport"),
    ;

    companion object {
        fun fromValue(value: String): DayType =
            entries.firstOrNull { it.value == value }
                ?: throw IllegalArgumentException("Unknown DayType: $value")
    }
}

/**
 * A single day in the computed schedule.
 */
data class ScheduleDay(
    val date: LocalDate,
    val type: DayType,
    val trainingDay: TrainingDay?,
    val workoutSession: WorkoutSession?,
    val otherSportRecord: OtherSportRecord?,
    val isSkipped: Boolean,
    val isToday: Boolean,
)

/**
 * Calculates training schedule based on plan mode (infinite_loop / fixed_cycle)
 * and schedule mode (weekly_fixed / fixed_interval).
 *
 * Pure computation class -- no dependencies, no side effects.
 */
class ScheduleCalculator {
    /**
     * Compute the schedule for a date range given a plan, its training days,
     * existing workout sessions, and other sport records.
     *
     * @param plan The training plan to compute schedule for.
     * @param trainingDays The training day definitions within the plan, ordered by [orderIndex].
     * @param workoutSessions Completed/ongoing workout sessions to overlay onto the schedule.
     * @param startDate Start date of the schedule range (inclusive).
     * @param endDate End date of the schedule range (inclusive).
     * @param today The current date, used to set [ScheduleDay.isToday]. Defaults to null (no day marked as today).
     * @return List of [ScheduleDay] for each date in the range, in chronological order.
     */
    fun computeSchedule(
        plan: TrainingPlan,
        trainingDays: List<TrainingDay>,
        workoutSessions: List<WorkoutSession>,
        startDate: LocalDate,
        endDate: LocalDate,
        today: LocalDate? = null,
    ): List<ScheduleDay> {
        if (startDate > endDate) return emptyList()

        val sortedTrainingDays = trainingDays.sortedBy { it.orderIndex }
        val sessionByDate = workoutSessions.groupBy { it.recordDate }

        val result = mutableListOf<ScheduleDay>()
        var currentDate = startDate
        var dayIndex = 0

        while (currentDate <= endDate) {
            val trainingDay = determineTrainingDay(plan, sortedTrainingDays, dayIndex)
            val sessions = sessionByDate[currentDate]

            result.add(
                ScheduleDay(
                    date = currentDate,
                    type = if (trainingDay != null) DayType.TRAINING else DayType.REST,
                    trainingDay = trainingDay,
                    workoutSession = sessions?.firstOrNull(),
                    otherSportRecord = null,
                    isSkipped = false,
                    isToday = currentDate == today,
                ),
            )

            currentDate = currentDate.plus(DatePeriod(days = 1))
            dayIndex++
        }

        return result
    }

    /**
     * Determine which training day (if any) falls on the given day index.
     */
    private fun determineTrainingDay(
        plan: TrainingPlan,
        sortedTrainingDays: List<TrainingDay>,
        dayIndex: Int,
    ): TrainingDay? {
        if (sortedTrainingDays.isEmpty()) return null

        return when (plan.scheduleMode) {
            com.trainrecorder.domain.model.ScheduleDayType.WEEKLY_FIXED -> {
                determineWeeklyFixed(sortedTrainingDays, dayIndex)
            }
            com.trainrecorder.domain.model.ScheduleDayType.FIXED_INTERVAL -> {
                determineFixedInterval(sortedTrainingDays, dayIndex, plan.intervalDays ?: 1)
            }
        }
    }

    /**
     * For weekly_fixed: training days are placed on consecutive days starting
     * from the beginning of each week cycle. The remaining days of the week are rest.
     *
     * For example, with 3 training days (push/pull/legs):
     * Mon=push, Tue=pull, Wed=legs, Thu-Sun=rest, then repeat next week.
     */
    private fun determineWeeklyFixed(
        sortedTrainingDays: List<TrainingDay>,
        dayIndex: Int,
    ): TrainingDay? {
        val weekDayIndex = dayIndex % 7
        return if (weekDayIndex < sortedTrainingDays.size) {
            sortedTrainingDays[weekDayIndex]
        } else {
            null
        }
    }

    /**
     * For fixed_interval: training days cycle in order, with [intervalDays]
     * rest days between each training day.
     *
     * For example, with 3 training days and intervalDays=1:
     * push, rest, pull, rest, legs, rest, push, rest, pull, ...
     */
    private fun determineFixedInterval(
        sortedTrainingDays: List<TrainingDay>,
        dayIndex: Int,
        intervalDays: Int,
    ): TrainingDay? {
        val blockSize = 1 + intervalDays
        val cycleLength = sortedTrainingDays.size * blockSize
        val positionInCycle = dayIndex % cycleLength
        val positionInBlock = positionInCycle % blockSize

        return if (positionInBlock == 0) {
            val trainingDayIndex = positionInCycle / blockSize
            sortedTrainingDays[trainingDayIndex]
        } else {
            null
        }
    }

    /**
     * Compute consecutive skipped days from [fromDate] going backwards.
     * Used to trigger encouragement prompts when consecutive skips >= 3.
     */
    fun computeConsecutiveSkips(scheduleDays: List<ScheduleDay>, fromDate: LocalDate): Int {
        val sortedDays = scheduleDays
            .filter { it.date <= fromDate }
            .sortedByDescending { it.date }

        var count = 0
        for (day in sortedDays) {
            if (day.isSkipped) {
                count++
            } else {
                break
            }
        }
        return count
    }
}
