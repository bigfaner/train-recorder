package com.trainrecorder.data.repository

import com.trainrecorder.createTestDatabase
import com.trainrecorder.db.TrainRecorderDatabase
import com.trainrecorder.domain.model.DomainError
import com.trainrecorder.domain.model.ExerciseMode
import com.trainrecorder.domain.model.PlanMode
import com.trainrecorder.domain.model.ScheduleDayType
import com.trainrecorder.domain.model.TrainingDay
import com.trainrecorder.domain.model.TrainingDayExercise
import com.trainrecorder.domain.model.TrainingPlan
import com.trainrecorder.domain.model.TrainingType
import com.trainrecorder.domain.repository.TrainingDayWithExercises
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Instant
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class TrainingPlanRepositoryImplTest {

    private fun createRepository(): Pair<TrainingPlanRepositoryImpl, TrainRecorderDatabase> {
        val db = createTestDatabase()
        return TrainingPlanRepositoryImpl(db) to db
    }

    private val testInstant = Instant.parse("2025-01-15T10:30:00Z")

    private fun createTestPlan(
        id: String = "plan-1",
        displayName: String = "Test Plan",
        planMode: PlanMode = PlanMode.INFINITE_LOOP,
        scheduleMode: ScheduleDayType = ScheduleDayType.WEEKLY_FIXED,
        isActive: Boolean = false,
    ) = TrainingPlan(
        id = id,
        displayName = displayName,
        planMode = planMode,
        cycleLength = if (planMode == PlanMode.FIXED_CYCLE) 4 else null,
        scheduleMode = scheduleMode,
        intervalDays = if (scheduleMode == ScheduleDayType.FIXED_INTERVAL) 1 else null,
        isActive = isActive,
        createdAt = testInstant,
        updatedAt = testInstant,
    )

    private fun createTestDay(
        id: String = "day-1",
        planId: String = "plan-1",
        displayName: String = "Push Day",
        dayType: TrainingType = TrainingType.PUSH,
        orderIndex: Int = 1,
    ) = TrainingDay(
        id = id,
        planId = planId,
        displayName = displayName,
        dayType = dayType,
        orderIndex = orderIndex,
        createdAt = testInstant,
        updatedAt = testInstant,
    )

    private fun createTestDayExercise(
        id: String = "dex-1",
        dayId: String = "day-1",
        exerciseId: String = "ex-1",
        orderIndex: Int = 1,
        targetSets: Int = 3,
        targetReps: Int = 5,
    ) = TrainingDayExercise(
        id = id,
        trainingDayId = dayId,
        exerciseId = exerciseId,
        orderIndex = orderIndex,
        exerciseMode = ExerciseMode.FIXED,
        targetSets = targetSets,
        targetReps = targetReps,
        startWeight = 60.0,
        note = null,
        restSeconds = 180,
        weightIncrement = 2.5,
        createdAt = testInstant,
        updatedAt = testInstant,
    )

    private fun createFullPlanData(
        planId: String = "plan-1",
        isActive: Boolean = false,
    ): Pair<TrainingPlan, List<TrainingDayWithExercises>> {
        val plan = createTestPlan(id = planId, isActive = isActive)
        val day1 = createTestDay(id = "day-1", planId = planId, displayName = "Push", dayType = TrainingType.PUSH, orderIndex = 1)
        val day2 = createTestDay(id = "day-2", planId = planId, displayName = "Pull", dayType = TrainingType.PULL, orderIndex = 2)
        val ex1 = createTestDayExercise(id = "dex-1", dayId = "day-1", exerciseId = "ex-1")
        val ex2 = createTestDayExercise(id = "dex-2", dayId = "day-2", exerciseId = "ex-2")
        val days = listOf(
            TrainingDayWithExercises(day1, listOf(ex1)),
            TrainingDayWithExercises(day2, listOf(ex2)),
        )
        return plan to days
    }

    // ============================================================
    // Create Plan
    // ============================================================

    @Test
    fun testCreatePlan() = runTest {
        val (repo, _) = createRepository()
        val (plan, days) = createFullPlanData()

        val result = repo.createPlan(plan, days)
        assertTrue(result.isSuccess)
        assertEquals("plan-1", result.getOrThrow())

        val plans = repo.getAllPlans().first()
        assertEquals(1, plans.size)
        assertEquals("Test Plan", plans[0].displayName)
    }

    @Test
    fun testCreatePlanWithNestedDaysAndExercises() = runTest {
        val (repo, _) = createRepository()
        val (plan, days) = createFullPlanData()

        repo.createPlan(plan, days)

        val planWithDays = repo.getPlanWithDays("plan-1").first()
        assertNotNull(planWithDays)
        assertEquals(2, planWithDays.days.size)
        assertEquals("Push", planWithDays.days[0].day.displayName)
        assertEquals("Pull", planWithDays.days[1].day.displayName)
        assertEquals(1, planWithDays.days[0].exercises.size)
        assertEquals("ex-1", planWithDays.days[0].exercises[0].exerciseId)
    }

    @Test
    fun testCreatePlanInactive() = runTest {
        val (repo, _) = createRepository()
        val (plan, days) = createFullPlanData(isActive = false)

        repo.createPlan(plan, days)

        val active = repo.getActivePlan().first()
        assertNull(active)
    }

    // ============================================================
    // Activate Plan
    // ============================================================

    @Test
    fun testActivatePlan() = runTest {
        val (repo, _) = createRepository()
        val (plan, days) = createFullPlanData(isActive = false)
        repo.createPlan(plan, days)

        val result = repo.activatePlan("plan-1")
        assertTrue(result.isSuccess)

        val active = repo.getActivePlan().first()
        assertNotNull(active)
        assertEquals("plan-1", active.id)
    }

    @Test
    fun testActivatePlanDeactivatesOthers() = runTest {
        val (repo, _) = createRepository()

        // Create two plans, activate first
        val (plan1, days1) = createFullPlanData(planId = "plan-1", isActive = true)
        repo.createPlan(plan1, days1)

        val (plan2, days2) = createFullPlanData(planId = "plan-2", isActive = false)
        val plan2WithUniqueDays = days2.map { dwe ->
            dwe.copy(
                day = dwe.day.copy(id = dwe.day.id.replace("day-", "day2-"), planId = "plan-2"),
                exercises = dwe.exercises.map { ex -> ex.copy(id = ex.id.replace("dex-", "dex2-"), trainingDayId = ex.trainingDayId.replace("day-", "day2-")) },
            )
        }
        repo.createPlan(plan2, plan2WithUniqueDays)

        // plan-1 is active
        var active = repo.getActivePlan().first()
        assertNotNull(active)
        assertEquals("plan-1", active.id)

        // Activate plan-2 should deactivate plan-1
        repo.activatePlan("plan-2")
        active = repo.getActivePlan().first()
        assertNotNull(active)
        assertEquals("plan-2", active.id)
    }

    @Test
    fun testActivateNonExistentPlanFails() = runTest {
        val (repo, _) = createRepository()

        val result = repo.activatePlan("nonexistent")
        assertTrue(result.isFailure)
        assertIs<DomainError.PlanNotFoundError>(result.exceptionOrNull())
    }

    // ============================================================
    // Update Plan
    // ============================================================

    @Test
    fun testUpdatePlan() = runTest {
        val (repo, _) = createRepository()
        val (plan, days) = createFullPlanData()
        repo.createPlan(plan, days)

        val updatedPlan = plan.copy(displayName = "Updated Plan")
        val updatedDays = days.drop(1) // Remove one day
        val result = repo.updatePlan(updatedPlan, updatedDays)
        assertTrue(result.isSuccess)

        val planWithDays = repo.getPlanWithDays("plan-1").first()
        assertNotNull(planWithDays)
        assertEquals("Updated Plan", planWithDays.plan.displayName)
        assertEquals(1, planWithDays.days.size)
    }

    @Test
    fun testUpdateNonExistentPlanFails() = runTest {
        val (repo, _) = createRepository()
        val plan = createTestPlan(id = "nonexistent")

        val result = repo.updatePlan(plan, emptyList())
        assertTrue(result.isFailure)
        assertIs<DomainError.PlanNotFoundError>(result.exceptionOrNull())
    }

    @Test
    fun testUpdatePlanReplacesNestedData() = runTest {
        val (repo, _) = createRepository()
        val (plan, days) = createFullPlanData()
        repo.createPlan(plan, days)

        // Update with completely different days
        val newDay = createTestDay(id = "day-new", planId = "plan-1", displayName = "Legs", dayType = TrainingType.LEGS, orderIndex = 1)
        val newEx = createTestDayExercise(id = "dex-new", dayId = "day-new", exerciseId = "ex-3")
        val newDays = listOf(TrainingDayWithExercises(newDay, listOf(newEx)))

        repo.updatePlan(plan, newDays)

        val planWithDays = repo.getPlanWithDays("plan-1").first()
        assertNotNull(planWithDays)
        assertEquals(1, planWithDays.days.size)
        assertEquals("Legs", planWithDays.days[0].day.displayName)
        assertEquals("ex-3", planWithDays.days[0].exercises[0].exerciseId)
    }

    // ============================================================
    // Delete Plan
    // ============================================================

    @Test
    fun testDeletePlan() = runTest {
        val (repo, _) = createRepository()
        val (plan, days) = createFullPlanData()
        repo.createPlan(plan, days)

        val result = repo.deletePlan("plan-1")
        assertTrue(result.isSuccess)

        val plans = repo.getAllPlans().first()
        assertEquals(0, plans.size)
    }

    @Test
    fun testDeletePlanCascadesToDaysAndExercises() = runTest {
        val (repo, db) = createRepository()
        val (plan, days) = createFullPlanData()
        repo.createPlan(plan, days)

        // Verify data exists
        val planWithDays = repo.getPlanWithDays("plan-1").first()
        assertNotNull(planWithDays)
        assertEquals(2, planWithDays.days.size)

        repo.deletePlan("plan-1")

        val deleted = repo.getPlanWithDays("plan-1").first()
        assertNull(deleted)
    }

    @Test
    fun testDeleteNonExistentPlanFails() = runTest {
        val (repo, _) = createRepository()

        val result = repo.deletePlan("nonexistent")
        assertTrue(result.isFailure)
        assertIs<DomainError.PlanNotFoundError>(result.exceptionOrNull())
    }

    // ============================================================
    // Read operations
    // ============================================================

    @Test
    fun testGetAllPlans() = runTest {
        val (repo, _) = createRepository()

        val (plan1, days1) = createFullPlanData(planId = "plan-1")
        repo.createPlan(plan1, days1)

        val (plan2, _) = createFullPlanData(planId = "plan-2")
        val plan2Days = days1.map { dwe ->
            dwe.copy(
                day = dwe.day.copy(id = dwe.day.id.replace("day-", "day2-"), planId = "plan-2"),
                exercises = dwe.exercises.map { ex -> ex.copy(id = ex.id.replace("dex-", "dex2-"), trainingDayId = ex.trainingDayId.replace("day-", "day2-")) },
            )
        }
        repo.createPlan(plan2, plan2Days)

        val plans = repo.getAllPlans().first()
        assertEquals(2, plans.size)
    }

    @Test
    fun testGetPlanWithDaysNotFound() = runTest {
        val (repo, _) = createRepository()

        val result = repo.getPlanWithDays("nonexistent").first()
        assertNull(result)
    }

    @Test
    fun testGetActivePlanNoneActive() = runTest {
        val (repo, _) = createRepository()
        val (plan, days) = createFullPlanData(isActive = false)
        repo.createPlan(plan, days)

        val active = repo.getActivePlan().first()
        assertNull(active)
    }

    // ============================================================
    // Fixed cycle plan
    // ============================================================

    @Test
    fun testCreateFixedCyclePlan() = runTest {
        val (repo, _) = createRepository()
        val plan = createTestPlan(
            planMode = PlanMode.FIXED_CYCLE,
            scheduleMode = ScheduleDayType.WEEKLY_FIXED,
        ).copy(cycleLength = 4)
        val day = createTestDay(id = "day-1", planId = "plan-1")
        val days = listOf(TrainingDayWithExercises(day, emptyList()))

        val result = repo.createPlan(plan, days)
        assertTrue(result.isSuccess)

        val fetched = repo.getPlanWithDays("plan-1").first()
        assertNotNull(fetched)
        assertEquals(PlanMode.FIXED_CYCLE, fetched.plan.planMode)
        assertEquals(4, fetched.plan.cycleLength)
    }

    @Test
    fun testCreateFixedIntervalPlan() = runTest {
        val (repo, _) = createRepository()
        val plan = createTestPlan(
            planMode = PlanMode.INFINITE_LOOP,
            scheduleMode = ScheduleDayType.FIXED_INTERVAL,
        ).copy(intervalDays = 2)
        val day = createTestDay(id = "day-1", planId = "plan-1")
        val days = listOf(TrainingDayWithExercises(day, emptyList()))

        val result = repo.createPlan(plan, days)
        assertTrue(result.isSuccess)

        val fetched = repo.getPlanWithDays("plan-1").first()
        assertNotNull(fetched)
        assertEquals(ScheduleDayType.FIXED_INTERVAL, fetched.plan.scheduleMode)
        assertEquals(2, fetched.plan.intervalDays)
    }

    // ============================================================
    // Full roundtrip
    // ============================================================

    @Test
    fun testFullPlanLifecycleRoundtrip() = runTest {
        val (repo, _) = createRepository()
        val (plan, days) = createFullPlanData(isActive = true)

        // Create
        repo.createPlan(plan, days)

        // Read
        var planWithDays = repo.getPlanWithDays("plan-1").first()
        assertNotNull(planWithDays)
        assertEquals(2, planWithDays.days.size)

        // Activate
        val active = repo.getActivePlan().first()
        assertNotNull(active)
        assertEquals("plan-1", active.id)

        // Update
        val updatedPlan = plan.copy(displayName = "Updated Plan")
        val updatedDays = days.drop(1)
        repo.updatePlan(updatedPlan, updatedDays)
        planWithDays = repo.getPlanWithDays("plan-1").first()
        assertNotNull(planWithDays)
        assertEquals("Updated Plan", planWithDays.plan.displayName)
        assertEquals(1, planWithDays.days.size)

        // Delete
        repo.deletePlan("plan-1")
        val deleted = repo.getPlanWithDays("plan-1").first()
        assertNull(deleted)
    }
}
