package com.trainrecorder.viewmodel

import com.trainrecorder.domain.model.PersonalRecord
import com.trainrecorder.domain.model.TrainingType
import com.trainrecorder.domain.model.WorkoutSession
import com.trainrecorder.domain.model.WorkoutStatus
import com.trainrecorder.domain.repository.PersonalRecordRepository
import com.trainrecorder.domain.repository.WorkoutRepository
import kotlinx.coroutines.ExperimentalCoroutinesApi
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
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class StatsViewModelTest {

    private fun makeSession(
        id: String = "session1",
        date: LocalDate = LocalDate(2026, 1, 15),
        status: WorkoutStatus = WorkoutStatus.COMPLETED,
    ) = WorkoutSession(
        id = id,
        planId = "plan1",
        trainingDayId = null,
        recordDate = date,
        trainingType = TrainingType.PUSH,
        workoutStatus = status,
        startedAt = Clock.System.now(),
        endedAt = Clock.System.now(),
        isBackfill = false,
        createdAt = Clock.System.now(),
        updatedAt = Clock.System.now(),
    )

    private class FakeWorkoutRepoForStats(
        sessions: List<WorkoutSession> = emptyList(),
    ) : WorkoutRepository {
        private val _sessions = MutableStateFlow(sessions)
        override fun getSessionsByDateRange(startDate: LocalDate, endDate: LocalDate): StateFlow<List<WorkoutSession>> = _sessions
        override fun getSessionWithDetails(sessionId: String): StateFlow<com.trainrecorder.domain.repository.WorkoutSessionDetail?> =
            MutableStateFlow(null)
        override suspend fun createSession(session: WorkoutSession, exercises: List<com.trainrecorder.domain.repository.WorkoutExerciseInput>): Result<String> =
            Result.success("new")
        override suspend fun updateSessionStatus(sessionId: String, status: WorkoutStatus): Result<Unit> = Result.success(Unit)
        override suspend fun recordSet(workoutExerciseId: String, set: com.trainrecorder.domain.repository.ExerciseSetInput): Result<com.trainrecorder.domain.model.ExerciseSet> =
            Result.failure(Exception("Not implemented"))
        override suspend fun updateExerciseStatus(workoutExerciseId: String, status: com.trainrecorder.domain.model.ExerciseStatus): Result<Unit> = Result.success(Unit)
        override suspend fun completeSession(sessionId: String): Result<Unit> = Result.success(Unit)
        override suspend fun partialCompleteSession(sessionId: String): Result<Unit> = Result.success(Unit)
        override suspend fun deleteSession(sessionId: String): Result<Unit> = Result.success(Unit)
        override suspend fun backfillSession(session: WorkoutSession, exercises: List<com.trainrecorder.domain.repository.WorkoutExerciseWithSets>): Result<String> =
            Result.success("backfill")
    }

    private class FakePRRepoForStats(
        records: List<PersonalRecord> = emptyList(),
    ) : PersonalRecordRepository {
        private val _records = MutableStateFlow(records)
        override fun getRecord(exerciseId: String): StateFlow<PersonalRecord?> =
            MutableStateFlow(_records.value.find { it.exerciseId == exerciseId })
        override fun getAllRecords(): StateFlow<List<PersonalRecord>> = _records
        override suspend fun updateAfterWorkout(sessionId: String): Result<Unit> = Result.success(Unit)
        override suspend fun recalculate(exerciseId: String): Result<Unit> = Result.success(Unit)
        override suspend fun recalculateAll(): Result<Unit> = Result.success(Unit)
    }

    @Test
    fun `initial state has correct defaults`() {
        val testScope = TestScope()
        val vm = StatsViewModel(
            workoutRepository = FakeWorkoutRepoForStats(),
            personalRecordRepository = FakePRRepoForStats(),
            coroutineScope = testScope,
        )

        val state = vm.state.value
        assertTrue(state.weeklyStats.isEmpty())
        assertTrue(state.monthlyStats.isEmpty())
        assertTrue(state.estimatedOneRepMax.isEmpty())
        assertTrue(state.heatmapData.isEmpty())
        assertFalse(state.isLoaded)
        assertTrue(state.isLoading)
    }

    @Test
    fun `1RM estimation formula is correct`() {
        val testScope = TestScope()
        val vm = StatsViewModel(
            workoutRepository = FakeWorkoutRepoForStats(),
            personalRecordRepository = FakePRRepoForStats(),
            coroutineScope = testScope,
        )

        // Formula: weight x (1 + reps / 30)
        // 100kg x 5 reps = 100 * (1 + 5/30) = 100 * 1.1667 = 116.67
        val result = vm.estimateOneRepMax(100.0, 5)
        assertEquals(116.66666666666667, result, 0.001)

        // 80kg x 1 rep = 80 * (1 + 1/30) = 80 * 1.0333 = 82.67
        val result2 = vm.estimateOneRepMax(80.0, 1)
        assertEquals(82.66666666666667, result2, 0.001)

        // 60kg x 10 reps = 60 * (1 + 10/30) = 60 * 1.333 = 80.0
        val result3 = vm.estimateOneRepMax(60.0, 10)
        assertEquals(80.0, result3, 0.001)
    }

    @Test
    fun `heatmap data is computed from sessions`() = runTest {
        val s1 = makeSession(id = "s1", date = LocalDate(2026, 1, 15))
        val s2 = makeSession(id = "s2", date = LocalDate(2026, 1, 16))
        val s3 = makeSession(id = "s3", date = LocalDate(2026, 1, 15))

        val testScope = TestScope()
        val vm = StatsViewModel(
            workoutRepository = FakeWorkoutRepoForStats(sessions = listOf(s1, s2, s3)),
            personalRecordRepository = FakePRRepoForStats(),
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertTrue(state.isLoaded)
        assertEquals(2, state.heatmapData[LocalDate(2026, 1, 15)])
        assertEquals(1, state.heatmapData[LocalDate(2026, 1, 16)])
    }

    @Test
    fun `weekly stats are computed`() = runTest {
        val s1 = makeSession(id = "s1", date = LocalDate(2026, 1, 13)) // Monday
        val s2 = makeSession(id = "s2", date = LocalDate(2026, 1, 15)) // Wednesday same week

        val testScope = TestScope()
        val vm = StatsViewModel(
            workoutRepository = FakeWorkoutRepoForStats(sessions = listOf(s1, s2)),
            personalRecordRepository = FakePRRepoForStats(),
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertTrue(state.isLoaded)
        // Should group into weeks
        assertTrue(state.weeklyStats.isNotEmpty())
    }

    @Test
    fun `monthly stats are computed`() = runTest {
        val s1 = makeSession(id = "s1", date = LocalDate(2026, 1, 10))
        val s2 = makeSession(id = "s2", date = LocalDate(2026, 1, 20))
        val s3 = makeSession(id = "s3", date = LocalDate(2026, 2, 5))

        val testScope = TestScope()
        val vm = StatsViewModel(
            workoutRepository = FakeWorkoutRepoForStats(sessions = listOf(s1, s2, s3)),
            personalRecordRepository = FakePRRepoForStats(),
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertTrue(state.isLoaded)
        assertEquals(2, state.monthlyStats.size)
        val janStats = state.monthlyStats.find { it.month.monthNumber == 1 }
        val febStats = state.monthlyStats.find { it.month.monthNumber == 2 }
        assertEquals(2, janStats!!.totalSessions)
        assertEquals(1, febStats!!.totalSessions)
    }

    @Test
    fun `refresh reloads stats`() = runTest {
        val testScope = TestScope()
        val vm = StatsViewModel(
            workoutRepository = FakeWorkoutRepoForStats(),
            personalRecordRepository = FakePRRepoForStats(),
            coroutineScope = testScope,
        )

        vm.onEvent(StatsEvent.Refresh)
        testScope.advanceUntilIdle()

        // Should not crash and state should be consistent
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `in-progress sessions are excluded from stats`() = runTest {
        val completed = makeSession(id = "completed", status = WorkoutStatus.COMPLETED)
        val inProgress = makeSession(id = "inprogress", status = WorkoutStatus.IN_PROGRESS)

        val testScope = TestScope()
        val vm = StatsViewModel(
            workoutRepository = FakeWorkoutRepoForStats(sessions = listOf(completed, inProgress)),
            personalRecordRepository = FakePRRepoForStats(),
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertTrue(state.isLoaded)
        // Only completed session should appear in heatmap
        assertEquals(1, state.heatmapData.size)
        assertEquals(1, state.heatmapData[completed.recordDate])
    }
}
