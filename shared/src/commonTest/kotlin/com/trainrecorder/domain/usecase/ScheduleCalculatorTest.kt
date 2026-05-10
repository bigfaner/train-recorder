package com.trainrecorder.domain.usecase

import com.trainrecorder.domain.model.PlanMode
import com.trainrecorder.domain.model.ScheduleDayType
import com.trainrecorder.domain.model.TrainingDay
import com.trainrecorder.domain.model.TrainingPlan
import com.trainrecorder.domain.model.TrainingType
import com.trainrecorder.domain.model.WorkoutSession
import com.trainrecorder.domain.model.WorkoutStatus
import kotlinx.datetime.DatePeriod
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlinx.datetime.minus
import kotlinx.datetime.plus
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class ScheduleCalculatorTest {

    private val calculator = ScheduleCalculator()
    private val baseInstant = Instant.parse("2026-01-01T00:00:00Z")
    // 2026-01-12 is a Monday
    private val monday = LocalDate.parse("2026-01-12")

    private fun LocalDate.plusDays(n: Int): LocalDate = this.plus(DatePeriod(days = n))
    private fun LocalDate.minusDays(n: Int): LocalDate = this.minus(DatePeriod(days = n))

    // ============== computeConsecutiveSkips tests ==============

    @Test
    fun computeConsecutiveSkips_withNoSkippedDays_returnsZero() {
        val scheduleDays = listOf(
            createScheduleDay(monday, isSkipped = false),
            createScheduleDay(monday.plusDays(1), isSkipped = false),
            createScheduleDay(monday.plusDays(2), isSkipped = false),
        )

        val result = calculator.computeConsecutiveSkips(scheduleDays, monday.plusDays(2))

        assertEquals(0, result)
    }

    @Test
    fun computeConsecutiveSkips_withConsecutiveSkips_countsCorrectly() {
        val scheduleDays = listOf(
            createScheduleDay(monday.minusDays(2), isSkipped = false),
            createScheduleDay(monday.minusDays(1), isSkipped = true),
            createScheduleDay(monday, isSkipped = true),
            createScheduleDay(monday.plusDays(1), isSkipped = true),
        )

        val result = calculator.computeConsecutiveSkips(scheduleDays, monday.plusDays(1))

        assertEquals(3, result)
    }

    @Test
    fun computeConsecutiveSkips_withFutureSkippedDays_onlyCountsUpToFromDate() {
        val scheduleDays = listOf(
            createScheduleDay(monday, isSkipped = true),
            createScheduleDay(monday.plusDays(1), isSkipped = true),
            createScheduleDay(monday.plusDays(2), isSkipped = true),
            createScheduleDay(monday.plusDays(3), isSkipped = true),
        )

        val result = calculator.computeConsecutiveSkips(scheduleDays, monday.plusDays(1))

        // Only counts up to fromDate (Monday+1), so 2 skips
        assertEquals(2, result)
    }

    @Test
    fun computeConsecutiveSkips_withSingleSkip_returnsOne() {
        val scheduleDays = listOf(
            createScheduleDay(monday.minusDays(1), isSkipped = false),
            createScheduleDay(monday, isSkipped = true),
        )

        val result = calculator.computeConsecutiveSkips(scheduleDays, monday)

        assertEquals(1, result)
    }

    @Test
    fun computeConsecutiveSkips_stopsAtNonSkippedDay() {
        val scheduleDays = listOf(
            createScheduleDay(monday.minusDays(3), isSkipped = true),
            createScheduleDay(monday.minusDays(2), isSkipped = true),
            createScheduleDay(monday.minusDays(1), isSkipped = false),
            createScheduleDay(monday, isSkipped = true),
        )

        val result = calculator.computeConsecutiveSkips(scheduleDays, monday)

        // Only counts consecutive from fromDate backwards, stops at non-skipped
        assertEquals(1, result)
    }

    // ============== weekly_fixed mode tests ==============

    @Test
    fun weeklyFixed_producesCorrectDayTypes() {
        val plan = createPlan(scheduleMode = ScheduleDayType.WEEKLY_FIXED)
        // Training days: push on day 0, pull on day 1, legs on day 2
        // With weekly_fixed: Mon=push, Tue=pull, Wed=legs, Thu-Sun=rest
        val trainingDays = listOf(
            createTrainingDay("td-1", "Push Day", TrainingType.PUSH, orderIndex = 0),
            createTrainingDay("td-2", "Pull Day", TrainingType.PULL, orderIndex = 1),
            createTrainingDay("td-3", "Legs Day", TrainingType.LEGS, orderIndex = 2),
        )
        val startDate = LocalDate.parse("2026-01-12") // Monday
        val endDate = LocalDate.parse("2026-01-18")   // Sunday

        val result = calculator.computeSchedule(plan, trainingDays, emptyList(), startDate, endDate)

        assertEquals(7, result.size)
        // Monday = training (push)
        assertTrainingDay(result[0], startDate, TrainingType.PUSH, trainingDays[0])
        // Tuesday = training (pull)
        assertTrainingDay(result[1], startDate.plusDays(1), TrainingType.PULL, trainingDays[1])
        // Wednesday = training (legs)
        assertTrainingDay(result[2], startDate.plusDays(2), TrainingType.LEGS, trainingDays[2])
        // Thursday-Sunday = rest
        assertRestDay(result[3], startDate.plusDays(3))
        assertRestDay(result[4], startDate.plusDays(4))
        assertRestDay(result[5], startDate.plusDays(5))
        assertRestDay(result[6], startDate.plusDays(6))
    }

    @Test
    fun weeklyFixed_repeatsAcrossMultipleWeeks() {
        val plan = createPlan(scheduleMode = ScheduleDayType.WEEKLY_FIXED)
        val trainingDays = listOf(
            createTrainingDay("td-1", "Push Day", TrainingType.PUSH, orderIndex = 0),
            createTrainingDay("td-2", "Pull Day", TrainingType.PULL, orderIndex = 1),
        )
        val startDate = LocalDate.parse("2026-01-12") // Monday
        val endDate = LocalDate.parse("2026-01-25")   // Sunday (2 weeks)

        val result = calculator.computeSchedule(plan, trainingDays, emptyList(), startDate, endDate)

        assertEquals(14, result.size)
        // Week 1: Mon=push, Tue=pull, Wed-Sun=rest
        assertTrainingDay(result[0], startDate, TrainingType.PUSH, trainingDays[0])
        assertTrainingDay(result[1], startDate.plusDays(1), TrainingType.PULL, trainingDays[1])
        assertRestDay(result[2], startDate.plusDays(2))
        // Week 2: Mon=push, Tue=pull, Wed-Sun=rest
        assertTrainingDay(result[7], startDate.plusDays(7), TrainingType.PUSH, trainingDays[0])
        assertTrainingDay(result[8], startDate.plusDays(8), TrainingType.PULL, trainingDays[1])
    }

    // ============== fixed_interval mode tests ==============

    @Test
    fun fixedInterval_withOneRestDay_cyclesCorrectly() {
        val plan = createPlan(
            scheduleMode = ScheduleDayType.FIXED_INTERVAL,
            intervalDays = 1,
        )
        val trainingDays = listOf(
            createTrainingDay("td-1", "Push", TrainingType.PUSH, orderIndex = 0),
            createTrainingDay("td-2", "Pull", TrainingType.PULL, orderIndex = 1),
            createTrainingDay("td-3", "Legs", TrainingType.LEGS, orderIndex = 2),
        )
        val startDate = LocalDate.parse("2026-01-12")
        val endDate = LocalDate.parse("2026-01-20")

        val result = calculator.computeSchedule(plan, trainingDays, emptyList(), startDate, endDate)

        assertEquals(9, result.size)
        // Day 1: Push (training)
        assertTrainingDay(result[0], startDate, TrainingType.PUSH, trainingDays[0])
        // Day 2: Rest (1 rest day)
        assertRestDay(result[1], startDate.plusDays(1))
        // Day 3: Pull (training)
        assertTrainingDay(result[2], startDate.plusDays(2), TrainingType.PULL, trainingDays[1])
        // Day 4: Rest
        assertRestDay(result[3], startDate.plusDays(3))
        // Day 5: Legs (training)
        assertTrainingDay(result[4], startDate.plusDays(4), TrainingType.LEGS, trainingDays[2])
        // Day 6: Rest
        assertRestDay(result[5], startDate.plusDays(5))
        // Day 7: Push (cycling back)
        assertTrainingDay(result[6], startDate.plusDays(6), TrainingType.PUSH, trainingDays[0])
        // Day 8: Rest
        assertRestDay(result[7], startDate.plusDays(7))
        // Day 9: Pull
        assertTrainingDay(result[8], startDate.plusDays(8), TrainingType.PULL, trainingDays[1])
    }

    @Test
    fun fixedInterval_withZeroRestDays_trainsEveryDay() {
        val plan = createPlan(
            scheduleMode = ScheduleDayType.FIXED_INTERVAL,
            intervalDays = 0,
        )
        val trainingDays = listOf(
            createTrainingDay("td-1", "Push", TrainingType.PUSH, orderIndex = 0),
            createTrainingDay("td-2", "Pull", TrainingType.PULL, orderIndex = 1),
        )
        val startDate = LocalDate.parse("2026-01-12")
        val endDate = LocalDate.parse("2026-01-15")

        val result = calculator.computeSchedule(plan, trainingDays, emptyList(), startDate, endDate)

        assertEquals(4, result.size)
        assertTrainingDay(result[0], startDate, TrainingType.PUSH, trainingDays[0])
        assertTrainingDay(result[1], startDate.plusDays(1), TrainingType.PULL, trainingDays[1])
        assertTrainingDay(result[2], startDate.plusDays(2), TrainingType.PUSH, trainingDays[0])
        assertTrainingDay(result[3], startDate.plusDays(3), TrainingType.PULL, trainingDays[1])
    }

    @Test
    fun fixedInterval_withTwoRestDays_cyclesCorrectly() {
        val plan = createPlan(
            scheduleMode = ScheduleDayType.FIXED_INTERVAL,
            intervalDays = 2,
        )
        val trainingDays = listOf(
            createTrainingDay("td-1", "Push", TrainingType.PUSH, orderIndex = 0),
            createTrainingDay("td-2", "Legs", TrainingType.LEGS, orderIndex = 1),
        )
        val startDate = LocalDate.parse("2026-01-12")
        val endDate = LocalDate.parse("2026-01-20")

        val result = calculator.computeSchedule(plan, trainingDays, emptyList(), startDate, endDate)

        assertEquals(9, result.size)
        // Day 1: Push
        assertTrainingDay(result[0], startDate, TrainingType.PUSH, trainingDays[0])
        // Day 2-3: Rest (2 rest days)
        assertRestDay(result[1], startDate.plusDays(1))
        assertRestDay(result[2], startDate.plusDays(2))
        // Day 4: Legs
        assertTrainingDay(result[3], startDate.plusDays(3), TrainingType.LEGS, trainingDays[1])
        // Day 5-6: Rest
        assertRestDay(result[4], startDate.plusDays(4))
        assertRestDay(result[5], startDate.plusDays(5))
        // Day 7: Push (cycle back)
        assertTrainingDay(result[6], startDate.plusDays(6), TrainingType.PUSH, trainingDays[0])
        // Day 8-9: Rest
        assertRestDay(result[7], startDate.plusDays(7))
        assertRestDay(result[8], startDate.plusDays(8))
    }

    // ============== Workout session overlay tests ==============

    @Test
    fun completedWorkoutSessions_overlayOntoSchedule() {
        val plan = createPlan(scheduleMode = ScheduleDayType.WEEKLY_FIXED)
        val trainingDays = listOf(
            createTrainingDay("td-1", "Push", TrainingType.PUSH, orderIndex = 0),
        )
        val startDate = LocalDate.parse("2026-01-12")
        val endDate = startDate.plusDays(2)

        val workoutSession = WorkoutSession(
            id = "ws-1",
            planId = "plan-1",
            trainingDayId = "td-1",
            recordDate = startDate,
            trainingType = TrainingType.PUSH,
            workoutStatus = WorkoutStatus.COMPLETED,
            startedAt = baseInstant,
            endedAt = baseInstant,
            isBackfill = false,
            createdAt = baseInstant,
            updatedAt = baseInstant,
        )

        val result = calculator.computeSchedule(
            plan, trainingDays, listOf(workoutSession), startDate, endDate,
        )

        assertEquals(3, result.size)
        // Day 1 should have workout session overlaid
        assertEquals(workoutSession, result[0].workoutSession)
        assertEquals(DayType.TRAINING, result[0].type)
    }

    @Test
    fun workoutSessionOnRestDay_showsSessionOnRestDay() {
        val plan = createPlan(scheduleMode = ScheduleDayType.FIXED_INTERVAL, intervalDays = 1)
        val trainingDays = listOf(
            createTrainingDay("td-1", "Push", TrainingType.PUSH, orderIndex = 0),
        )
        val startDate = LocalDate.parse("2026-01-12")
        val endDate = startDate.plusDays(2)

        // Workout on a rest day (Day 2)
        val workoutSession = WorkoutSession(
            id = "ws-1",
            planId = "plan-1",
            trainingDayId = null,
            recordDate = startDate.plusDays(1),
            trainingType = TrainingType.OTHER,
            workoutStatus = WorkoutStatus.COMPLETED,
            startedAt = baseInstant,
            endedAt = baseInstant,
            isBackfill = false,
            createdAt = baseInstant,
            updatedAt = baseInstant,
        )

        val result = calculator.computeSchedule(
            plan, trainingDays, listOf(workoutSession), startDate, endDate,
        )

        assertEquals(3, result.size)
        // Rest day should still be rest but have session overlaid
        assertEquals(DayType.REST, result[1].type)
        assertEquals(workoutSession, result[1].workoutSession)
    }

    // ============== isToday flag tests ==============

    @Test
    fun isToday_isSetForCurrentDate() {
        val plan = createPlan(scheduleMode = ScheduleDayType.WEEKLY_FIXED)
        val trainingDays = listOf(
            createTrainingDay("td-1", "Push", TrainingType.PUSH, orderIndex = 0),
        )
        val today = LocalDate.parse("2026-01-12")
        val startDate = today
        val endDate = today.plusDays(2)

        val result = calculator.computeSchedule(
            plan, trainingDays, emptyList(), startDate, endDate, today,
        )

        assertTrue(result[0].isToday)
        assertFalse(result[1].isToday)
        assertFalse(result[2].isToday)
    }

    @Test
    fun isToday_defaultsToNoFlagWhenNotProvided() {
        val plan = createPlan(scheduleMode = ScheduleDayType.WEEKLY_FIXED)
        val trainingDays = listOf(
            createTrainingDay("td-1", "Push", TrainingType.PUSH, orderIndex = 0),
        )
        val startDate = LocalDate.parse("2026-01-12")
        val endDate = startDate.plusDays(2)

        val result = calculator.computeSchedule(
            plan, trainingDays, emptyList(), startDate, endDate,
        )

        // Without passing today, no day should be marked as today
        result.forEach { day ->
            assertFalse(day.isToday)
        }
    }

    // ============== Edge cases ==============

    @Test
    fun emptyTrainingDays_producesAllRestDays() {
        val plan = createPlan(scheduleMode = ScheduleDayType.WEEKLY_FIXED)
        val startDate = LocalDate.parse("2026-01-12")
        val endDate = startDate.plusDays(3)

        val result = calculator.computeSchedule(plan, emptyList(), emptyList(), startDate, endDate)

        assertEquals(4, result.size)
        result.forEach { day ->
            assertEquals(DayType.REST, day.type)
            assertNull(day.trainingDay)
        }
    }

    @Test
    fun singleTrainingDay_weeklyFixed_appearsOncePerWeek() {
        val plan = createPlan(scheduleMode = ScheduleDayType.WEEKLY_FIXED)
        val trainingDays = listOf(
            createTrainingDay("td-1", "Push", TrainingType.PUSH, orderIndex = 0),
        )
        val startDate = LocalDate.parse("2026-01-12") // Monday
        val endDate = LocalDate.parse("2026-01-18")   // Sunday

        val result = calculator.computeSchedule(plan, trainingDays, emptyList(), startDate, endDate)

        assertEquals(7, result.size)
        // Only Monday is training
        assertEquals(DayType.TRAINING, result[0].type)
        // Tue-Sun are rest
        for (i in 1..6) {
            assertEquals(DayType.REST, result[i].type)
        }
    }

    @Test
    fun scheduleSpanningLessThanOneWeek_weeklyFixed() {
        val plan = createPlan(scheduleMode = ScheduleDayType.WEEKLY_FIXED)
        val trainingDays = listOf(
            createTrainingDay("td-1", "Push", TrainingType.PUSH, orderIndex = 0),
            createTrainingDay("td-2", "Pull", TrainingType.PULL, orderIndex = 1),
        )
        val startDate = LocalDate.parse("2026-01-12") // Monday
        val endDate = LocalDate.parse("2026-01-13")   // Tuesday

        val result = calculator.computeSchedule(plan, trainingDays, emptyList(), startDate, endDate)

        assertEquals(2, result.size)
        assertTrainingDay(result[0], startDate, TrainingType.PUSH, trainingDays[0])
        assertTrainingDay(result[1], startDate.plusDays(1), TrainingType.PULL, trainingDays[1])
    }

    @Test
    fun startDateAfterEndDate_returnsEmptyList() {
        val plan = createPlan(scheduleMode = ScheduleDayType.WEEKLY_FIXED)
        val startDate = LocalDate.parse("2026-01-15")
        val endDate = LocalDate.parse("2026-01-12")

        val result = calculator.computeSchedule(plan, emptyList(), emptyList(), startDate, endDate)

        assertEquals(0, result.size)
    }

    @Test
    fun sameStartAndEndDate_returnsSingleDay() {
        val plan = createPlan(scheduleMode = ScheduleDayType.WEEKLY_FIXED)
        val trainingDays = listOf(
            createTrainingDay("td-1", "Push", TrainingType.PUSH, orderIndex = 0),
        )
        val date = LocalDate.parse("2026-01-12")

        val result = calculator.computeSchedule(plan, trainingDays, emptyList(), date, date)

        assertEquals(1, result.size)
        assertTrainingDay(result[0], date, TrainingType.PUSH, trainingDays[0])
    }

    // ============== Helper functions ==============

    private fun createScheduleDay(
        date: LocalDate,
        isSkipped: Boolean,
    ) = ScheduleDay(
        date = date,
        type = DayType.TRAINING,
        trainingDay = null,
        workoutSession = null,
        otherSportRecord = null,
        isSkipped = isSkipped,
        isToday = false,
    )

    private fun createPlan(
        scheduleMode: ScheduleDayType,
        intervalDays: Int? = null,
    ) = TrainingPlan(
        id = "plan-1",
        displayName = "Test Plan",
        planMode = PlanMode.INFINITE_LOOP,
        cycleLength = null,
        scheduleMode = scheduleMode,
        intervalDays = intervalDays,
        isActive = true,
        createdAt = baseInstant,
        updatedAt = baseInstant,
    )

    private fun createTrainingDay(
        id: String,
        displayName: String,
        dayType: TrainingType,
        orderIndex: Int,
    ) = TrainingDay(
        id = id,
        planId = "plan-1",
        displayName = displayName,
        dayType = dayType,
        orderIndex = orderIndex,
        createdAt = baseInstant,
        updatedAt = baseInstant,
    )

    private fun assertTrainingDay(
        day: ScheduleDay,
        expectedDate: LocalDate,
        expectedType: TrainingType,
        expectedTrainingDay: TrainingDay,
    ) {
        assertEquals(expectedDate, day.date)
        assertEquals(DayType.TRAINING, day.type)
        assertEquals(expectedTrainingDay, day.trainingDay)
        assertEquals(expectedType, day.trainingDay?.dayType)
    }

    private fun assertRestDay(
        day: ScheduleDay,
        expectedDate: LocalDate,
    ) {
        assertEquals(expectedDate, day.date)
        assertEquals(DayType.REST, day.type)
        assertNull(day.trainingDay)
    }
}
