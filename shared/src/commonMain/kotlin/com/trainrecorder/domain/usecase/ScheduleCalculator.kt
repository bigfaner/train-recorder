package com.trainrecorder.domain.usecase

import com.trainrecorder.domain.model.OtherSportRecord
import com.trainrecorder.domain.model.TrainingDay
import com.trainrecorder.domain.model.TrainingPlan
import com.trainrecorder.domain.model.WorkoutSession
import kotlinx.datetime.LocalDate

/**
 * Type of day in the schedule.
 */
enum class ScheduleDayType(val value: String) {
    TRAINING("training"),
    REST("rest"),
    OTHER_SPORT("other_sport"),
    ;

    companion object {
        fun fromValue(value: String): ScheduleDayType =
            entries.firstOrNull { it.value == value }
                ?: throw IllegalArgumentException("Unknown ScheduleDayType: $value")
    }
}

/**
 * A single day in the computed schedule.
 */
data class ScheduleDay(
    val date: LocalDate,
    val type: ScheduleDayType,
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
     */
    fun computeSchedule(
        plan: TrainingPlan,
        trainingDays: List<TrainingDay>,
        workoutSessions: List<WorkoutSession>,
        startDate: LocalDate,
        endDate: LocalDate,
    ): List<ScheduleDay> {
        // Implementation deferred to a later phase.
        // This is a placeholder that returns an empty schedule.
        return emptyList()
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
