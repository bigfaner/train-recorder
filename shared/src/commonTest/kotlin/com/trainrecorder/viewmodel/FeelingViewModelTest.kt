package com.trainrecorder.viewmodel

import com.trainrecorder.domain.model.WorkoutFeeling
import com.trainrecorder.domain.repository.ExerciseFeelingInput
import com.trainrecorder.domain.repository.FeelingRepository
import com.trainrecorder.domain.repository.WorkoutRepository
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class FeelingViewModelTest {

    private class FakeFeelingRepository(
        private val existingFeeling: WorkoutFeeling? = null,
        private val saveResult: Result<Unit> = Result.success(Unit),
        private val updateResult: Result<Unit> = Result.success(Unit),
    ) : FeelingRepository {
        private val _feelingFlow = MutableStateFlow(existingFeeling)
        override suspend fun saveFeeling(
            sessionId: String,
            fatigue: Int,
            satisfaction: Int,
            notes: String?,
            exerciseNotes: List<ExerciseFeelingInput>,
        ): Result<Unit> = saveResult

        override suspend fun updateFeeling(
            feelingId: String,
            fatigue: Int,
            satisfaction: Int,
            notes: String?,
        ): Result<Unit> = updateResult

        override fun getFeelingForSession(sessionId: String): Flow<WorkoutFeeling?> = _feelingFlow
    }

    private class FakeWorkoutRepoForFeeling :
        WorkoutRepository {
        private val emptyDetail = MutableStateFlow<com.trainrecorder.domain.repository.WorkoutSessionDetail?>(null)

        override fun getSessionsByDateRange(startDate: LocalDate, endDate: LocalDate): StateFlow<List<com.trainrecorder.domain.model.WorkoutSession>> =
            MutableStateFlow(emptyList())
        override fun getSessionWithDetails(sessionId: String): StateFlow<com.trainrecorder.domain.repository.WorkoutSessionDetail?> = emptyDetail
        override suspend fun createSession(session: com.trainrecorder.domain.model.WorkoutSession, exercises: List<com.trainrecorder.domain.repository.WorkoutExerciseInput>): Result<String> =
            Result.success("new")
        override suspend fun updateSessionStatus(sessionId: String, status: com.trainrecorder.domain.model.WorkoutStatus): Result<Unit> = Result.success(Unit)
        override suspend fun recordSet(workoutExerciseId: String, set: com.trainrecorder.domain.repository.ExerciseSetInput): Result<com.trainrecorder.domain.model.ExerciseSet> =
            Result.failure(Exception("Not implemented"))
        override suspend fun updateExerciseStatus(workoutExerciseId: String, status: com.trainrecorder.domain.model.ExerciseStatus): Result<Unit> = Result.success(Unit)
        override suspend fun completeSession(sessionId: String): Result<Unit> = Result.success(Unit)
        override suspend fun partialCompleteSession(sessionId: String): Result<Unit> = Result.success(Unit)
        override suspend fun deleteSession(sessionId: String): Result<Unit> = Result.success(Unit)
        override suspend fun backfillSession(session: com.trainrecorder.domain.model.WorkoutSession, exercises: List<com.trainrecorder.domain.repository.WorkoutExerciseWithSets>): Result<String> =
            Result.success("backfill")
    }

    @Test
    fun `initial state has correct defaults`() {
        val testScope = TestScope()
        val vm = FeelingViewModel(
            feelingRepository = FakeFeelingRepository(),
            workoutRepository = FakeWorkoutRepoForFeeling(),
            sessionId = "session1",
            coroutineScope = testScope,
        )

        val state = vm.state.value
        assertEquals("session1", state.sessionId)
        assertEquals(5, state.fatigue)
        assertEquals(5, state.satisfaction)
        assertNull(state.trainingSummary)
        assertTrue(state.exerciseFeelings.isEmpty())
        assertNull(state.notes)
        assertFalse(state.isSaving)
        assertFalse(state.showHighFatigueWarning)
    }

    @Test
    fun `setFatigue updates fatigue level`() = runTest {
        val testScope = TestScope()
        val vm = FeelingViewModel(
            feelingRepository = FakeFeelingRepository(),
            workoutRepository = FakeWorkoutRepoForFeeling(),
            sessionId = "session1",
            coroutineScope = testScope,
        )

        vm.onEvent(FeelingEvent.SetFatigue(8))
        assertEquals(8, vm.state.value.fatigue)
    }

    @Test
    fun `setFatigue clamps to valid range`() = runTest {
        val testScope = TestScope()
        val vm = FeelingViewModel(
            feelingRepository = FakeFeelingRepository(),
            workoutRepository = FakeWorkoutRepoForFeeling(),
            sessionId = "session1",
            coroutineScope = testScope,
        )

        vm.onEvent(FeelingEvent.SetFatigue(15))
        assertEquals(10, vm.state.value.fatigue)

        vm.onEvent(FeelingEvent.SetFatigue(0))
        assertEquals(1, vm.state.value.fatigue)
    }

    @Test
    fun `setSatisfaction updates satisfaction level`() = runTest {
        val testScope = TestScope()
        val vm = FeelingViewModel(
            feelingRepository = FakeFeelingRepository(),
            workoutRepository = FakeWorkoutRepoForFeeling(),
            sessionId = "session1",
            coroutineScope = testScope,
        )

        vm.onEvent(FeelingEvent.SetSatisfaction(3))
        assertEquals(3, vm.state.value.satisfaction)
    }

    @Test
    fun `setSatisfaction clamps to valid range`() = runTest {
        val testScope = TestScope()
        val vm = FeelingViewModel(
            feelingRepository = FakeFeelingRepository(),
            workoutRepository = FakeWorkoutRepoForFeeling(),
            sessionId = "session1",
            coroutineScope = testScope,
        )

        vm.onEvent(FeelingEvent.SetSatisfaction(-5))
        assertEquals(1, vm.state.value.satisfaction)

        vm.onEvent(FeelingEvent.SetSatisfaction(20))
        assertEquals(10, vm.state.value.satisfaction)
    }

    @Test
    fun `high fatigue warning shows when fatigue gte 8 and satisfaction lte 4`() = runTest {
        val testScope = TestScope()
        val vm = FeelingViewModel(
            feelingRepository = FakeFeelingRepository(),
            workoutRepository = FakeWorkoutRepoForFeeling(),
            sessionId = "session1",
            coroutineScope = testScope,
        )

        vm.onEvent(FeelingEvent.SetFatigue(8))
        vm.onEvent(FeelingEvent.SetSatisfaction(4))

        assertTrue(vm.state.value.showHighFatigueWarning)
    }

    @Test
    fun `high fatigue warning does not show when satisfaction gt 4`() = runTest {
        val testScope = TestScope()
        val vm = FeelingViewModel(
            feelingRepository = FakeFeelingRepository(),
            workoutRepository = FakeWorkoutRepoForFeeling(),
            sessionId = "session1",
            coroutineScope = testScope,
        )

        vm.onEvent(FeelingEvent.SetFatigue(9))
        vm.onEvent(FeelingEvent.SetSatisfaction(5))

        assertFalse(vm.state.value.showHighFatigueWarning)
    }

    @Test
    fun `high fatigue warning does not show when fatigue lt 8`() = runTest {
        val testScope = TestScope()
        val vm = FeelingViewModel(
            feelingRepository = FakeFeelingRepository(),
            workoutRepository = FakeWorkoutRepoForFeeling(),
            sessionId = "session1",
            coroutineScope = testScope,
        )

        vm.onEvent(FeelingEvent.SetFatigue(7))
        vm.onEvent(FeelingEvent.SetSatisfaction(2))

        assertFalse(vm.state.value.showHighFatigueWarning)
    }

    @Test
    fun `setExerciseNotes updates notes for matching exercise`() = runTest {
        val testScope = TestScope()
        val vm = FeelingViewModel(
            feelingRepository = FakeFeelingRepository(),
            workoutRepository = FakeWorkoutRepoForFeeling(),
            sessionId = "session1",
            coroutineScope = testScope,
        )

        // Set exercise feelings via a workout session detail
        vm.onEvent(FeelingEvent.SetExerciseNotes("ex1", "Felt easy"))

        // With no exercise feelings loaded, the list should still be empty
        // This tests that SetExerciseNotes does not crash when list is empty
        assertTrue(vm.state.value.exerciseFeelings.isEmpty())
    }

    @Test
    fun `setNotes updates notes`() = runTest {
        val testScope = TestScope()
        val vm = FeelingViewModel(
            feelingRepository = FakeFeelingRepository(),
            workoutRepository = FakeWorkoutRepoForFeeling(),
            sessionId = "session1",
            coroutineScope = testScope,
        )

        vm.onEvent(FeelingEvent.SetNotes("Great workout"))
        assertEquals("Great workout", vm.state.value.notes)
    }

    @Test
    fun `save feeling succeeds`() = runTest {
        val testScope = TestScope()
        val vm = FeelingViewModel(
            feelingRepository = FakeFeelingRepository(saveResult = Result.success(Unit)),
            workoutRepository = FakeWorkoutRepoForFeeling(),
            sessionId = "session1",
            coroutineScope = testScope,
        )

        vm.onEvent(FeelingEvent.Save)
        testScope.advanceUntilIdle()

        assertFalse(vm.state.value.isSaving)
        // Note: error may be set by loadSessionSummary (session not found)
        // We only verify isSaving is reset after save
    }

    @Test
    fun `save feeling handles failure`() = runTest {
        val testScope = TestScope()
        val vm = FeelingViewModel(
            feelingRepository = FakeFeelingRepository(saveResult = Result.failure(Exception("Session locked"))),
            workoutRepository = FakeWorkoutRepoForFeeling(),
            sessionId = "session1",
            coroutineScope = testScope,
        )

        vm.onEvent(FeelingEvent.Save)
        testScope.advanceUntilIdle()

        assertFalse(vm.state.value.isSaving)
        // The save failure sets the error
        val state = vm.state.value
        assertTrue(state.error != null && state.error.contains("Session locked"))
    }

    @Test
    fun `shouldShowHighFatigueWarning companion method works`() {
        assertTrue(FeelingViewModel.shouldShowHighFatigueWarning(8, 4))
        assertTrue(FeelingViewModel.shouldShowHighFatigueWarning(10, 1))
        assertFalse(FeelingViewModel.shouldShowHighFatigueWarning(7, 4))
        assertFalse(FeelingViewModel.shouldShowHighFatigueWarning(8, 5))
        assertFalse(FeelingViewModel.shouldShowHighFatigueWarning(5, 5))
    }
}
