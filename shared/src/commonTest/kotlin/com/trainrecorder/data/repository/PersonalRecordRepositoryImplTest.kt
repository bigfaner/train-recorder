package com.trainrecorder.data.repository

import com.trainrecorder.createTestDatabase
import com.trainrecorder.db.TrainRecorderDatabase
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Instant
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class PersonalRecordRepositoryImplTest {

    private fun createRepository(): Pair<PersonalRecordRepositoryImpl, TrainRecorderDatabase> {
        val db = createTestDatabase()
        return PersonalRecordRepositoryImpl(db) to db
    }

    private val testInstant = Instant.parse("2025-01-15T10:30:00Z")

    /**
     * Sets up an exercise, session, workout exercise, and exercise sets for PR testing.
     * Uses INSERT OR IGNORE for exercise and session to allow repeated calls with shared IDs.
     */
    private fun setupWorkoutData(
        db: TrainRecorderDatabase,
        exerciseId: String = "ex-1",
        exerciseName: String = "Squat",
        sessionId: String = "ws-1",
        sessionDate: String = "2025-01-15",
        workoutExerciseId: String = "we-1",
        sets: List<Triple<Double, Int, Boolean>> = listOf(
            Triple(100.0, 5, true), // weight, reps, isCompleted
        ),
    ) {
        val queries = db.trainRecorderQueries
        // Insert exercise using INSERT OR IGNORE to allow repeated calls
        queries.insertOrIgnoreExercise(
            id = exerciseId,
            display_name = exerciseName,
            category = "core",
            weight_increment = 2.5,
            default_rest = 180L,
            is_custom = 0L,
            created_at = testInstant.toString(),
            updated_at = testInstant.toString(),
        )

        // Insert session (may already exist if sharing sessionId)
        if (queries.selectSessionById(sessionId).executeAsOneOrNull() == null) {
            queries.insertSession(
                id = sessionId,
                plan_id = null,
                training_day_id = null,
                record_date = sessionDate,
                training_type = "push",
                workout_status = "completed",
                started_at = testInstant.toString(),
                ended_at = testInstant.toString(),
                is_backfill = 0L,
                created_at = testInstant.toString(),
                updated_at = testInstant.toString(),
            )
        }

        // Insert workout exercise
        queries.insertWorkoutExercise(
            id = workoutExerciseId,
            workout_session_id = sessionId,
            exercise_id = exerciseId,
            order_index = 1L,
            note = null,
            suggested_weight = null,
            is_custom_weight = 0L,
            target_sets = 3L,
            target_reps = 5L,
            exercise_mode = "fixed",
            exercise_status = "completed",
            created_at = testInstant.toString(),
            updated_at = testInstant.toString(),
        )

        // Insert sets
        sets.forEachIndexed { index, (weight, reps, isCompleted) ->
            queries.insertExerciseSet(
                id = "set-${workoutExerciseId}-${index}",
                workout_exercise_id = workoutExerciseId,
                set_index = index.toLong(),
                target_weight = weight,
                actual_weight = weight,
                target_reps = reps.toLong(),
                actual_reps = reps.toLong(),
                is_completed = if (isCompleted) 1L else 0L,
                rest_started_at = null,
                rest_duration = null,
                created_at = testInstant.toString(),
                updated_at = testInstant.toString(),
            )
        }
    }

    // ============================================================
    // updateAfterWorkout
    // ============================================================

    @Test
    fun testUpdateAfterWorkoutCreatesPR() = runTest {
        val (repo, db) = createRepository()
        setupWorkoutData(db, sets = listOf(
            Triple(100.0, 5, true),
            Triple(100.0, 5, true),
            Triple(100.0, 5, true),
        ))

        val result = repo.updateAfterWorkout("ws-1")
        assertTrue(result.isSuccess)

        val pr = repo.getRecord("ex-1").first()
        assertNotNull(pr)
        assertEquals(100.0, pr.maxWeight)
        assertEquals(1500.0, pr.maxVolume) // 100 * 5 * 3
    }

    @Test
    fun testUpdateAfterWorkoutMultipleExercises() = runTest {
        val (repo, db) = createRepository()
        setupWorkoutData(db, exerciseId = "ex-1", exerciseName = "Squat", workoutExerciseId = "we-1",
            sets = listOf(Triple(100.0, 5, true)))
        setupWorkoutData(db, exerciseId = "ex-2", exerciseName = "Bench", sessionId = "ws-1", workoutExerciseId = "we-2",
            sets = listOf(Triple(80.0, 8, true)))

        val result = repo.updateAfterWorkout("ws-1")
        assertTrue(result.isSuccess)

        val pr1 = repo.getRecord("ex-1").first()
        assertNotNull(pr1)
        assertEquals(100.0, pr1.maxWeight)

        val pr2 = repo.getRecord("ex-2").first()
        assertNotNull(pr2)
        assertEquals(80.0, pr2.maxWeight)
    }

    // ============================================================
    // recalculate
    // ============================================================

    @Test
    fun testRecalculateCreatesPRFromHistory() = runTest {
        val (repo, db) = createRepository()
        setupWorkoutData(db, sets = listOf(
            Triple(100.0, 5, true),
            Triple(105.0, 3, true),
        ))

        val result = repo.recalculate("ex-1")
        assertTrue(result.isSuccess)

        val pr = repo.getRecord("ex-1").first()
        assertNotNull(pr)
        assertEquals(105.0, pr.maxWeight)
        assertEquals(815.0, pr.maxVolume) // 100*5 + 105*3 = 500 + 315
    }

    @Test
    fun testRecalculateUpdatesExistingPR() = runTest {
        val (repo, db) = createRepository()
        // First session
        setupWorkoutData(db, sessionId = "ws-1", sessionDate = "2025-01-10",
            sets = listOf(Triple(100.0, 5, true)))

        repo.recalculate("ex-1")
        var pr = repo.getRecord("ex-1").first()
        assertNotNull(pr)
        assertEquals(100.0, pr.maxWeight)

        // Add second session with higher weight
        setupWorkoutData(db, sessionId = "ws-2", sessionDate = "2025-01-15",
            workoutExerciseId = "we-2",
            sets = listOf(Triple(110.0, 5, true)))

        repo.recalculate("ex-1")
        pr = repo.getRecord("ex-1").first()
        assertNotNull(pr)
        assertEquals(110.0, pr.maxWeight)
    }

    @Test
    fun testRecalculateRemovesPRWhenNoCompletedSets() = runTest {
        val (repo, db) = createRepository()
        // Setup with completed sets
        setupWorkoutData(db, sets = listOf(Triple(100.0, 5, true)))
        repo.recalculate("ex-1")
        assertNotNull(repo.getRecord("ex-1").first())

        // Delete the session data
        val queries = db.trainRecorderQueries
        queries.transaction {
            queries.deleteSetsBySessionId("ws-1")
            queries.deleteWorkoutExercisesBySessionId("ws-1")
            queries.deleteSessionById("ws-1")
        }

        // Recalculate should remove the PR
        val result = repo.recalculate("ex-1")
        assertTrue(result.isSuccess)
        assertNull(repo.getRecord("ex-1").first())
    }

    // ============================================================
    // recalculateAll
    // ============================================================

    @Test
    fun testRecalculateAll() = runTest {
        val (repo, db) = createRepository()
        setupWorkoutData(db, exerciseId = "ex-1", exerciseName = "Squat", workoutExerciseId = "we-1",
            sets = listOf(Triple(100.0, 5, true)))
        setupWorkoutData(db, exerciseId = "ex-2", exerciseName = "Bench", sessionId = "ws-2", workoutExerciseId = "we-2",
            sets = listOf(Triple(80.0, 8, true)))

        val result = repo.recalculateAll()
        assertTrue(result.isSuccess)

        val allRecords = repo.getAllRecords().first()
        assertEquals(2, allRecords.size)

        val pr1 = repo.getRecord("ex-1").first()
        assertNotNull(pr1)
        assertEquals(100.0, pr1.maxWeight)

        val pr2 = repo.getRecord("ex-2").first()
        assertNotNull(pr2)
        assertEquals(80.0, pr2.maxWeight)
    }

    // ============================================================
    // getAllRecords
    // ============================================================

    @Test
    fun testGetAllRecordsEmpty() = runTest {
        val (repo, _) = createRepository()

        val records = repo.getAllRecords().first()
        assertEquals(0, records.size)
    }

    @Test
    fun testGetAllRecordsOrderedByMaxWeight() = runTest {
        val (repo, db) = createRepository()
        setupWorkoutData(db, exerciseId = "ex-1", exerciseName = "Squat", workoutExerciseId = "we-1",
            sets = listOf(Triple(80.0, 5, true)))
        setupWorkoutData(db, exerciseId = "ex-2", exerciseName = "Bench", sessionId = "ws-2", workoutExerciseId = "we-2",
            sets = listOf(Triple(120.0, 5, true)))

        repo.recalculateAll()

        val records = repo.getAllRecords().first()
        assertEquals(2, records.size)
        assertEquals(120.0, records[0].maxWeight)
        assertEquals(80.0, records[1].maxWeight)
    }

    // ============================================================
    // Session deletion triggers PR recalculation
    // ============================================================

    @Test
    fun testPRRecalculatesAfterSessionDelete() = runTest {
        val (repo, db) = createRepository()

        // Session 1: 100kg
        setupWorkoutData(db, sessionId = "ws-1", sessionDate = "2025-01-10",
            sets = listOf(Triple(100.0, 5, true)))
        repo.recalculate("ex-1")
        assertEquals(100.0, repo.getRecord("ex-1").first()!!.maxWeight)

        // Session 2: 110kg (new PR)
        setupWorkoutData(db, sessionId = "ws-2", sessionDate = "2025-01-15",
            workoutExerciseId = "we-2",
            sets = listOf(Triple(110.0, 5, true)))
        repo.recalculate("ex-1")
        assertEquals(110.0, repo.getRecord("ex-1").first()!!.maxWeight)

        // Delete session 2 - PR should revert to 100kg
        val queries = db.trainRecorderQueries
        queries.transaction {
            queries.deleteSetsBySessionId("ws-2")
            queries.deleteWorkoutExercisesBySessionId("ws-2")
            queries.deleteSessionById("ws-2")
        }
        repo.recalculate("ex-1")

        val pr = repo.getRecord("ex-1").first()
        assertNotNull(pr)
        assertEquals(100.0, pr.maxWeight)
    }
}
