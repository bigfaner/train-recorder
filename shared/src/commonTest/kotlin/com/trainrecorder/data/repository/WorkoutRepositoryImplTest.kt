package com.trainrecorder.data.repository

import com.trainrecorder.createTestDatabase
import com.trainrecorder.db.TrainRecorderDatabase
import com.trainrecorder.domain.model.DomainError
import com.trainrecorder.domain.model.ExerciseMode
import com.trainrecorder.domain.model.ExerciseSet
import com.trainrecorder.domain.model.ExerciseStatus
import com.trainrecorder.domain.model.TrainingType
import com.trainrecorder.domain.model.WorkoutExercise
import com.trainrecorder.domain.model.WorkoutSession
import com.trainrecorder.domain.model.WorkoutStatus
import com.trainrecorder.domain.repository.ExerciseSetInput
import com.trainrecorder.domain.repository.WorkoutExerciseInput
import com.trainrecorder.domain.repository.WorkoutExerciseWithSets
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class WorkoutRepositoryImplTest {

    private fun createRepository(): Pair<WorkoutRepositoryImpl, TrainRecorderDatabase> {
        val db = createTestDatabase()
        return WorkoutRepositoryImpl(db) to db
    }

    private val testInstant = Instant.parse("2025-01-15T10:30:00Z")
    private val testDate = LocalDate.parse("2025-01-15")

    private fun createTestSession(
        id: String = "session-1",
        recordDate: LocalDate = testDate,
        status: WorkoutStatus = WorkoutStatus.IN_PROGRESS,
        isBackfill: Boolean = false,
    ) = WorkoutSession(
        id = id,
        planId = "plan-1",
        trainingDayId = "day-1",
        recordDate = recordDate,
        trainingType = TrainingType.PUSH,
        workoutStatus = status,
        startedAt = testInstant,
        endedAt = null,
        isBackfill = isBackfill,
        createdAt = testInstant,
        updatedAt = testInstant,
    )

    private fun createTestExerciseInput(
        exerciseId: String = "ex-1",
        orderIndex: Int = 1,
        targetSets: Int = 3,
        targetReps: Int = 5,
    ) = WorkoutExerciseInput(
        exerciseId = exerciseId,
        orderIndex = orderIndex,
        targetSets = targetSets,
        targetReps = targetReps,
        exerciseMode = ExerciseMode.FIXED,
    )

    // ============================================================
    // Create Session
    // ============================================================

    @Test
    fun testCreateSession() = runTest {
        val (repo, _) = createRepository()
        val session = createTestSession()
        val exercises = listOf(createTestExerciseInput())

        val result = repo.createSession(session, exercises)
        assertTrue(result.isSuccess)
        assertEquals("session-1", result.getOrThrow())
    }

    @Test
    fun testCreateSessionWithMultipleExercises() = runTest {
        val (repo, _) = createRepository()
        val session = createTestSession()
        val exercises = listOf(
            createTestExerciseInput(exerciseId = "ex-1", orderIndex = 1),
            createTestExerciseInput(exerciseId = "ex-2", orderIndex = 2),
        )

        repo.createSession(session, exercises)

        val detail = repo.getSessionWithDetails("session-1").first()
        assertNotNull(detail)
        assertEquals(2, detail.exercises.size)
        assertEquals("ex-1", detail.exercises[0].workoutExercise.exerciseId)
        assertEquals("ex-2", detail.exercises[1].workoutExercise.exerciseId)
    }

    @Test
    fun testCreateSessionAndGetByDateRange() = runTest {
        val (repo, _) = createRepository()
        val session = createTestSession()
        repo.createSession(session, listOf(createTestExerciseInput()))

        val sessions = repo.getSessionsByDateRange(
            LocalDate.parse("2025-01-01"),
            LocalDate.parse("2025-01-31"),
        ).first()
        assertEquals(1, sessions.size)
        assertEquals("session-1", sessions[0].id)
    }

    @Test
    fun testGetSessionsByDateRangeEmpty() = runTest {
        val (repo, _) = createRepository()
        val session = createTestSession(recordDate = LocalDate.parse("2025-02-15"))
        repo.createSession(session, listOf(createTestExerciseInput()))

        val sessions = repo.getSessionsByDateRange(
            LocalDate.parse("2025-01-01"),
            LocalDate.parse("2025-01-31"),
        ).first()
        assertEquals(0, sessions.size)
    }

    // ============================================================
    // Record Sets
    // ============================================================

    @Test
    fun testRecordSet() = runTest {
        val (repo, _) = createRepository()
        val session = createTestSession()
        repo.createSession(session, listOf(createTestExerciseInput()))

        // Need to find the workout exercise ID
        val detail = repo.getSessionWithDetails("session-1").first()
        assertNotNull(detail)
        val weId = detail.exercises[0].workoutExercise.id

        val setInput = ExerciseSetInput(
            setIndex = 0,
            targetWeight = 60.0,
            actualWeight = 60.0,
            targetReps = 5,
            actualReps = 5,
        )
        val result = repo.recordSet(weId, setInput)
        assertTrue(result.isSuccess)
        val set = result.getOrThrow()
        assertEquals(0, set.setIndex)
        assertEquals(60.0, set.actualWeight)
        assertEquals(5, set.actualReps)
        assertTrue(set.isCompleted)
    }

    @Test
    fun testRecordSetInvalidWeight() = runTest {
        val (repo, _) = createRepository()
        val session = createTestSession()
        repo.createSession(session, listOf(createTestExerciseInput()))

        val detail = repo.getSessionWithDetails("session-1").first()
        assertNotNull(detail)
        val weId = detail.exercises[0].workoutExercise.id

        val setInput = ExerciseSetInput(
            setIndex = 0,
            targetWeight = 60.0,
            actualWeight = -5.0,
            targetReps = 5,
            actualReps = 5,
        )
        val result = repo.recordSet(weId, setInput)
        assertTrue(result.isFailure)
        assertIs<DomainError.InvalidWeightError>(result.exceptionOrNull())
    }

    @Test
    fun testRecordSetInvalidReps() = runTest {
        val (repo, _) = createRepository()
        val session = createTestSession()
        repo.createSession(session, listOf(createTestExerciseInput()))

        val detail = repo.getSessionWithDetails("session-1").first()
        assertNotNull(detail)
        val weId = detail.exercises[0].workoutExercise.id

        val setInput = ExerciseSetInput(
            setIndex = 0,
            targetWeight = 60.0,
            actualWeight = 60.0,
            targetReps = 5,
            actualReps = -1,
        )
        val result = repo.recordSet(weId, setInput)
        assertTrue(result.isFailure)
        assertIs<DomainError.InvalidRepsError>(result.exceptionOrNull())
    }

    @Test
    fun testRecordSetOnLockedSessionFails() = runTest {
        val (repo, _) = createRepository()
        val session = createTestSession()
        repo.createSession(session, listOf(createTestExerciseInput()))

        val detail = repo.getSessionWithDetails("session-1").first()
        assertNotNull(detail)
        val weId = detail.exercises[0].workoutExercise.id

        // Complete the session
        repo.completeSession("session-1")

        val setInput = ExerciseSetInput(
            setIndex = 0,
            targetWeight = 60.0,
            actualWeight = 60.0,
            targetReps = 5,
            actualReps = 5,
        )
        val result = repo.recordSet(weId, setInput)
        assertTrue(result.isFailure)
        assertIs<DomainError.SessionLockedError>(result.exceptionOrNull())
    }

    @Test
    fun testRecordSetUpdatesExerciseStatusToInProgress() = runTest {
        val (repo, _) = createRepository()
        val session = createTestSession()
        repo.createSession(session, listOf(createTestExerciseInput()))

        val detail = repo.getSessionWithDetails("session-1").first()
        assertNotNull(detail)
        assertEquals(ExerciseStatus.PENDING, detail.exercises[0].workoutExercise.exerciseStatus)

        val weId = detail.exercises[0].workoutExercise.id
        val setInput = ExerciseSetInput(
            setIndex = 0,
            targetWeight = 60.0,
            actualWeight = 60.0,
            targetReps = 5,
            actualReps = 5,
        )
        repo.recordSet(weId, setInput)

        val updatedDetail = repo.getSessionWithDetails("session-1").first()
        assertNotNull(updatedDetail)
        assertEquals(ExerciseStatus.IN_PROGRESS, updatedDetail.exercises[0].workoutExercise.exerciseStatus)
    }

    // ============================================================
    // Update Exercise Status
    // ============================================================

    @Test
    fun testUpdateExerciseStatus() = runTest {
        val (repo, _) = createRepository()
        val session = createTestSession()
        repo.createSession(session, listOf(createTestExerciseInput()))

        val detail = repo.getSessionWithDetails("session-1").first()
        assertNotNull(detail)
        val weId = detail.exercises[0].workoutExercise.id

        val result = repo.updateExerciseStatus(weId, ExerciseStatus.COMPLETED)
        assertTrue(result.isSuccess)

        val updated = repo.getSessionWithDetails("session-1").first()
        assertNotNull(updated)
        assertEquals(ExerciseStatus.COMPLETED, updated.exercises[0].workoutExercise.exerciseStatus)
    }

    @Test
    fun testUpdateExerciseStatusOnLockedSessionFails() = runTest {
        val (repo, _) = createRepository()
        val session = createTestSession()
        repo.createSession(session, listOf(createTestExerciseInput()))

        val detail = repo.getSessionWithDetails("session-1").first()
        assertNotNull(detail)
        val weId = detail.exercises[0].workoutExercise.id

        repo.completeSession("session-1")

        val result = repo.updateExerciseStatus(weId, ExerciseStatus.COMPLETED)
        assertTrue(result.isFailure)
        assertIs<DomainError.SessionLockedError>(result.exceptionOrNull())
    }

    // ============================================================
    // Complete / Partial Complete Session
    // ============================================================

    @Test
    fun testCompleteSession() = runTest {
        val (repo, _) = createRepository()
        val session = createTestSession()
        repo.createSession(session, listOf(createTestExerciseInput()))

        val result = repo.completeSession("session-1")
        assertTrue(result.isSuccess)

        val detail = repo.getSessionWithDetails("session-1").first()
        assertNotNull(detail)
        assertEquals(WorkoutStatus.COMPLETED, detail.session.workoutStatus)
        assertNotNull(detail.session.endedAt)
    }

    @Test
    fun testPartialCompleteSession() = runTest {
        val (repo, _) = createRepository()
        val session = createTestSession()
        repo.createSession(session, listOf(createTestExerciseInput()))

        val result = repo.partialCompleteSession("session-1")
        assertTrue(result.isSuccess)

        val detail = repo.getSessionWithDetails("session-1").first()
        assertNotNull(detail)
        assertEquals(WorkoutStatus.COMPLETED_PARTIAL, detail.session.workoutStatus)
        assertNotNull(detail.session.endedAt)
    }

    @Test
    fun testCompleteSessionNotFound() = runTest {
        val (repo, _) = createRepository()

        val result = repo.completeSession("nonexistent")
        assertTrue(result.isFailure)
        assertIs<DomainError.SessionNotFoundError>(result.exceptionOrNull())
    }

    @Test
    fun testCompleteAlreadyCompletedSessionFails() = runTest {
        val (repo, _) = createRepository()
        val session = createTestSession()
        repo.createSession(session, listOf(createTestExerciseInput()))

        repo.completeSession("session-1")

        val result = repo.completeSession("session-1")
        assertTrue(result.isFailure)
        assertIs<DomainError.SessionLockedError>(result.exceptionOrNull())
    }

    @Test
    fun testPartialCompleteAlreadyCompletedSessionFails() = runTest {
        val (repo, _) = createRepository()
        val session = createTestSession()
        repo.createSession(session, listOf(createTestExerciseInput()))

        repo.completeSession("session-1")

        val result = repo.partialCompleteSession("session-1")
        assertTrue(result.isFailure)
        assertIs<DomainError.SessionLockedError>(result.exceptionOrNull())
    }

    @Test
    fun testPartialCompleteNotFoundFails() = runTest {
        val (repo, _) = createRepository()

        val result = repo.partialCompleteSession("nonexistent")
        assertTrue(result.isFailure)
        assertIs<DomainError.SessionNotFoundError>(result.exceptionOrNull())
    }

    // ============================================================
    // Delete Session (cascade)
    // ============================================================

    @Test
    fun testDeleteSession() = runTest {
        val (repo, _) = createRepository()
        val session = createTestSession()
        repo.createSession(session, listOf(createTestExerciseInput()))

        val result = repo.deleteSession("session-1")
        assertTrue(result.isSuccess)

        val detail = repo.getSessionWithDetails("session-1").first()
        assertEquals(null, detail)
    }

    @Test
    fun testDeleteSessionCascadesExercisesAndSets() = runTest {
        val (repo, _) = createRepository()
        val session = createTestSession()
        repo.createSession(session, listOf(createTestExerciseInput()))

        // Record a set first
        val detail = repo.getSessionWithDetails("session-1").first()
        assertNotNull(detail)
        val weId = detail.exercises[0].workoutExercise.id
        val setInput = ExerciseSetInput(
            setIndex = 0,
            targetWeight = 60.0,
            actualWeight = 60.0,
            targetReps = 5,
            actualReps = 5,
        )
        repo.recordSet(weId, setInput)

        // Verify set exists
        var d = repo.getSessionWithDetails("session-1").first()
        assertNotNull(d)
        assertEquals(1, d.exercises[0].sets.size)

        // Delete session - cascade should remove exercises and sets
        repo.deleteSession("session-1")
        d = repo.getSessionWithDetails("session-1").first()
        assertEquals(null, d)
    }

    @Test
    fun testDeleteSessionNotFound() = runTest {
        val (repo, _) = createRepository()

        val result = repo.deleteSession("nonexistent")
        assertTrue(result.isFailure)
        assertIs<DomainError.SessionNotFoundError>(result.exceptionOrNull())
    }

    // ============================================================
    // Backfill Session
    // ============================================================

    @Test
    fun testBackfillSession() = runTest {
        val (repo, _) = createRepository()
        val session = createTestSession(id = "backfill-1", isBackfill = false)

        val exercise = WorkoutExercise(
            id = "we-1",
            workoutSessionId = "backfill-1",
            exerciseId = "ex-1",
            orderIndex = 1,
            note = null,
            suggestedWeight = null,
            isCustomWeight = false,
            targetSets = 3,
            targetReps = 5,
            exerciseMode = ExerciseMode.FIXED,
            exerciseStatus = ExerciseStatus.COMPLETED,
            createdAt = testInstant,
            updatedAt = testInstant,
        )

        val set = ExerciseSet(
            id = "set-1",
            workoutExerciseId = "we-1",
            setIndex = 0,
            targetWeight = 60.0,
            actualWeight = 60.0,
            targetReps = 5,
            actualReps = 5,
            isCompleted = true,
            restStartedAt = null,
            restDuration = null,
            createdAt = testInstant,
            updatedAt = testInstant,
        )

        val exercises = listOf(WorkoutExerciseWithSets(exercise, listOf(set)))

        val result = repo.backfillSession(session, exercises)
        assertTrue(result.isSuccess)
        assertEquals("backfill-1", result.getOrThrow())

        val detail = repo.getSessionWithDetails("backfill-1").first()
        assertNotNull(detail)
        assertTrue(detail.session.isBackfill)
        assertEquals(1, detail.exercises.size)
        assertEquals(1, detail.exercises[0].sets.size)
        assertEquals(60.0, detail.exercises[0].sets[0].actualWeight)
    }

    @Test
    fun testBackfillSessionOverridesBackfillFlag() = runTest {
        val (repo, _) = createRepository()
        // Create session with isBackfill = false
        val session = createTestSession(id = "bf-2", isBackfill = false)

        val result = repo.backfillSession(session, emptyList())
        assertTrue(result.isSuccess)

        val detail = repo.getSessionWithDetails("bf-2").first()
        assertNotNull(detail)
        // Should be overridden to true
        assertTrue(detail.session.isBackfill)
    }

    @Test
    fun testBackfillSessionWithMultipleExercisesAndSets() = runTest {
        val (repo, _) = createRepository()
        val session = createTestSession(id = "bf-3")

        val exercises = (0..2).map { i ->
            val we = WorkoutExercise(
                id = "we-$i",
                workoutSessionId = "bf-3",
                exerciseId = "ex-$i",
                orderIndex = i,
                note = null,
                suggestedWeight = null,
                isCustomWeight = false,
                targetSets = 3,
                targetReps = 5,
                exerciseMode = ExerciseMode.FIXED,
                exerciseStatus = ExerciseStatus.COMPLETED,
                createdAt = testInstant,
                updatedAt = testInstant,
            )
            val sets = (0..2).map { j ->
                ExerciseSet(
                    id = "set-$i-$j",
                    workoutExerciseId = "we-$i",
                    setIndex = j,
                    targetWeight = 60.0 + i,
                    actualWeight = 60.0 + i,
                    targetReps = 5,
                    actualReps = 5,
                    isCompleted = true,
                    restStartedAt = null,
                    restDuration = null,
                    createdAt = testInstant,
                    updatedAt = testInstant,
                )
            }
            WorkoutExerciseWithSets(we, sets)
        }

        val result = repo.backfillSession(session, exercises)
        assertTrue(result.isSuccess)

        val detail = repo.getSessionWithDetails("bf-3").first()
        assertNotNull(detail)
        assertEquals(3, detail.exercises.size)
        detail.exercises.forEach { we ->
            assertEquals(3, we.sets.size)
        }
    }

    // ============================================================
    // Full workout lifecycle
    // ============================================================

    @Test
    fun testFullWorkoutLifecycleCreateRecordSetsComplete() = runTest {
        val (repo, _) = createRepository()
        val session = createTestSession()
        val exercises = listOf(
            createTestExerciseInput(exerciseId = "ex-1", orderIndex = 1),
            createTestExerciseInput(exerciseId = "ex-2", orderIndex = 2),
        )

        // Create session
        repo.createSession(session, exercises)

        // Record sets for first exercise
        val detail = repo.getSessionWithDetails("session-1").first()
        assertNotNull(detail)
        val we1Id = detail.exercises[0].workoutExercise.id
        val we2Id = detail.exercises[1].workoutExercise.id

        repo.recordSet(we1Id, ExerciseSetInput(0, 60.0, 60.0, 5, 5))
        repo.recordSet(we1Id, ExerciseSetInput(1, 60.0, 62.5, 5, 5))
        repo.recordSet(we1Id, ExerciseSetInput(2, 60.0, 62.5, 5, 4))

        // Record sets for second exercise
        repo.recordSet(we2Id, ExerciseSetInput(0, 80.0, 80.0, 5, 5))

        // Verify sets recorded
        var d = repo.getSessionWithDetails("session-1").first()
        assertNotNull(d)
        assertEquals(3, d.exercises[0].sets.size)
        assertEquals(1, d.exercises[1].sets.size)

        // Update exercise status
        repo.updateExerciseStatus(we1Id, ExerciseStatus.COMPLETED)
        repo.updateExerciseStatus(we2Id, ExerciseStatus.COMPLETED)

        // Complete session
        repo.completeSession("session-1")

        d = repo.getSessionWithDetails("session-1").first()
        assertNotNull(d)
        assertEquals(WorkoutStatus.COMPLETED, d.session.workoutStatus)
        assertNotNull(d.session.endedAt)
    }

    @Test
    fun testPartialCompletionWorkflow() = runTest {
        val (repo, _) = createRepository()
        val session = createTestSession()
        val exercises = listOf(
            createTestExerciseInput(exerciseId = "ex-1", orderIndex = 1),
            createTestExerciseInput(exerciseId = "ex-2", orderIndex = 2),
            createTestExerciseInput(exerciseId = "ex-3", orderIndex = 3),
        )

        repo.createSession(session, exercises)

        val detail = repo.getSessionWithDetails("session-1").first()
        assertNotNull(detail)

        // Complete only 2 of 3 exercises
        val we1Id = detail.exercises[0].workoutExercise.id
        val we2Id = detail.exercises[1].workoutExercise.id

        repo.recordSet(we1Id, ExerciseSetInput(0, 60.0, 60.0, 5, 5))
        repo.recordSet(we2Id, ExerciseSetInput(0, 80.0, 80.0, 5, 5))

        repo.updateExerciseStatus(we1Id, ExerciseStatus.COMPLETED)
        repo.updateExerciseStatus(we2Id, ExerciseStatus.COMPLETED)

        // Partial complete
        repo.partialCompleteSession("session-1")

        val d = repo.getSessionWithDetails("session-1").first()
        assertNotNull(d)
        assertEquals(WorkoutStatus.COMPLETED_PARTIAL, d.session.workoutStatus)
        assertNotNull(d.session.endedAt)
    }

    // ============================================================
    // Update session status
    // ============================================================

    @Test
    fun testUpdateSessionStatusOnLockedSessionFails() = runTest {
        val (repo, _) = createRepository()
        val session = createTestSession()
        repo.createSession(session, listOf(createTestExerciseInput()))

        repo.completeSession("session-1")

        val result = repo.updateSessionStatus("session-1", WorkoutStatus.IN_PROGRESS)
        assertTrue(result.isFailure)
        assertIs<DomainError.SessionLockedError>(result.exceptionOrNull())
    }

    @Test
    fun testUpdateSessionStatusNotFound() = runTest {
        val (repo, _) = createRepository()

        val result = repo.updateSessionStatus("nonexistent", WorkoutStatus.COMPLETED)
        assertTrue(result.isFailure)
        assertIs<DomainError.SessionNotFoundError>(result.exceptionOrNull())
    }

    @Test
    fun testRecordSetNonExistentExerciseFails() = runTest {
        val (repo, _) = createRepository()

        val setInput = ExerciseSetInput(0, 60.0, 60.0, 5, 5)
        val result = repo.recordSet("nonexistent", setInput)
        assertTrue(result.isFailure)
        assertIs<DomainError.WorkoutExerciseNotFoundError>(result.exceptionOrNull())
    }
}
