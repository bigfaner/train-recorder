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
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class HistoryViewModelTest {

    private fun makeSession(
        id: String = "session1",
        date: LocalDate = LocalDate(2026, 1, 15),
        status: WorkoutStatus = WorkoutStatus.COMPLETED,
        trainingType: TrainingType = TrainingType.PUSH,
    ) = WorkoutSession(
        id = id,
        planId = "plan1",
        trainingDayId = null,
        recordDate = date,
        trainingType = trainingType,
        workoutStatus = status,
        startedAt = Clock.System.now(),
        endedAt = Clock.System.now(),
        isBackfill = false,
        createdAt = Clock.System.now(),
        updatedAt = Clock.System.now(),
    )

    private fun makePR(
        exerciseId: String = "ex1",
        maxWeight: Double = 100.0,
        date: LocalDate = LocalDate(2026, 1, 15),
    ) = PersonalRecord(
        id = "pr1",
        exerciseId = exerciseId,
        maxWeight = maxWeight,
        maxVolume = 500.0,
        maxWeightDate = date,
        maxVolumeDate = date,
        maxWeightSessionId = "session1",
        maxVolumeSessionId = "session1",
        createdAt = Clock.System.now(),
        updatedAt = Clock.System.now(),
    )

    private class FakeWorkoutRepository(
        sessions: List<WorkoutSession> = emptyList(),
        private val deleteResult: Result<Unit> = Result.success(Unit),
    ) : WorkoutRepository {
        private val _sessions = MutableStateFlow(sessions)

        override fun getSessionsByDateRange(startDate: LocalDate, endDate: LocalDate): StateFlow<List<WorkoutSession>> = _sessions
        override fun getSessionWithDetails(sessionId: String): StateFlow<com.trainrecorder.domain.repository.WorkoutSessionDetail?> =
            MutableStateFlow(null)
        override suspend fun createSession(session: WorkoutSession, exercises: List<com.trainrecorder.domain.repository.WorkoutExerciseInput>): Result<String> =
            Result.success("new-session")
        override suspend fun updateSessionStatus(sessionId: String, status: WorkoutStatus): Result<Unit> =
            Result.success(Unit)
        override suspend fun recordSet(workoutExerciseId: String, set: com.trainrecorder.domain.repository.ExerciseSetInput): Result<com.trainrecorder.domain.model.ExerciseSet> =
            Result.failure(Exception("Not implemented"))
        override suspend fun updateExerciseStatus(workoutExerciseId: String, status: com.trainrecorder.domain.model.ExerciseStatus): Result<Unit> =
            Result.success(Unit)
        override suspend fun completeSession(sessionId: String): Result<Unit> = Result.success(Unit)
        override suspend fun partialCompleteSession(sessionId: String): Result<Unit> = Result.success(Unit)
        override suspend fun deleteSession(sessionId: String): Result<Unit> = deleteResult
        override suspend fun backfillSession(session: WorkoutSession, exercises: List<com.trainrecorder.domain.repository.WorkoutExerciseWithSets>): Result<String> =
            Result.success("backfill-session")
    }

    private class FakePersonalRecordRepository(
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
        val vm = HistoryViewModel(
            workoutRepository = FakeWorkoutRepository(),
            personalRecordRepository = FakePersonalRecordRepository(),
            coroutineScope = testScope,
        )

        val state = vm.state.value
        assertEquals(HistoryTab.HISTORY, state.selectedTab)
        assertTrue(state.sessions.isEmpty())
        assertNull(state.selectedExerciseId)
        assertNull(state.progressData)
        assertTrue(state.personalRecords.isEmpty())
        assertNull(state.volumeData)
        assertFalse(state.isLoaded)
        assertTrue(state.isLoading)
        assertNull(state.error)
    }

    @Test
    fun `completed sessions are loaded`() = runTest {
        val session = makeSession()
        val testScope = TestScope()
        val vm = HistoryViewModel(
            workoutRepository = FakeWorkoutRepository(sessions = listOf(session)),
            personalRecordRepository = FakePersonalRecordRepository(),
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertTrue(state.isLoaded)
        assertEquals(1, state.sessions.size)
        assertEquals("session1", state.sessions[0].sessionId)
        assertEquals(LocalDate(2026, 1, 15), state.sessions[0].date)
    }

    @Test
    fun `in-progress sessions are filtered out`() = runTest {
        val completedSession = makeSession(id = "completed", status = WorkoutStatus.COMPLETED)
        val inProgressSession = makeSession(id = "inprogress", status = WorkoutStatus.IN_PROGRESS)

        val testScope = TestScope()
        val vm = HistoryViewModel(
            workoutRepository = FakeWorkoutRepository(sessions = listOf(completedSession, inProgressSession)),
            personalRecordRepository = FakePersonalRecordRepository(),
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertTrue(state.isLoaded)
        assertEquals(1, state.sessions.size)
        assertEquals("completed", state.sessions[0].sessionId)
    }

    @Test
    fun `personal records are loaded`() = runTest {
        val pr = makePR()
        val testScope = TestScope()
        val vm = HistoryViewModel(
            workoutRepository = FakeWorkoutRepository(),
            personalRecordRepository = FakePersonalRecordRepository(records = listOf(pr)),
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertTrue(state.isLoaded)
        assertEquals(1, state.personalRecords.size)
        assertEquals("ex1", state.personalRecords[0].exerciseId)
    }

    @Test
    fun `selectTab changes the selected tab`() = runTest {
        val testScope = TestScope()
        val vm = HistoryViewModel(
            workoutRepository = FakeWorkoutRepository(),
            personalRecordRepository = FakePersonalRecordRepository(),
            coroutineScope = testScope,
        )

        vm.onEvent(HistoryEvent.SelectTab(HistoryTab.PROGRESS))

        assertEquals(HistoryTab.PROGRESS, vm.state.value.selectedTab)
    }

    @Test
    fun `selectExercise sets the selected exercise`() = runTest {
        val testScope = TestScope()
        val vm = HistoryViewModel(
            workoutRepository = FakeWorkoutRepository(),
            personalRecordRepository = FakePersonalRecordRepository(),
            coroutineScope = testScope,
        )

        vm.onEvent(HistoryEvent.SelectExercise("exercise1"))

        assertEquals("exercise1", vm.state.value.selectedExerciseId)
    }

    @Test
    fun `deleteSession succeeds`() = runTest {
        val testScope = TestScope()
        val vm = HistoryViewModel(
            workoutRepository = FakeWorkoutRepository(deleteResult = Result.success(Unit)),
            personalRecordRepository = FakePersonalRecordRepository(),
            coroutineScope = testScope,
        )

        vm.onEvent(HistoryEvent.DeleteSession("session1"))
        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertFalse(state.isLoading)
        assertNull(state.error)
    }

    @Test
    fun `deleteSession handles failure`() = runTest {
        val testScope = TestScope()
        val vm = HistoryViewModel(
            workoutRepository = FakeWorkoutRepository(deleteResult = Result.failure(Exception("Not found"))),
            personalRecordRepository = FakePersonalRecordRepository(),
            coroutineScope = testScope,
        )

        vm.onEvent(HistoryEvent.DeleteSession("bad-session"))
        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertFalse(state.isLoading)
        assertEquals("Not found", state.error)
    }

    @Test
    fun `sessions are sorted by date descending`() = runTest {
        val session1 = makeSession(id = "s1", date = LocalDate(2026, 1, 10))
        val session2 = makeSession(id = "s2", date = LocalDate(2026, 1, 20))
        val session3 = makeSession(id = "s3", date = LocalDate(2026, 1, 15))

        val testScope = TestScope()
        val vm = HistoryViewModel(
            workoutRepository = FakeWorkoutRepository(sessions = listOf(session1, session2, session3)),
            personalRecordRepository = FakePersonalRecordRepository(),
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertEquals(3, state.sessions.size)
        assertEquals("s2", state.sessions[0].sessionId) // 2026-01-20
        assertEquals("s3", state.sessions[1].sessionId) // 2026-01-15
        assertEquals("s1", state.sessions[2].sessionId) // 2026-01-10
    }

    @Test
    fun `all 4 tabs are supported`() {
        val tabs = HistoryTab.entries
        assertEquals(4, tabs.size)
        assertTrue(tabs.contains(HistoryTab.HISTORY))
        assertTrue(tabs.contains(HistoryTab.PROGRESS))
        assertTrue(tabs.contains(HistoryTab.VOLUME))
        assertTrue(tabs.contains(HistoryTab.PR))
    }
}
