package com.trainrecorder.domain.usecase

import com.trainrecorder.domain.model.ExerciseSet
import com.trainrecorder.domain.model.SuggestionHint
import com.trainrecorder.domain.model.WorkoutExercise
import com.trainrecorder.domain.repository.WorkoutExerciseWithSets
import kotlin.math.floor

/**
 * Result of weight suggestion calculation for an exercise.
 */
data class WeightSuggestionResult(
    val suggestedWeight: Double?,
    val consecutiveCompletions: Int,
    val consecutiveFailures: Int,
    val hint: SuggestionHint?,
)

/**
 * Encapsulates weight suggestion logic using historical data,
 * personal records, and suggestion hints.
 *
 * Pure computation class -- no dependencies, no side effects.
 */
class WeightSuggester {
    /**
     * Calculate the suggested weight for an exercise based on recent sessions.
     *
     * @param exerciseId The exercise to calculate for.
     * @param increment The weight increment (e.g., 2.5 kg). Used for rounding.
     * @param recentSessions Recent workout exercises with their sets, ordered by date descending.
     * @return The suggestion result with weight, completion/failure counts, and hint.
     */
    fun calculate(
        exerciseId: String,
        increment: Double,
        recentSessions: List<WorkoutExerciseWithSets>,
    ): WeightSuggestionResult {
        if (recentSessions.isEmpty()) {
            return WeightSuggestionResult(
                suggestedWeight = null,
                consecutiveCompletions = 0,
                consecutiveFailures = 0,
                hint = SuggestionHint.FIRST_TIME,
            )
        }

        var consecutiveCompletions = 0
        var consecutiveFailures = 0
        var lastWeight: Double? = null

        for (session in recentSessions) {
            val sets = session.sets.filter { it.isCompleted }
            if (sets.isEmpty()) continue

            if (lastWeight == null) {
                lastWeight = sets.last().actualWeight
            }

            val allSetsCompleted = session.workoutExercise.targetSets > 0 &&
                sets.size >= session.workoutExercise.targetSets
            val allRepsMet = sets.all { set ->
                set.actualReps != null && set.actualReps >= set.targetReps
            }

            if (allSetsCompleted && allRepsMet) {
                consecutiveCompletions++
                if (consecutiveFailures > 0) break
            } else {
                consecutiveFailures++
                if (consecutiveCompletions > 0) break
            }
        }

        val suggestedWeight = lastWeight?.let { baseWeight ->
            when {
                consecutiveCompletions >= 1 -> roundToIncrement(baseWeight + increment, increment)
                consecutiveFailures >= 2 -> roundDownToIncrement(baseWeight * 0.9, increment)
                else -> baseWeight
            }
        }

        val hint = when {
            consecutiveCompletions >= 3 -> SuggestionHint.GOOD_STATE
            consecutiveFailures >= 3 -> SuggestionHint.REDUCE_10PC
            lastWeight == null -> SuggestionHint.FIRST_TIME
            else -> null
        }

        return WeightSuggestionResult(
            suggestedWeight = suggestedWeight,
            consecutiveCompletions = consecutiveCompletions,
            consecutiveFailures = consecutiveFailures,
            hint = hint,
        )
    }

    private fun roundToIncrement(value: Double, increment: Double): Double =
        Math.round(value / increment) * increment

    private fun roundDownToIncrement(value: Double, increment: Double): Double =
        floor(value / increment) * increment
}
