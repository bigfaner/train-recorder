package com.trainrecorder.viewmodel

import com.trainrecorder.domain.model.PlanMode
import com.trainrecorder.domain.model.ScheduleDayType
import com.trainrecorder.domain.model.TrainingDay
import com.trainrecorder.domain.model.TrainingPlan
import com.trainrecorder.domain.model.TrainingType
import com.trainrecorder.domain.repository.PlanWithDays
import com.trainrecorder.domain.repository.TrainingDayWithExercises
import com.trainrecorder.domain.repository.TrainingPlanRepository
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Clock
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class PlanViewModelTest {

    private fun makePlan(
        id: String = "plan1",
        isActive: Boolean = true,
        displayName: String = "Test Plan",
    ) = TrainingPlan(
        id = id,
        displayName = displayName,
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
        orderIndex: Int = 0,
    ) = TrainingDay(
        id = id,
        planId = planId,
        displayName = "Day $orderIndex",
        dayType = TrainingType.PUSH,
        orderIndex = orderIndex,
        createdAt = Clock.System.now(),
        updatedAt = Clock.System.now(),
    )

    private class FakePlanRepository(
        activePlan: TrainingPlan? = null,
        allPlans: List<TrainingPlan> = emptyList(),
        planWithDays: PlanWithDays? = null,
        private val createPlanResult: Result<String> = Result.success("new-plan"),
        private val updatePlanResult: Result<Unit> = Result.success(Unit),
        private val activatePlanResult: Result<Unit> = Result.success(Unit),
        private val deletePlanResult: Result<Unit> = Result.success(Unit),
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
            createPlanResult

        override suspend fun updatePlan(plan: TrainingPlan, days: List<TrainingDayWithExercises>): Result<Unit> =
            updatePlanResult

        override suspend fun activatePlan(planId: String): Result<Unit> = activatePlanResult
        override suspend fun deletePlan(planId: String): Result<Unit> = deletePlanResult
    }

    @Test
    fun `initial state has correct defaults`() {
        val testScope = TestScope()
        val vm = PlanViewModel(
            planRepository = FakePlanRepository(),
            coroutineScope = testScope,
        )

        val state = vm.state.value
        assertNull(state.activePlan)
        assertTrue(state.allPlans.isEmpty())
        assertFalse(state.isLoaded)
        assertFalse(state.isSaving)
        assertNull(state.error)
    }

    @Test
    fun `plans are loaded on init`() = runTest {
        val plan = makePlan()
        val testScope = TestScope()
        val vm = PlanViewModel(
            planRepository = FakePlanRepository(
                activePlan = plan,
                allPlans = listOf(plan),
            ),
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertTrue(state.isLoaded)
        assertEquals(1, state.allPlans.size)
        assertEquals("plan1", state.allPlans[0].id)
    }

    @Test
    fun `activePlan with days is loaded`() = runTest {
        val plan = makePlan()
        val day = makeTrainingDay()
        val planWithDays = PlanWithDays(plan, listOf(TrainingDayWithExercises(day, emptyList())))

        val testScope = TestScope()
        val vm = PlanViewModel(
            planRepository = FakePlanRepository(
                activePlan = plan,
                allPlans = listOf(plan),
                planWithDays = planWithDays,
            ),
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertTrue(state.isLoaded)
        assertNotNull(state.activePlan)
        assertEquals("plan1", state.activePlan!!.plan.id)
        assertEquals(1, state.activePlan!!.days.size)
    }

    @Test
    fun `createPlan resets saving state`() = runTest {
        val plan = makePlan(id = "new-plan")
        val days = listOf(TrainingDayWithExercises(makeTrainingDay(id = "new-day"), emptyList()))

        val testScope = TestScope()
        val vm = PlanViewModel(
            planRepository = FakePlanRepository(
                createPlanResult = Result.success("new-plan"),
            ),
            coroutineScope = testScope,
        )

        vm.onEvent(PlanEvent.CreatePlan(plan, days))
        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertFalse(state.isSaving)
    }

    @Test
    fun `createPlan handles failure`() = runTest {
        val plan = makePlan(id = "fail-plan")
        val days = emptyList<TrainingDayWithExercises>()

        val testScope = TestScope()
        val vm = PlanViewModel(
            planRepository = FakePlanRepository(
                createPlanResult = Result.failure(Exception("Validation error")),
            ),
            coroutineScope = testScope,
        )

        vm.onEvent(PlanEvent.CreatePlan(plan, days))
        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertFalse(state.isSaving)
        assertEquals("Validation error", state.error)
    }

    @Test
    fun `updatePlan resets saving state`() = runTest {
        val plan = makePlan()
        val days = listOf(TrainingDayWithExercises(makeTrainingDay(), emptyList()))

        val testScope = TestScope()
        val vm = PlanViewModel(
            planRepository = FakePlanRepository(
                updatePlanResult = Result.success(Unit),
            ),
            coroutineScope = testScope,
        )

        vm.onEvent(PlanEvent.UpdatePlan(plan, days))
        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertFalse(state.isSaving)
    }

    @Test
    fun `activatePlan resets saving state`() = runTest {
        val testScope = TestScope()
        val vm = PlanViewModel(
            planRepository = FakePlanRepository(
                activatePlanResult = Result.success(Unit),
            ),
            coroutineScope = testScope,
        )

        vm.onEvent(PlanEvent.ActivatePlan("plan1"))
        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertFalse(state.isSaving)
    }

    @Test
    fun `activatePlan handles failure`() = runTest {
        val testScope = TestScope()
        val vm = PlanViewModel(
            planRepository = FakePlanRepository(
                activatePlanResult = Result.failure(Exception("Plan not found")),
            ),
            coroutineScope = testScope,
        )

        vm.onEvent(PlanEvent.ActivatePlan("bad-plan"))
        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertFalse(state.isSaving)
        assertEquals("Plan not found", state.error)
    }

    @Test
    fun `deletePlan resets saving state`() = runTest {
        val testScope = TestScope()
        val vm = PlanViewModel(
            planRepository = FakePlanRepository(
                deletePlanResult = Result.success(Unit),
            ),
            coroutineScope = testScope,
        )

        vm.onEvent(PlanEvent.DeletePlan("plan1"))
        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertFalse(state.isSaving)
    }

    @Test
    fun `deletePlan handles failure`() = runTest {
        val testScope = TestScope()
        val vm = PlanViewModel(
            planRepository = FakePlanRepository(
                deletePlanResult = Result.failure(Exception("Plan not found")),
            ),
            coroutineScope = testScope,
        )

        vm.onEvent(PlanEvent.DeletePlan("bad-plan"))
        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertFalse(state.isSaving)
        assertEquals("Plan not found", state.error)
    }

    @Test
    fun `multiple plans are listed`() = runTest {
        val plan1 = makePlan(id = "plan1", displayName = "Plan A")
        val plan2 = makePlan(id = "plan2", displayName = "Plan B", isActive = false)

        val testScope = TestScope()
        val vm = PlanViewModel(
            planRepository = FakePlanRepository(
                activePlan = plan1,
                allPlans = listOf(plan1, plan2),
            ),
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertTrue(state.isLoaded)
        assertEquals(2, state.allPlans.size)
    }
}
