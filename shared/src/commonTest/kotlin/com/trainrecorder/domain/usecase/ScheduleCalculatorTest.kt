package com.trainrecorder.domain.usecase

import com.trainrecorder.domain.model.OtherSportRecord
import com.trainrecorder.domain.model.TrainingDay
import com.trainrecorder.domain.model.TrainingPlan
import com.trainrecorder.domain.model.TrainingType
import com.trainrecorder.domain.model.WorkoutSession
import kotlinx.datetime.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals

class ScheduleCalculatorTest {

    private val calculator = ScheduleCalculator()
    private val testDate = LocalDate.parse("2026-01-15")

    @Test
    fun computeConsecutiveSkips_withNoSkippedDays_returnsZero() {
        val scheduleDays = listOf(
            createScheduleDay(LocalDate.parse("2026-01-13"), isSkipped = false),
            createScheduleDay(LocalDate.parse("2026-01-14"), isSkipped = false),
            createScheduleDay(LocalDate.parse("2026-01-15"), isSkipped = false),
        )

        val result = calculator.computeConsecutiveSkips(scheduleDays, testDate)

        assertEquals(0, result)
    }

    @Test
    fun computeConsecutiveSkips_withConsecutiveSkips_countsCorrectly() {
        val scheduleDays = listOf(
            createScheduleDay(LocalDate.parse("2026-01-12"), isSkipped = false),
            createScheduleDay(LocalDate.parse("2026-01-13"), isSkipped = true),
            createScheduleDay(LocalDate.parse("2026-01-14"), isSkipped = true),
            createScheduleDay(LocalDate.parse("2026-01-15"), isSkipped = true),
        )

        val result = calculator.computeConsecutiveSkips(scheduleDays, testDate)

        assertEquals(3, result)
    }

    @Test
    fun computeConsecutiveSkips_withFutureSkippedDays_onlyCountsUpToFromDate() {
        val scheduleDays = listOf(
            createScheduleDay(LocalDate.parse("2026-01-14"), isSkipped = true),
            createScheduleDay(LocalDate.parse("2026-01-15"), isSkipped = true),
            createScheduleDay(LocalDate.parse("2026-01-16"), isSkipped = true),
            createScheduleDay(LocalDate.parse("2026-01-17"), isSkipped = true),
        )

        val result = calculator.computeConsecutiveSkips(scheduleDays, testDate)

        // Only counts up to Jan 15 (fromDate), so 2 skips
        assertEquals(2, result)
    }

    @Test
    fun computeConsecutiveSkips_withSingleSkip_returnsOne() {
        val scheduleDays = listOf(
            createScheduleDay(LocalDate.parse("2026-01-14"), isSkipped = false),
            createScheduleDay(LocalDate.parse("2026-01-15"), isSkipped = true),
        )

        val result = calculator.computeConsecutiveSkips(scheduleDays, testDate)

        assertEquals(1, result)
    }

    @Test
    fun computeSchedule_returnsEmptyPlaceholder() {
        val result = calculator.computeSchedule(
            plan = createTestPlan(),
            trainingDays = emptyList(),
            workoutSessions = emptyList(),
            startDate = LocalDate.parse("2026-01-13"),
            endDate = LocalDate.parse("2026-01-15"),
        )

        assertEquals(emptyList(), result)
    }

    private fun createScheduleDay(
        date: LocalDate,
        isSkipped: Boolean,
    ) = ScheduleDay(
        date = date,
        type = ScheduleDayType.TRAINING,
        trainingDay = null,
        workoutSession = null,
        otherSportRecord = null,
        isSkipped = isSkipped,
        isToday = date == testDate,
    )

    private fun createTestPlan() = TrainingPlan(
        id = "plan-1",
        displayName = "Test Plan",
        planMode = com.trainrecorder.domain.model.PlanMode.INFINITE_LOOP,
        cycleLength = null,
        scheduleMode = com.trainrecorder.domain.model.ScheduleDayType.WEEKLY_FIXED,
        intervalDays = null,
        isActive = true,
        createdAt = kotlinx.datetime.Instant.DISTANT_PAST,
        updatedAt = kotlinx.datetime.Instant.DISTANT_PAST,
    )
}
