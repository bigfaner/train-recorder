package com.trainrecorder.viewmodel

import com.trainrecorder.domain.model.PlanMode
import com.trainrecorder.domain.model.ScheduleDayType
import com.trainrecorder.domain.model.TrainingDay
import com.trainrecorder.domain.model.TrainingPlan
import com.trainrecorder.domain.model.TrainingType
import com.trainrecorder.domain.model.WorkoutSession
import com.trainrecorder.domain.model.WorkoutStatus
import com.trainrecorder.domain.repository.PlanWithDays
import com.trainrecorder.domain.repository.TrainingDayWithExercises
import com.trainrecorder.domain.repository.TrainingPlanRepository
import com.trainrecorder.domain.repository.WorkoutRepository
import com.trainrecorder.domain.usecase.DayType
import com.trainrecorder.domain.usecase.ScheduleCalculator
import com.trainrecorder.domain.usecase.ScheduleDay
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Clock
import kotlinx.datetime.DatePeriod
import kotlinx.datetime.LocalDate
import kotlinx.datetime.minus
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class CalendarViewModelTest {

    private val today = LocalDate(2026, 5, 11)

    private fun makePlan(
        id: String = "plan1",
        isActive: Boolean = true,
    ) = TrainingPlan(
        id = id,
        displayName = "Test Plan",
        planMode = PlanMode.INFINITE_LOOP,
        cycleLength = null,
        scheduleMode = ScheduleDayType.WEEKLY_FIXED,
        intervalDays = null,
        isActive = isActive,
        createdAt = Clock.System.now(),
        updatedAt = Clock.System.now(),
    )

    private fun makeTrainingDay(
        id: String = "day1",
        planId: String = "plan1",
        dayType: TrainingType = TrainingType.PUSH,
        orderIndex: Int = 0,
    ) = TrainingDay(
        id = id,
        planId = planId,
        displayName = "Day $orderIndex",
        dayType = dayType,
        orderIndex = orderIndex,
        createdAt = Clock.System.now(),
        updatedAt = Clock.System.now(),
    )

    private fun makeSession(
        id: String = "session1",
        date: LocalDate = today,
        status: WorkoutStatus = WorkoutStatus.IN_PROGRESS,
    ) = WorkoutSession(
        id = id,
        planId = "plan1",
        trainingDayId = "day1",
        recordDate = date,
        trainingType = TrainingType.PUSH,
        workoutStatus = status,
        startedAt = Clock.System.now(),
        endedAt = null,
        isBackfill = false,
        createdAt = Clock.System.now(),
        updatedAt = Clock.System.now(),
    )

    /**
     * Simple fake PlanRepository with controllable state flows.
     */
    private class FakePlanRepository(
        activePlan: TrainingPlan? = null,
        allPlans: List<TrainingPlan> = emptyList(),
        planWithDays: PlanWithDays? = null,
    ) : TrainingPlanRepository {
        private val _activePlan = MutableStateFlow(activePlan)
        private val _allPlans = MutableStateFlow(allPlans)
        private val _planWithDaysMap = mutableMapOf<String, MutableStateFlow<PlanWithDays?>>()

        init {
            if (planWithDays != null) {
                _planWithDaysMap[planWithDays.plan.id] = MutableStateFlow(planWithDays)
            }
        }

        override fun getActivePlan(): StateFlow<TrainingPlan?> = _activePlan
        override fun getAllPlans(): StateFlow<List<TrainingPlan>> = _allPlans
        override fun getPlanWithDays(planId: String): StateFlow<PlanWithDays?> =
            _planWithDaysMap.getOrPut(planId) { MutableStateFlow(null) }

        override suspend fun createPlan(plan: TrainingPlan, days: List<TrainingDayWithExercises>): Result<String> =
            Result.success(plan.id)

        override suspend fun updatePlan(plan: TrainingPlan, days: List<TrainingDayWithExercises>): Result<Unit> =
            Result.success(Unit)

        override suspend fun activatePlan(planId: String): Result<Unit> = Result.success(Unit)
        override suspend fun deletePlan(planId: String): Result<Unit> = Result.success(Unit)
    }

    private class FakeWorkoutRepository(
        sessions: List<WorkoutSession> = emptyList(),
    ) : WorkoutRepository {
        private val _sessions = MutableStateFlow(sessions)

        override fun getSessionsByDateRange(
            startDate: LocalDate,
            endDate: LocalDate,
        ): StateFlow<List<WorkoutSession>> = _sessions

        override fun getSessionWithDetails(sessionId: String): StateFlow<com.trainrecorder.domain.repository.WorkoutSessionDetail?> =
            MutableStateFlow(null)

        override suspend fun createSession(
            session: WorkoutSession,
            exercises: List<com.trainrecorder.domain.repository.WorkoutExerciseInput>,
        ): Result<String> = Result.success("new")

        override suspend fun updateSessionStatus(sessionId: String, status: WorkoutStatus): Result<Unit> =
            Result.success(Unit)

        override suspend fun recordSet(
            workoutExerciseId: String,
            set: com.trainrecorder.domain.repository.ExerciseSetInput,
        ): Result<com.trainrecorder.domain.model.ExerciseSet> =
            Result.failure(Exception("not implemented"))

        override suspend fun updateExerciseStatus(
            workoutExerciseId: String,
            status: com.trainrecorder.domain.model.ExerciseStatus,
        ): Result<Unit> = Result.success(Unit)

        override suspend fun completeSession(sessionId: String): Result<Unit> = Result.success(Unit)
        override suspend fun partialCompleteSession(sessionId: String): Result<Unit> = Result.success(Unit)
        override suspend fun deleteSession(sessionId: String): Result<Unit> = Result.success(Unit)
        override suspend fun backfillSession(
            session: WorkoutSession,
            exercises: List<com.trainrecorder.domain.repository.WorkoutExerciseWithSets>,
        ): Result<String> = Result.success("backfill")
    }

    @Test
    fun `initial state has correct defaults`() {
        val testScope = TestScope()
        val vm = CalendarViewModel(
            planRepository = FakePlanRepository(),
            workoutRepository = FakeWorkoutRepository(),
            scheduleCalculator = ScheduleCalculator(),
            today = today,
            coroutineScope = testScope,
        )

        val state = vm.state.value
        assertEquals(YearMonth(2026, 5), state.month)
        assertFalse(state.isLoaded)
        assertNull(state.todaySummary)
        assertEquals(0, state.consecutiveSkips)
    }

    @Test
    fun `state is loaded after active plan emits`() = runTest {
        val plan = makePlan()
        val trainingDays = listOf(makeTrainingDay())
        val planWithDays = PlanWithDays(plan, listOf(TrainingDayWithExercises(trainingDays[0], emptyList())))

        val testScope = TestScope()
        val vm = CalendarViewModel(
            planRepository = FakePlanRepository(
                activePlan = plan,
                allPlans = listOf(plan),
                planWithDays = planWithDays,
            ),
            workoutRepository = FakeWorkoutRepository(),
            scheduleCalculator = ScheduleCalculator(),
            today = today,
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertTrue(state.isLoaded)
        assertTrue(state.scheduleDays.isNotEmpty())
    }

    @Test
    fun `todaySummary is set for current date`() = runTest {
        val plan = makePlan()
        val trainingDays = listOf(makeTrainingDay(orderIndex = 0))
        val planWithDays = PlanWithDays(plan, listOf(TrainingDayWithExercises(trainingDays[0], emptyList())))

        val testScope = TestScope()
        val vm = CalendarViewModel(
            planRepository = FakePlanRepository(
                activePlan = plan,
                allPlans = listOf(plan),
                planWithDays = planWithDays,
            ),
            workoutRepository = FakeWorkoutRepository(),
            scheduleCalculator = ScheduleCalculator(),
            today = today,
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertTrue(state.isLoaded)
        assertNotNull(state.todaySummary)
        assertEquals(today, state.todaySummary!!.date)
    }

    @Test
    fun `selectDate updates selected date`() {
        val testScope = TestScope()
        val vm = CalendarViewModel(
            planRepository = FakePlanRepository(),
            workoutRepository = FakeWorkoutRepository(),
            scheduleCalculator = ScheduleCalculator(),
            today = today,
            coroutineScope = testScope,
        )

        val testDate = LocalDate(2026, 5, 15)
        vm.onEvent(CalendarEvent.SelectDate(testDate))
        assertEquals(testDate, vm.selectedDate.value)
    }

    @Test
    fun `skipDay marks day as skipped`() = runTest {
        val plan = makePlan()
        val trainingDays = listOf(makeTrainingDay(orderIndex = 0))
        val planWithDays = PlanWithDays(plan, listOf(TrainingDayWithExercises(trainingDays[0], emptyList())))

        val testScope = TestScope()
        val vm = CalendarViewModel(
            planRepository = FakePlanRepository(
                activePlan = plan,
                allPlans = listOf(plan),
                planWithDays = planWithDays,
            ),
            workoutRepository = FakeWorkoutRepository(),
            scheduleCalculator = ScheduleCalculator(),
            today = today,
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()

        val skipDate = LocalDate(2026, 5, 12)
        vm.onEvent(CalendarEvent.SkipDay(skipDate))

        val state = vm.state.value
        val skippedDay = state.scheduleDays.find { it.date == skipDate }
        assertNotNull(skippedDay)
        assertTrue(skippedDay!!.isSkipped)
    }

    @Test
    fun `unskipDay removes skip from day`() = runTest {
        val plan = makePlan()
        val trainingDays = listOf(makeTrainingDay(orderIndex = 0))
        val planWithDays = PlanWithDays(plan, listOf(TrainingDayWithExercises(trainingDays[0], emptyList())))

        val testScope = TestScope()
        val vm = CalendarViewModel(
            planRepository = FakePlanRepository(
                activePlan = plan,
                allPlans = listOf(plan),
                planWithDays = planWithDays,
            ),
            workoutRepository = FakeWorkoutRepository(),
            scheduleCalculator = ScheduleCalculator(),
            today = today,
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()

        val skipDate = LocalDate(2026, 5, 12)
        vm.onEvent(CalendarEvent.SkipDay(skipDate))
        assertTrue(vm.state.value.scheduleDays.find { it.date == skipDate }?.isSkipped == true)

        vm.onEvent(CalendarEvent.UnskipDay(skipDate))
        val day = vm.state.value.scheduleDays.find { it.date == skipDate }
        assertNotNull(day)
        assertFalse(day!!.isSkipped)
    }

    @Test
    fun `empty state when no active plan`() = runTest {
        val testScope = TestScope()
        val vm = CalendarViewModel(
            planRepository = FakePlanRepository(activePlan = null),
            workoutRepository = FakeWorkoutRepository(),
            scheduleCalculator = ScheduleCalculator(),
            today = today,
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertTrue(state.isLoaded)
        assertTrue(state.scheduleDays.isEmpty())
    }

    @Test
    fun `consecutiveSkips tracks skip streak`() {
        val calc = ScheduleCalculator()
        val scheduleDays = listOf(
            ScheduleDay(
                date = today,
                type = DayType.TRAINING,
                trainingDay = null,
                workoutSession = null,
                otherSportRecord = null,
                isSkipped = true,
                isToday = true,
            ),
            ScheduleDay(
                date = today.minus(DatePeriod(days = 1)),
                type = DayType.TRAINING,
                trainingDay = null,
                workoutSession = null,
                otherSportRecord = null,
                isSkipped = true,
                isToday = false,
            ),
            ScheduleDay(
                date = today.minus(DatePeriod(days = 2)),
                type = DayType.TRAINING,
                trainingDay = null,
                workoutSession = null,
                otherSportRecord = null,
                isSkipped = false,
                isToday = false,
            ),
        )

        val consecutiveSkips = calc.computeConsecutiveSkips(scheduleDays, today)
        assertEquals(2, consecutiveSkips)
    }

    @Test
    fun `adjustDate moves training from one date to another`() = runTest {
        val plan = makePlan()
        val trainingDays = listOf(makeTrainingDay(orderIndex = 0))
        val planWithDays = PlanWithDays(plan, listOf(TrainingDayWithExercises(trainingDays[0], emptyList())))

        val testScope = TestScope()
        val vm = CalendarViewModel(
            planRepository = FakePlanRepository(
                activePlan = plan,
                allPlans = listOf(plan),
                planWithDays = planWithDays,
            ),
            workoutRepository = FakeWorkoutRepository(),
            scheduleCalculator = ScheduleCalculator(),
            today = today,
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()

        // May 1 is dayIndex=0, which has training day (0 % 7 = 0 < 1 training day)
        // May 3 is dayIndex=2, which is rest (2 % 7 = 2 >= 1 training day)
        val fromDate = LocalDate(2026, 5, 1)
        val toDate = LocalDate(2026, 5, 3)

        // Verify fromDate has training before adjustment
        val beforeFrom = vm.state.value.scheduleDays.find { it.date == fromDate }
        assertNotNull(beforeFrom?.trainingDay)

        vm.onEvent(CalendarEvent.AdjustDate(fromDate, toDate))

        val state = vm.state.value
        val fromDay = state.scheduleDays.find { it.date == fromDate }
        val toDay = state.scheduleDays.find { it.date == toDate }

        assertNotNull(fromDay)
        assertNotNull(toDay)
        assertNull(fromDay!!.trainingDay)
        assertNotNull(toDay!!.trainingDay)
    }

    @Test
    fun `YearMonth startDate returns first day of month`() {
        val ym = YearMonth(2026, 5)
        assertEquals(LocalDate(2026, 5, 1), ym.startDate())
    }

    @Test
    fun `YearMonth endDate returns last day of month`() {
        val ym = YearMonth(2026, 5)
        assertEquals(LocalDate(2026, 5, 31), ym.endDate())
    }

    @Test
    fun `YearMonth endDate handles February in non-leap year`() {
        val ym = YearMonth(2025, 2)
        assertEquals(LocalDate(2025, 2, 28), ym.endDate())
    }

    @Test
    fun `YearMonth endDate handles February in leap year`() {
        val ym = YearMonth(2024, 2)
        assertEquals(LocalDate(2024, 2, 29), ym.endDate())
    }

    @Test
    fun `YearMonth plus advances month correctly`() {
        val ym = YearMonth(2026, 5)
        assertEquals(YearMonth(2026, 6), ym.plus(1))
        assertEquals(YearMonth(2026, 7), ym.plus(2))
        assertEquals(YearMonth(2027, 1), ym.plus(8))
        assertEquals(YearMonth(2027, 5), ym.plus(12))
    }

    @Test
    fun `YearMonth minus goes back month correctly`() {
        val ym = YearMonth(2026, 5)
        assertEquals(YearMonth(2026, 4), ym.minus(1))
        assertEquals(YearMonth(2026, 1), ym.minus(4))
        assertEquals(YearMonth(2025, 12), ym.minus(5))
        assertEquals(YearMonth(2025, 5), ym.minus(12))
    }

    @Test
    fun `YearMonth plus wraps year boundary`() {
        val ym = YearMonth(2026, 12)
        assertEquals(YearMonth(2027, 1), ym.plus(1))
        assertEquals(YearMonth(2027, 6), ym.plus(6))
    }

    @Test
    fun `YearMonth minus wraps year boundary`() {
        val ym = YearMonth(2026, 1)
        assertEquals(YearMonth(2025, 12), ym.minus(1))
        assertEquals(YearMonth(2025, 7), ym.minus(6))
    }
}
