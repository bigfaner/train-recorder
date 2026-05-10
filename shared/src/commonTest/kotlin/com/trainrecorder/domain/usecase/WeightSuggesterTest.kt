package com.trainrecorder.domain.usecase

import com.trainrecorder.domain.model.ExerciseMode
import com.trainrecorder.domain.model.ExerciseSet
import com.trainrecorder.domain.model.ExerciseStatus
import com.trainrecorder.domain.model.SuggestionHint
import com.trainrecorder.domain.model.WorkoutExercise
import com.trainrecorder.domain.repository.WorkoutExerciseWithSets
import kotlinx.datetime.Instant
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class WeightSuggesterTest {

    private val suggester = WeightSuggester()
    private val baseTime = Instant.parse("2026-01-01T00:00:00Z")

    private fun createWorkoutExercise(
        id: String = "we-1",
        targetSets: Int = 3,
        targetReps: Int = 5,
    ) = WorkoutExercise(
        id = id,
        workoutSessionId = "ws-1",
        exerciseId = "ex-1",
        orderIndex = 0,
        note = null,
        suggestedWeight = 60.0,
        isCustomWeight = false,
        targetSets = targetSets,
        targetReps = targetReps,
        exerciseMode = ExerciseMode.FIXED,
        exerciseStatus = ExerciseStatus.COMPLETED,
        createdAt = baseTime,
        updatedAt = baseTime,
    )

    private fun createExerciseSet(
        setIndex: Int,
        actualWeight: Double,
        actualReps: Int?,
        isCompleted: Boolean = true,
        targetReps: Int = 5,
    ) = ExerciseSet(
        id = "set-$setIndex",
        workoutExerciseId = "we-1",
        setIndex = setIndex,
        targetWeight = actualWeight,
        actualWeight = actualWeight,
        targetReps = targetReps,
        actualReps = actualReps,
        isCompleted = isCompleted,
        restStartedAt = null,
        restDuration = null,
        createdAt = baseTime,
        updatedAt = baseTime,
    )

    @Test
    fun firstTimeTraining_returnsNullWeightAndFirstTimeHint() {
        val result = suggester.calculate("ex-1", 2.5, emptyList())

        assertNull(result.suggestedWeight)
        assertEquals(0, result.consecutiveCompletions)
        assertEquals(0, result.consecutiveFailures)
        assertEquals(SuggestionHint.FIRST_TIME, result.hint)
    }

    @Test
    fun allSetsCompleted_suggestsWeightIncrease() {
        val sessions = listOf(
            WorkoutExerciseWithSets(
                workoutExercise = createWorkoutExercise(),
                sets = listOf(
                    createExerciseSet(0, 60.0, 5),
                    createExerciseSet(1, 60.0, 5),
                    createExerciseSet(2, 60.0, 5),
                ),
            ),
        )

        val result = suggester.calculate("ex-1", 2.5, sessions)

        assertEquals(62.5, result.suggestedWeight)
        assertEquals(1, result.consecutiveCompletions)
    }

    @Test
    fun partialSetsCompleted_doesNotSuggestIncrease() {
        val sessions = listOf(
            WorkoutExerciseWithSets(
                workoutExercise = createWorkoutExercise(targetSets = 3),
                sets = listOf(
                    createExerciseSet(0, 60.0, 5),
                    createExerciseSet(1, 60.0, 4), // missed target reps
                ),
            ),
        )

        val result = suggester.calculate("ex-1", 2.5, sessions)

        // No increase because not all reps met
        assertEquals(60.0, result.suggestedWeight)
    }

    @Test
    fun consecutiveFailures_suggestsDeload() {
        val sessions = listOf(
            WorkoutExerciseWithSets(
                workoutExercise = createWorkoutExercise(targetSets = 3, targetReps = 5),
                sets = listOf(
                    createExerciseSet(0, 60.0, 3),
                    createExerciseSet(1, 60.0, 3),
                    createExerciseSet(2, 60.0, 3),
                ),
            ),
            WorkoutExerciseWithSets(
                workoutExercise = createWorkoutExercise(id = "we-2", targetSets = 3, targetReps = 5),
                sets = listOf(
                    createExerciseSet(0, 60.0, 2, targetReps = 5),
                    createExerciseSet(1, 60.0, 2, targetReps = 5),
                    createExerciseSet(2, 60.0, 2, targetReps = 5),
                ),
            ),
        )

        val result = suggester.calculate("ex-1", 2.5, sessions)

        // 60 * 0.9 = 54.0, rounded down to 2.5 increment = 52.5
        assertEquals(52.5, result.suggestedWeight)
        assertEquals(2, result.consecutiveFailures)
    }

    @Test
    fun threeConsecutiveCompletions_returnsGoodStateHint() {
        val sessions = (1..3).map { idx ->
            WorkoutExerciseWithSets(
                workoutExercise = createWorkoutExercise(id = "we-$idx"),
                sets = listOf(
                    createExerciseSet(0, 60.0, 5),
                    createExerciseSet(1, 60.0, 5),
                    createExerciseSet(2, 60.0, 5),
                ),
            )
        }

        val result = suggester.calculate("ex-1", 2.5, sessions)

        assertEquals(SuggestionHint.GOOD_STATE, result.hint)
        assertEquals(3, result.consecutiveCompletions)
    }

    @Test
    fun deloadRoundsDownToNearestIncrement() {
        // 87.5 * 0.9 = 78.75 -> round down to 77.5 (nearest 2.5 increment)
        val sessions = listOf(
            WorkoutExerciseWithSets(
                workoutExercise = createWorkoutExercise(id = "we-1", targetSets = 3, targetReps = 5),
                sets = listOf(
                    createExerciseSet(0, 87.5, 3, targetReps = 5),
                    createExerciseSet(1, 87.5, 3, targetReps = 5),
                    createExerciseSet(2, 87.5, 3, targetReps = 5),
                ),
            ),
            WorkoutExerciseWithSets(
                workoutExercise = createWorkoutExercise(id = "we-2", targetSets = 3, targetReps = 5),
                sets = listOf(
                    createExerciseSet(0, 87.5, 2, targetReps = 5),
                    createExerciseSet(1, 87.5, 2, targetReps = 5),
                ),
            ),
        )

        val result = suggester.calculate("ex-1", 2.5, sessions)

        // 87.5 * 0.9 = 78.75, floor(78.75 / 2.5) * 2.5 = 77.5
        assertEquals(77.5, result.suggestedWeight)
    }
}
