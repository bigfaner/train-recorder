package com.trainrecorder.data.repository

import app.cash.sqldelight.coroutines.asFlow
import app.cash.sqldelight.coroutines.mapToOneOrNull
import com.trainrecorder.db.TrainRecorderDatabase
import com.trainrecorder.domain.mapper.toDomain
import com.trainrecorder.domain.model.ExerciseSet
import com.trainrecorder.domain.model.WeightSuggestion
import com.trainrecorder.domain.repository.WeightSuggestionRepository
import com.trainrecorder.domain.usecase.WeightSuggester
import com.trainrecorder.domain.usecase.WeightSuggestionResult
import com.trainrecorder.domain.repository.WorkoutExerciseWithSets
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDate

/**
 * SQLDelight-backed implementation of WeightSuggestionRepository.
 * Cache layer for weight suggestions, recalculates from exercise_set history.
 */
class WeightSuggestionRepositoryImpl(
    private val database: TrainRecorderDatabase,
    private val weightSuggester: WeightSuggester = WeightSuggester(),
) : WeightSuggestionRepository {

    private val queries = database.trainRecorderQueries

    override fun getSuggestion(exerciseId: String): Flow<WeightSuggestion?> =
        queries.selectWeightSuggestionByExerciseId(exerciseId)
            .asFlow().mapToOneOrNull(Dispatchers.IO).map { it?.toDomain() }

    override suspend fun recalculate(exerciseId: String): Result<Unit> = runCatching {
        recalculateForExercise(exerciseId)
    }

    override suspend fun recalculateChain(fromDate: LocalDate, exerciseId: String): Result<Unit> = runCatching {
        // For chain recalculation, we recalculate the exercise suggestion.
        // The fromDate parameter allows targeted recalculation after backfill/edit,
        // but the calculation itself considers all history up to the current date.
        recalculateForExercise(exerciseId)
    }

    /**
     * Recalculate weight suggestion for an exercise:
     * 1. Get the exercise's weight increment
     * 2. Get recent workout exercises with their sets for this exercise
     * 3. Use WeightSuggester to compute suggestion
     * 4. Insert or update the weight_suggestion cache row
     */
    private fun recalculateForExercise(exerciseId: String) {
        // Get the exercise to find weight increment
        val exercise = queries.selectExerciseById(exerciseId).executeAsOneOrNull() ?: return
        val increment = exercise.weight_increment

        // Get recent workout exercises for this exercise, ordered by date desc
        val workoutExerciseRows = queries.selectRecentWorkoutExercisesForSuggestion(exerciseId).executeAsList()

        // Build WorkoutExerciseWithSets list for the WeightSuggester
        val recentSessions = workoutExerciseRows.map { weRow ->
            val workoutExercise = weRow.toDomain()
            val setRows = queries.selectSetsByWorkoutExerciseId(workoutExercise.id).executeAsList()
            val sets = setRows.map { it.toDomain() }
            WorkoutExerciseWithSets(workoutExercise, sets)
        }

        val result = weightSuggester.calculate(exerciseId, increment, recentSessions)

        val now = Clock.System.now().toString()
        val nowInstant = Clock.System.now()
        val existing = queries.selectWeightSuggestionByExerciseId(exerciseId).executeAsOneOrNull()

        if (existing != null) {
            queries.updateWeightSuggestion(
                suggested_weight = result.suggestedWeight,
                based_on_session_id = null, // Not tracking specific session
                consecutive_completions = result.consecutiveCompletions.toLong(),
                consecutive_failures = result.consecutiveFailures.toLong(),
                last_calculated_at = now,
                updated_at = now,
                id = existing.id,
            )
        } else {
            queries.insertWeightSuggestion(
                id = generateId(),
                exercise_id = exerciseId,
                suggested_weight = result.suggestedWeight,
                based_on_session_id = null,
                consecutive_completions = result.consecutiveCompletions.toLong(),
                consecutive_failures = result.consecutiveFailures.toLong(),
                last_calculated_at = now,
                created_at = now,
                updated_at = now,
            )
        }
    }

    companion object {
        private fun generateId(): String = "id-${java.util.UUID.randomUUID()}"
    }
}
