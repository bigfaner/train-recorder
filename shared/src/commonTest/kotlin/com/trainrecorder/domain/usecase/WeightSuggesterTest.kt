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
import kotlin.test.assertTrue

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

    // ============== First time (no history) ==============

    @Test
    fun firstTimeTraining_returnsNullWeightAndFirstTimeHint() {
        val result = suggester.calculate("ex-1", 2.5, emptyList())

        assertNull(result.suggestedWeight)
        assertEquals(0, result.consecutiveCompletions)
        assertEquals(0, result.consecutiveFailures)
        assertEquals(SuggestionHint.FIRST_TIME, result.hint)
    }

    // ============== All sets completed -> increment ==============

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
    fun allSetsCompleted_withDifferentIncrement_incrementsCorrectly() {
        val sessions = listOf(
            WorkoutExerciseWithSets(
                workoutExercise = createWorkoutExercise(targetSets = 3, targetReps = 5),
                sets = listOf(
                    createExerciseSet(0, 100.0, 5),
                    createExerciseSet(1, 100.0, 5),
                    createExerciseSet(2, 100.0, 5),
                ),
            ),
        )

        val result = suggester.calculate("ex-1", 5.0, sessions)

        assertEquals(105.0, result.suggestedWeight)
    }

    @Test
    fun allSetsCompleted_repsExactlyAtTarget_countsAsCompleted() {
        val sessions = listOf(
            WorkoutExerciseWithSets(
                workoutExercise = createWorkoutExercise(targetSets = 3, targetReps = 5),
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
    fun allSetsCompleted_extraRepsStillCountsAsCompleted() {
        val sessions = listOf(
            WorkoutExerciseWithSets(
                workoutExercise = createWorkoutExercise(targetSets = 3, targetReps = 5),
                sets = listOf(
                    createExerciseSet(0, 60.0, 8),
                    createExerciseSet(1, 60.0, 7),
                    createExerciseSet(2, 60.0, 6),
                ),
            ),
        )

        val result = suggester.calculate("ex-1", 2.5, sessions)

        assertEquals(62.5, result.suggestedWeight)
        assertEquals(1, result.consecutiveCompletions)
    }

    // ============== Partial fail -> hold weight ==============

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
    fun partialFail_oneRepMissed_holdsWeight() {
        val sessions = listOf(
            WorkoutExerciseWithSets(
                workoutExercise = createWorkoutExercise(targetSets = 3, targetReps = 5),
                sets = listOf(
                    createExerciseSet(0, 60.0, 5),
                    createExerciseSet(1, 60.0, 5),
                    createExerciseSet(2, 60.0, 4), // missed by 1
                ),
            ),
        )

        val result = suggester.calculate("ex-1", 2.5, sessions)

        assertEquals(60.0, result.suggestedWeight)
        assertEquals(1, result.consecutiveFailures)
    }

    @Test
    fun partialFail_fewerSetsThanTarget_holdsWeight() {
        val sessions = listOf(
            WorkoutExerciseWithSets(
                workoutExercise = createWorkoutExercise(targetSets = 5, targetReps = 5),
                sets = listOf(
                    createExerciseSet(0, 60.0, 5),
                    createExerciseSet(1, 60.0, 5),
                    createExerciseSet(2, 60.0, 5),
                    // Only 3 of 5 sets completed
                ),
            ),
        )

        val result = suggester.calculate("ex-1", 2.5, sessions)

        assertEquals(60.0, result.suggestedWeight)
    }

    // ============== 2 consecutive fails -> deload 10% ==============

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

    @Test
    fun deloadRoundsDownToNearestIncrement_oddValue() {
        // 100 * 0.9 = 90.0 -> round down to nearest 2.5 = 90.0
        val sessions = listOf(
            WorkoutExerciseWithSets(
                workoutExercise = createWorkoutExercise(id = "we-1", targetSets = 3, targetReps = 5),
                sets = listOf(
                    createExerciseSet(0, 100.0, 3, targetReps = 5),
                    createExerciseSet(1, 100.0, 3, targetReps = 5),
                    createExerciseSet(2, 100.0, 3, targetReps = 5),
                ),
            ),
            WorkoutExerciseWithSets(
                workoutExercise = createWorkoutExercise(id = "we-2", targetSets = 3, targetReps = 5),
                sets = listOf(
                    createExerciseSet(0, 100.0, 2, targetReps = 5),
                    createExerciseSet(1, 100.0, 2, targetReps = 5),
                    createExerciseSet(2, 100.0, 2, targetReps = 5),
                ),
            ),
        )

        val result = suggester.calculate("ex-1", 2.5, sessions)

        // 100 * 0.9 = 90.0, floor(90.0 / 2.5) * 2.5 = 90.0
        assertEquals(90.0, result.suggestedWeight)
    }

    @Test
    fun deloadRoundsDown_nonEvenIncrement() {
        // 65 * 0.9 = 58.5 -> round down to nearest 1.25 = 58.75 -> floor(58.5/1.25)*1.25 = 58.75
        // Actually floor(58.5 / 1.25) = floor(46.8) = 46, 46 * 1.25 = 57.5
        val sessions = listOf(
            WorkoutExerciseWithSets(
                workoutExercise = createWorkoutExercise(id = "we-1", targetSets = 3, targetReps = 5),
                sets = listOf(
                    createExerciseSet(0, 65.0, 3, targetReps = 5),
                    createExerciseSet(1, 65.0, 3, targetReps = 5),
                    createExerciseSet(2, 65.0, 3, targetReps = 5),
                ),
            ),
            WorkoutExerciseWithSets(
                workoutExercise = createWorkoutExercise(id = "we-2", targetSets = 3, targetReps = 5),
                sets = listOf(
                    createExerciseSet(0, 65.0, 2, targetReps = 5),
                    createExerciseSet(1, 65.0, 2, targetReps = 5),
                ),
            ),
        )

        val result = suggester.calculate("ex-1", 1.25, sessions)

        // 65 * 0.9 = 58.5, floor(58.5 / 1.25) * 1.25 = floor(46.8) * 1.25 = 46 * 1.25 = 57.5
        assertEquals(57.5, result.suggestedWeight)
    }

    // ============== 3 consecutive passes -> CONSIDER_MORE hint ==============

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
    fun threeConsecutiveCompletions_stillSuggestsNormalIncrement() {
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

        // Still increments normally (62.5), hint is just a suggestion
        assertEquals(62.5, result.suggestedWeight)
        assertEquals(SuggestionHint.GOOD_STATE, result.hint)
    }

    @Test
    fun twoConsecutiveCompletions_noGoodStateHint() {
        val sessions = (1..2).map { idx ->
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

        // 2 completions is not enough for GOOD_STATE hint
        assertNull(result.hint)
        assertEquals(2, result.consecutiveCompletions)
    }

    // ============== Mixed scenarios ==============

    @Test
    fun sessionWithNoCompletedSets_isSkipped() {
        val sessions = listOf(
            WorkoutExerciseWithSets(
                workoutExercise = createWorkoutExercise(targetSets = 3, targetReps = 5),
                sets = listOf(
                    createExerciseSet(0, 60.0, null, isCompleted = false),
                    createExerciseSet(1, 60.0, null, isCompleted = false),
                    createExerciseSet(2, 60.0, null, isCompleted = false),
                ),
            ),
        )

        val result = suggester.calculate("ex-1", 2.5, sessions)

        // No completed sets means this session is effectively skipped
        assertNull(result.suggestedWeight)
    }

    @Test
    fun sessionWithPartialSets_usesLastCompletedSetWeight() {
        val sessions = listOf(
            WorkoutExerciseWithSets(
                workoutExercise = createWorkoutExercise(targetSets = 3, targetReps = 5),
                sets = listOf(
                    createExerciseSet(0, 60.0, 5),
                    createExerciseSet(1, 60.0, 3), // partial fail
                ),
            ),
        )

        val result = suggester.calculate("ex-1", 2.5, sessions)

        // Hold at 60.0
        assertEquals(60.0, result.suggestedWeight)
    }

    @Test
    fun singleSetCompleted_countsAsPartialFail() {
        val sessions = listOf(
            WorkoutExerciseWithSets(
                workoutExercise = createWorkoutExercise(targetSets = 3, targetReps = 5),
                sets = listOf(
                    createExerciseSet(0, 60.0, 5),
                    // Only 1 set out of 3 target
                ),
            ),
        )

        val result = suggester.calculate("ex-1", 2.5, sessions)

        // Not all target sets completed
        assertEquals(60.0, result.suggestedWeight)
    }
}
