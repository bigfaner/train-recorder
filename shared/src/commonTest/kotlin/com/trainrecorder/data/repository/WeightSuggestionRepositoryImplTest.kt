package com.trainrecorder.data.repository

import com.trainrecorder.createTestDatabase
import com.trainrecorder.db.TrainRecorderDatabase
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class WeightSuggestionRepositoryImplTest {

    private fun createRepository(): Pair<WeightSuggestionRepositoryImpl, TrainRecorderDatabase> {
        val db = createTestDatabase()
        return WeightSuggestionRepositoryImpl(db) to db
    }

    private val testInstant = Instant.parse("2025-01-15T10:30:00Z")

    /**
     * Sets up an exercise, session, workout exercise, and exercise sets for suggestion testing.
     */
    private fun setupWorkoutData(
        db: TrainRecorderDatabase,
        exerciseId: String = "ex-1",
        sessionId: String = "ws-1",
        sessionDate: String = "2025-01-15",
        workoutExerciseId: String = "we-1",
        targetSets: Int = 3,
        targetReps: Int = 5,
        sets: List<Triple<Double, Int?, Boolean>> = listOf(
            Triple(100.0, 5, true), // weight, reps, isCompleted
        ),
    ) {
        val queries = db.trainRecorderQueries
        // Insert exercise using INSERT OR IGNORE to allow repeated calls
        queries.insertOrIgnoreExercise(
            id = exerciseId,
            display_name = "Squat-$exerciseId",
            category = "core",
            weight_increment = 2.5,
            default_rest = 180L,
            is_custom = 0L,
            created_at = testInstant.toString(),
            updated_at = testInstant.toString(),
        )

        // Insert session (check if already exists)
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
            target_sets = targetSets.toLong(),
            target_reps = targetReps.toLong(),
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
                target_reps = targetReps.toLong(),
                actual_reps = reps?.toLong(),
                is_completed = if (isCompleted) 1L else 0L,
                rest_started_at = null,
                rest_duration = null,
                created_at = testInstant.toString(),
                updated_at = testInstant.toString(),
            )
        }
    }

    // ============================================================
    // getSuggestion
    // ============================================================

    @Test
    fun testGetSuggestionEmpty() = runTest {
        val (repo, _) = createRepository()

        val suggestion = repo.getSuggestion("ex-1").first()
        assertNull(suggestion)
    }

    @Test
    fun testRecalculateCreatesSuggestionFromHistory() = runTest {
        val (repo, db) = createRepository()
        setupWorkoutData(db, sets = listOf(
            Triple(100.0, 5, true),
            Triple(100.0, 5, true),
            Triple(100.0, 5, true),
        ))

        val result = repo.recalculate("ex-1")
        assertTrue(result.isSuccess)

        val suggestion = repo.getSuggestion("ex-1").first()
        assertNotNull(suggestion)
        assertEquals(102.5, suggestion.suggestedWeight) // 100 + 2.5 increment
        assertEquals(1, suggestion.consecutiveCompletions)
    }

    @Test
    fun testRecalculateNoHistoryReturnsNullWeight() = runTest {
        val (repo, db) = createRepository()
        // Insert exercise only, no sessions
        val queries = db.trainRecorderQueries
        queries.insertExercise(
            id = "ex-1",
            display_name = "Squat",
            category = "core",
            weight_increment = 2.5,
            default_rest = 180L,
            is_custom = 0L,
            created_at = testInstant.toString(),
            updated_at = testInstant.toString(),
        )

        val result = repo.recalculate("ex-1")
        assertTrue(result.isSuccess)

        val suggestion = repo.getSuggestion("ex-1").first()
        assertNotNull(suggestion)
        assertNull(suggestion.suggestedWeight)
        assertEquals(0, suggestion.consecutiveCompletions)
    }

    // ============================================================
    // recalculateChain
    // ============================================================

    @Test
    fun testRecalculateChain() = runTest {
        val (repo, db) = createRepository()
        setupWorkoutData(db, sets = listOf(
            Triple(100.0, 5, true),
            Triple(100.0, 5, true),
            Triple(100.0, 5, true),
        ))

        val result = repo.recalculateChain(LocalDate.parse("2025-01-15"), "ex-1")
        assertTrue(result.isSuccess)

        val suggestion = repo.getSuggestion("ex-1").first()
        assertNotNull(suggestion)
        assertEquals(102.5, suggestion.suggestedWeight)
    }

    // ============================================================
    // Suggestion updates on subsequent calculations
    // ============================================================

    @Test
    fun testSuggestionUpdatesAfterSecondWorkout() = runTest {
        val (repo, db) = createRepository()

        // First workout: all completed
        setupWorkoutData(db, sessionId = "ws-1", sessionDate = "2025-01-10",
            workoutExerciseId = "we-1",
            sets = listOf(
                Triple(100.0, 5, true),
                Triple(100.0, 5, true),
                Triple(100.0, 5, true),
            ))
        repo.recalculate("ex-1")

        // Second workout: all completed
        setupWorkoutData(db, sessionId = "ws-2", sessionDate = "2025-01-15",
            workoutExerciseId = "we-2",
            sets = listOf(
                Triple(102.5, 5, true),
                Triple(102.5, 5, true),
                Triple(102.5, 5, true),
            ))
        repo.recalculate("ex-1")

        val suggestion = repo.getSuggestion("ex-1").first()
        assertNotNull(suggestion)
        assertEquals(105.0, suggestion.suggestedWeight) // 102.5 + 2.5
        assertEquals(2, suggestion.consecutiveCompletions)
    }

    @Test
    fun testSuggestionWithPartialCompletion() = runTest {
        val (repo, db) = createRepository()

        // Workout with partial completion (not all reps met)
        setupWorkoutData(db,
            targetSets = 3,
            targetReps = 5,
            sets = listOf(
                Triple(100.0, 5, true),
                Triple(100.0, 3, true), // failed reps
                Triple(100.0, 5, true),
            ))
        repo.recalculate("ex-1")

        val suggestion = repo.getSuggestion("ex-1").first()
        assertNotNull(suggestion)
        // Should not increase because not all reps were met
        assertEquals(100.0, suggestion.suggestedWeight)
        assertTrue(suggestion.consecutiveFailures > 0)
    }
}
