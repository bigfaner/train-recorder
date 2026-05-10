package com.trainrecorder.viewmodel

import com.trainrecorder.domain.model.ExerciseMode
import com.trainrecorder.domain.model.ExerciseSet
import com.trainrecorder.domain.model.ExerciseStatus
import com.trainrecorder.domain.model.TimerState
import com.trainrecorder.domain.model.TrainingType
import com.trainrecorder.domain.model.WorkoutExercise
import com.trainrecorder.domain.model.WorkoutSession
import com.trainrecorder.domain.model.WorkoutStatus
import com.trainrecorder.domain.repository.ExerciseSetInput
import com.trainrecorder.domain.repository.TimerService
import com.trainrecorder.domain.repository.WeightSuggestionRepository
import com.trainrecorder.domain.repository.WorkoutExerciseInput
import com.trainrecorder.domain.repository.WorkoutExerciseWithSets
import com.trainrecorder.domain.repository.WorkoutRepository
import com.trainrecorder.domain.repository.WorkoutSessionDetail
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class WorkoutViewModelTest {

    private val now: Instant = Clock.System.now()

    private fun makeSession(
        id: String = "session1",
        status: WorkoutStatus = WorkoutStatus.IN_PROGRESS,
    ) = WorkoutSession(
        id = id,
        planId = "plan1",
        trainingDayId = "day1",
        recordDate = LocalDate(2026, 5, 11),
        trainingType = TrainingType.PUSH,
        workoutStatus = status,
        startedAt = now,
        endedAt = null,
        isBackfill = false,
        createdAt = now,
        updatedAt = now,
    )

    private fun makeWorkoutExercise(
        id: String = "wex1",
        exerciseId: String = "ex1",
        status: ExerciseStatus = ExerciseStatus.PENDING,
        targetSets: Int = 3,
        targetReps: Int = 5,
        suggestedWeight: Double? = 100.0,
    ) = WorkoutExercise(
        id = id,
        workoutSessionId = "session1",
        exerciseId = exerciseId,
        orderIndex = 0,
        note = null,
        suggestedWeight = suggestedWeight,
        isCustomWeight = false,
        targetSets = targetSets,
        targetReps = targetReps,
        exerciseMode = ExerciseMode.FIXED,
        exerciseStatus = status,
        createdAt = now,
        updatedAt = now,
    )

    private fun makeExerciseSet(
        id: String = "set1",
        workoutExerciseId: String = "wex1",
        setIndex: Int = 0,
        isCompleted: Boolean = false,
        targetWeight: Double = 100.0,
    ) = ExerciseSet(
        id = id,
        workoutExerciseId = workoutExerciseId,
        setIndex = setIndex,
        targetWeight = targetWeight,
        actualWeight = if (isCompleted) 100.0 else 0.0,
        targetReps = 5,
        actualReps = if (isCompleted) 5 else null,
        isCompleted = isCompleted,
        restStartedAt = null,
        restDuration = null,
        createdAt = now,
        updatedAt = now,
    )

    private open class FakeWorkoutRepository(
        private val sessionDetail: WorkoutSessionDetail? = null,
        private val recordSetResult: Result<ExerciseSet> = Result.success(
            ExerciseSet(
                id = "set-new", workoutExerciseId = "wex1", setIndex = 0,
                targetWeight = 100.0, actualWeight = 100.0, targetReps = 5, actualReps = 5,
                isCompleted = true, restStartedAt = null, restDuration = null,
                createdAt = Clock.System.now(), updatedAt = Clock.System.now(),
            ),
        ),
    ) : WorkoutRepository {
        private val _sessionDetail = MutableStateFlow(sessionDetail)

        override fun getSessionsByDateRange(
            startDate: LocalDate,
            endDate: LocalDate,
        ): StateFlow<List<WorkoutSession>> = MutableStateFlow(emptyList())

        override fun getSessionWithDetails(sessionId: String): StateFlow<WorkoutSessionDetail?> = _sessionDetail

        override suspend fun createSession(
            session: WorkoutSession,
            exercises: List<WorkoutExerciseInput>,
        ): Result<String> = Result.success("new")

        override suspend fun updateSessionStatus(sessionId: String, status: WorkoutStatus): Result<Unit> =
            Result.success(Unit)

        override suspend fun recordSet(workoutExerciseId: String, set: ExerciseSetInput): Result<ExerciseSet> =
            recordSetResult

        override suspend fun updateExerciseStatus(workoutExerciseId: String, status: ExerciseStatus): Result<Unit> =
            Result.success(Unit)

        override suspend fun completeSession(sessionId: String): Result<Unit> = Result.success(Unit)
        override suspend fun partialCompleteSession(sessionId: String): Result<Unit> = Result.success(Unit)
        override suspend fun deleteSession(sessionId: String): Result<Unit> = Result.success(Unit)
        override suspend fun backfillSession(
            session: WorkoutSession,
            exercises: List<WorkoutExerciseWithSets>,
        ): Result<String> = Result.success("backfill")
    }

    private class FakeWeightSuggestionRepository : WeightSuggestionRepository {
        override fun getSuggestion(exerciseId: String): StateFlow<com.trainrecorder.domain.model.WeightSuggestion?> =
            MutableStateFlow(null)

        override suspend fun recalculate(exerciseId: String): Result<Unit> = Result.success(Unit)
        override suspend fun recalculateChain(fromDate: LocalDate, exerciseId: String): Result<Unit> =
            Result.success(Unit)
    }

    private class FakeTimerService : TimerService {
        private val _remainingSeconds = MutableStateFlow<Int?>(null)
        private val _timerState = MutableStateFlow<TimerState?>(null)

        override val remainingSeconds: StateFlow<Int?> = _remainingSeconds
        override val timerState: StateFlow<TimerState?> = _timerState

        override suspend fun startTimer(sessionId: String, durationSeconds: Int) {
            _remainingSeconds.value = durationSeconds
        }

        override suspend fun cancelTimer() {
            _remainingSeconds.value = null
            _timerState.value = null
        }

        override suspend fun resumeFromPersistedState() {}
    }

    @Test
    fun `initial state has correct defaults`() {
        val testScope = TestScope()
        val vm = WorkoutViewModel(
            workoutRepository = FakeWorkoutRepository(),
            weightSuggestionRepository = FakeWeightSuggestionRepository(),
            timerService = FakeTimerService(),
            sessionId = "session1",
            coroutineScope = testScope,
        )

        val state = vm.state.value
        assertEquals("session1", state.sessionId)
        assertFalse(state.isSaving)
        assertEquals(0, state.progress.completedExercises)
        assertEquals(0, state.progress.totalExercises)
    }

    @Test
    fun `session loads with exercises`() = runTest {
        val session = makeSession()
        val exercise = makeWorkoutExercise()
        val sets = listOf(makeExerciseSet(setIndex = 0), makeExerciseSet(id = "set2", setIndex = 1))
        val detail = WorkoutSessionDetail(
            session = session,
            exercises = listOf(WorkoutExerciseWithSets(exercise, sets)),
        )

        val testScope = TestScope()
        val vm = WorkoutViewModel(
            workoutRepository = FakeWorkoutRepository(sessionDetail = detail),
            weightSuggestionRepository = FakeWeightSuggestionRepository(),
            timerService = FakeTimerService(),
            sessionId = "session1",
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertTrue(state.isLoaded)
        assertEquals(1, state.exercises.size)
        assertEquals(2, state.exercises[0].sets.size)
        assertEquals(1, state.progress.totalExercises)
    }

    @Test
    fun `workout progress fraction calculates correctly`() {
        val progress = WorkoutProgress(completedExercises = 2, totalExercises = 4)
        assertEquals(0.5f, progress.fraction)
    }

    @Test
    fun `workout progress fraction handles zero total`() {
        val progress = WorkoutProgress(completedExercises = 0, totalExercises = 0)
        assertEquals(0f, progress.fraction)
    }

    @Test
    fun `completeWorkout resets saving state`() = runTest {
        val testScope = TestScope()
        val vm = WorkoutViewModel(
            workoutRepository = FakeWorkoutRepository(),
            weightSuggestionRepository = FakeWeightSuggestionRepository(),
            timerService = FakeTimerService(),
            sessionId = "session1",
            coroutineScope = testScope,
        )

        vm.onEvent(WorkoutEvent.CompleteWorkout)
        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertFalse(state.isSaving)
    }

    @Test
    fun `partialComplete resets saving state`() = runTest {
        val testScope = TestScope()
        val vm = WorkoutViewModel(
            workoutRepository = FakeWorkoutRepository(),
            weightSuggestionRepository = FakeWeightSuggestionRepository(),
            timerService = FakeTimerService(),
            sessionId = "session1",
            coroutineScope = testScope,
        )

        vm.onEvent(WorkoutEvent.PartialComplete)
        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertFalse(state.isSaving)
    }

    @Test
    fun `skipTimer clears timer service`() = runTest {
        val fakeTimer = FakeTimerService()
        val testScope = TestScope()
        val vm = WorkoutViewModel(
            workoutRepository = FakeWorkoutRepository(),
            weightSuggestionRepository = FakeWeightSuggestionRepository(),
            timerService = fakeTimer,
            sessionId = "session1",
            coroutineScope = testScope,
        )

        vm.onEvent(WorkoutEvent.SkipTimer)
        testScope.advanceUntilIdle()

        assertNull(fakeTimer.remainingSeconds.value)
    }

    @Test
    fun `completeWorkout handles error`() = runTest {
        val fakeRepo = object : FakeWorkoutRepository() {
            override suspend fun completeSession(sessionId: String): Result<Unit> =
                Result.failure(Exception("Session locked"))
        }

        val testScope = TestScope()
        val vm = WorkoutViewModel(
            workoutRepository = fakeRepo,
            weightSuggestionRepository = FakeWeightSuggestionRepository(),
            timerService = FakeTimerService(),
            sessionId = "session1",
            coroutineScope = testScope,
        )

        vm.onEvent(WorkoutEvent.CompleteWorkout)
        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertFalse(state.isSaving)
        assertEquals("Session locked", state.error)
    }

    @Test
    fun `session not found sets error`() = runTest {
        val testScope = TestScope()
        val vm = WorkoutViewModel(
            workoutRepository = FakeWorkoutRepository(sessionDetail = null),
            weightSuggestionRepository = FakeWeightSuggestionRepository(),
            timerService = FakeTimerService(),
            sessionId = "nonexistent",
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertTrue(state.isLoaded)
        assertEquals("Session not found", state.error)
    }
}
