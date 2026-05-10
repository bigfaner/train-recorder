package com.trainrecorder.data.repository

import com.trainrecorder.createTestDatabase
import com.trainrecorder.db.TrainRecorderDatabase
import com.trainrecorder.domain.model.DomainError
import com.trainrecorder.domain.repository.ExerciseFeelingInput
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class FeelingRepositoryImplTest {

    private fun createRepository(): Pair<FeelingRepositoryImpl, TrainRecorderDatabase> {
        val db = createTestDatabase()
        return FeelingRepositoryImpl(db) to db
    }

    private val testInstant = kotlinx.datetime.Instant.parse("2025-01-15T10:30:00Z")

    /**
     * Helper to set up a workout session for testing.
     */
    private suspend fun setupSession(db: TrainRecorderDatabase, sessionId: String = "ws-1") {
        val queries = db.trainRecorderQueries
        queries.insertSession(
            id = sessionId,
            plan_id = null,
            training_day_id = null,
            record_date = "2025-01-15",
            training_type = "push",
            workout_status = "in_progress",
            started_at = testInstant.toString(),
            ended_at = null,
            is_backfill = 0L,
            created_at = testInstant.toString(),
            updated_at = testInstant.toString(),
        )
    }

    // ============================================================
    // Save Feeling
    // ============================================================

    @Test
    fun testSaveFeeling() = runTest {
        val (repo, db) = createRepository()
        setupSession(db)

        val exerciseNotes = listOf(
            ExerciseFeelingInput(exerciseId = "ex-1", notes = "Felt strong"),
            ExerciseFeelingInput(exerciseId = "ex-2", notes = null),
        )

        val result = repo.saveFeeling(
            sessionId = "ws-1",
            fatigue = 6,
            satisfaction = 8,
            notes = "Good session",
            exerciseNotes = exerciseNotes,
        )
        assertTrue(result.isSuccess)

        val feeling = repo.getFeelingForSession("ws-1").first()
        assertNotNull(feeling)
        assertEquals(6, feeling.fatigueLevel)
        assertEquals(8, feeling.satisfactionLevel)
        assertEquals("Good session", feeling.notes)
    }

    @Test
    fun testSaveFeelingWithEmptyExerciseNotes() = runTest {
        val (repo, db) = createRepository()
        setupSession(db)

        val result = repo.saveFeeling(
            sessionId = "ws-1",
            fatigue = 5,
            satisfaction = 5,
            notes = null,
            exerciseNotes = emptyList(),
        )
        assertTrue(result.isSuccess)

        val feeling = repo.getFeelingForSession("ws-1").first()
        assertNotNull(feeling)
        assertEquals(5, feeling.fatigueLevel)
        assertNull(feeling.notes)
    }

    @Test
    fun testSaveFeelingInvalidFatigue() = runTest {
        val (repo, db) = createRepository()
        setupSession(db)

        val result = repo.saveFeeling(
            sessionId = "ws-1",
            fatigue = 0,
            satisfaction = 5,
            notes = null,
            exerciseNotes = emptyList(),
        )
        assertTrue(result.isFailure)
        assertIs<DomainError.ValidationError>(result.exceptionOrNull())
    }

    @Test
    fun testSaveFeelingInvalidSatisfaction() = runTest {
        val (repo, db) = createRepository()
        setupSession(db)

        val result = repo.saveFeeling(
            sessionId = "ws-1",
            fatigue = 5,
            satisfaction = 11,
            notes = null,
            exerciseNotes = emptyList(),
        )
        assertTrue(result.isFailure)
        assertIs<DomainError.ValidationError>(result.exceptionOrNull())
    }

    @Test
    fun testSaveFeelingDuplicateForSession() = runTest {
        val (repo, db) = createRepository()
        setupSession(db)

        repo.saveFeeling("ws-1", 5, 5, null, emptyList())

        val result = repo.saveFeeling("ws-1", 6, 7, "Second attempt", emptyList())
        assertTrue(result.isFailure)
        assertIs<DomainError.ValidationError>(result.exceptionOrNull())
    }

    // ============================================================
    // Update Feeling
    // ============================================================

    @Test
    fun testUpdateFeeling() = runTest {
        val (repo, db) = createRepository()
        setupSession(db)

        repo.saveFeeling("ws-1", 5, 5, "Initial", emptyList())

        val feeling = repo.getFeelingForSession("ws-1").first()
        assertNotNull(feeling)

        val result = repo.updateFeeling(feeling.id, 7, 8, "Updated notes")
        assertTrue(result.isSuccess)

        val updated = repo.getFeelingForSession("ws-1").first()
        assertNotNull(updated)
        assertEquals(7, updated.fatigueLevel)
        assertEquals(8, updated.satisfactionLevel)
        assertEquals("Updated notes", updated.notes)
    }

    @Test
    fun testUpdateFeelingNotFound() = runTest {
        val (repo, _) = createRepository()

        val result = repo.updateFeeling("nonexistent", 5, 5, null)
        assertTrue(result.isFailure)
        assertIs<DomainError.FeelingNotFoundError>(result.exceptionOrNull())
    }

    // ============================================================
    // Get Feeling for Session
    // ============================================================

    @Test
    fun testGetFeelingForSessionEmpty() = runTest {
        val (repo, _) = createRepository()

        val feeling = repo.getFeelingForSession("nonexistent").first()
        assertNull(feeling)
    }

    // ============================================================
    // Full roundtrip
    // ============================================================

    @Test
    fun testFullFeelingRoundtrip() = runTest {
        val (repo, db) = createRepository()
        setupSession(db)

        // Save
        repo.saveFeeling(
            sessionId = "ws-1",
            fatigue = 3,
            satisfaction = 9,
            notes = "Great workout",
            exerciseNotes = listOf(
                ExerciseFeelingInput(exerciseId = "ex-1", notes = "PR!"),
            ),
        )

        // Verify
        var feeling = repo.getFeelingForSession("ws-1").first()
        assertNotNull(feeling)
        assertEquals(3, feeling.fatigueLevel)
        assertEquals(9, feeling.satisfactionLevel)

        // Update
        repo.updateFeeling(feeling.id, 4, 7, "Actually not that great")
        feeling = repo.getFeelingForSession("ws-1").first()
        assertNotNull(feeling)
        assertEquals(4, feeling.fatigueLevel)
        assertEquals(7, feeling.satisfactionLevel)
        assertEquals("Actually not that great", feeling.notes)
    }
}
