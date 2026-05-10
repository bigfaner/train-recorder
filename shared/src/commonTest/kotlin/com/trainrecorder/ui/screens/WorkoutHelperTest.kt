package com.trainrecorder.ui.screens

import com.trainrecorder.domain.model.ExerciseStatus
import com.trainrecorder.viewmodel.ExerciseSetUi
import com.trainrecorder.viewmodel.WorkoutExerciseUi
import com.trainrecorder.viewmodel.WorkoutProgress
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class WorkoutHelperTest {

    // --- computeExpandedIndex Tests ---

    @Test
    fun `computeExpandedIndex returns current exercise index`() {
        val exercises = makeExerciseList(count = 3)
        assertEquals(1, computeExpandedIndex(exercises, 1))
    }

    @Test
    fun `computeExpandedIndex clamps to last exercise`() {
        val exercises = makeExerciseList(count = 3)
        assertEquals(2, computeExpandedIndex(exercises, 5))
    }

    @Test
    fun `computeExpandedIndex clamps to 0 for empty list`() {
        assertEquals(0, computeExpandedIndex(emptyList(), 0))
    }

    @Test
    fun `computeExpandedIndex clamps negative index to 0`() {
        val exercises = makeExerciseList(count = 2)
        assertEquals(0, computeExpandedIndex(exercises, -1))
    }

    // --- findNextIncompleteSet Tests ---

    @Test
    fun `findNextIncompleteSet returns first incomplete set`() {
        val exercise = makeExerciseUi(
            sets = listOf(
                makeSetUi(setIndex = 0, isCompleted = true),
                makeSetUi(setIndex = 1, isCompleted = false),
                makeSetUi(setIndex = 2, isCompleted = false),
            ),
        )
        val result = findNextIncompleteSet(exercise)
        assertNotNull(result)
        assertEquals(1, result.setIndex)
    }

    @Test
    fun `findNextIncompleteSet returns null when all completed`() {
        val exercise = makeExerciseUi(
            sets = listOf(
                makeSetUi(setIndex = 0, isCompleted = true),
                makeSetUi(setIndex = 1, isCompleted = true),
            ),
        )
        assertNull(findNextIncompleteSet(exercise))
    }

    @Test
    fun `findNextIncompleteSet returns first set when none completed`() {
        val exercise = makeExerciseUi(
            sets = listOf(
                makeSetUi(setIndex = 0, isCompleted = false),
                makeSetUi(setIndex = 1, isCompleted = false),
            ),
        )
        val result = findNextIncompleteSet(exercise)
        assertNotNull(result)
        assertEquals(0, result.setIndex)
    }

    @Test
    fun `findNextIncompleteSet returns null for empty sets`() {
        val exercise = makeExerciseUi(sets = emptyList())
        assertNull(findNextIncompleteSet(exercise))
    }

    // --- advanceToNextExercise Tests ---

    @Test
    fun `advanceToNextExercise returns next pending exercise`() {
        val exercises = makeExerciseList(
            count = 3,
            statuses = listOf(ExerciseStatus.COMPLETED, ExerciseStatus.PENDING, ExerciseStatus.PENDING),
        )
        val result = advanceToNextExercise(exercises, 0)
        assertEquals(1, result.newIndex)
        assertFalse(result.isWorkoutComplete)
    }

    @Test
    fun `advanceToNextExercise skips completed and skipped exercises`() {
        val exercises = makeExerciseList(
            count = 4,
            statuses = listOf(
                ExerciseStatus.COMPLETED,
                ExerciseStatus.COMPLETED,
                ExerciseStatus.SKIPPED,
                ExerciseStatus.PENDING,
            ),
        )
        val result = advanceToNextExercise(exercises, 0)
        assertEquals(3, result.newIndex)
        assertFalse(result.isWorkoutComplete)
    }

    @Test
    fun `advanceToNextExercise marks workout complete when no remaining`() {
        val exercises = makeExerciseList(
            count = 2,
            statuses = listOf(ExerciseStatus.COMPLETED, ExerciseStatus.SKIPPED),
        )
        val result = advanceToNextExercise(exercises, 0)
        assertTrue(result.isWorkoutComplete)
    }

    @Test
    fun `advanceToNextExercise handles empty exercises`() {
        val result = advanceToNextExercise(emptyList(), 0)
        assertTrue(result.isWorkoutComplete)
    }

    @Test
    fun `advanceToNextExercise handles single exercise`() {
        val exercises = makeExerciseList(
            count = 1,
            statuses = listOf(ExerciseStatus.COMPLETED),
        )
        val result = advanceToNextExercise(exercises, 0)
        assertTrue(result.isWorkoutComplete)
    }

    @Test
    fun `advanceToNextExercise handles in-progress exercise`() {
        val exercises = makeExerciseList(
            count = 3,
            statuses = listOf(ExerciseStatus.COMPLETED, ExerciseStatus.IN_PROGRESS, ExerciseStatus.PENDING),
        )
        val result = advanceToNextExercise(exercises, 0)
        assertEquals(1, result.newIndex)
        assertFalse(result.isWorkoutComplete)
    }

    // --- buildExitDialogState Tests ---

    @Test
    fun `buildExitDialogState computes correct counts`() {
        val exercises = listOf(
            makeExerciseUi(
                status = ExerciseStatus.COMPLETED,
                sets = listOf(
                    makeSetUi(isCompleted = true),
                    makeSetUi(isCompleted = true),
                    makeSetUi(isCompleted = true),
                ),
                targetSets = 3,
            ),
            makeExerciseUi(
                status = ExerciseStatus.PENDING,
                sets = listOf(
                    makeSetUi(isCompleted = false),
                    makeSetUi(isCompleted = false),
                ),
                targetSets = 3,
            ),
        )
        val progress = WorkoutProgress(completedExercises = 1, totalExercises = 2)

        val state = buildExitDialogState(exercises, progress)
        assertEquals(1, state.completedExercises)
        assertEquals(2, state.totalExercises)
        assertEquals(3, state.completedSets)
        assertEquals(6, state.totalSets)
    }

    @Test
    fun `buildExitDialogState hasProgress is false when no sets done`() {
        val exercises = listOf(
            makeExerciseUi(
                sets = listOf(makeSetUi(isCompleted = false)),
                targetSets = 3,
            ),
        )
        val progress = WorkoutProgress(completedExercises = 0, totalExercises = 1)
        val state = buildExitDialogState(exercises, progress)
        assertFalse(state.hasProgress)
    }

    @Test
    fun `buildExitDialogState hasProgress is true when sets done`() {
        val exercises = listOf(
            makeExerciseUi(
                sets = listOf(makeSetUi(isCompleted = true)),
                targetSets = 3,
            ),
        )
        val progress = WorkoutProgress(completedExercises = 0, totalExercises = 1)
        val state = buildExitDialogState(exercises, progress)
        assertTrue(state.hasProgress)
    }

    // --- formatRestTime Tests ---

    @Test
    fun `formatRestTime formats 90 seconds`() {
        assertEquals("1:30", formatRestTime(90))
    }

    @Test
    fun `formatRestTime formats 0 seconds`() {
        assertEquals("0:00", formatRestTime(0))
    }

    @Test
    fun `formatRestTime formats 60 seconds`() {
        assertEquals("1:00", formatRestTime(60))
    }

    @Test
    fun `formatRestTime formats 45 seconds`() {
        assertEquals("0:45", formatRestTime(45))
    }

    @Test
    fun `formatRestTime formats 120 seconds`() {
        assertEquals("2:00", formatRestTime(120))
    }

    // --- formatSetLabel Tests ---

    @Test
    fun `formatSetLabel formats correctly`() {
        assertEquals("Set 1/3", formatSetLabel(1, 3))
        assertEquals("Set 2/5", formatSetLabel(2, 5))
    }

    // --- isWeightModified Tests ---

    @Test
    fun `isWeightModified returns false for same values`() {
        assertFalse(isWeightModified(100.0, 100.0))
    }

    @Test
    fun `isWeightModified returns true for different values`() {
        assertTrue(isWeightModified(105.0, 100.0))
    }

    @Test
    fun `isWeightModified returns false for null suggested`() {
        assertFalse(isWeightModified(100.0, null))
    }

    @Test
    fun `isWeightModified returns false for null current`() {
        assertFalse(isWeightModified(null, 100.0))
    }

    // --- computeNextSuggestedWeight Tests ---

    @Test
    fun `computeNextSuggestedWeight increments when reps target met`() {
        assertEquals(102.5, computeNextSuggestedWeight(100.0, 5, 5, 2.5))
    }

    @Test
    fun `computeNextSuggestedWeight increments when reps exceeded`() {
        assertEquals(102.5, computeNextSuggestedWeight(100.0, 5, 8, 2.5))
    }

    @Test
    fun `computeNextSuggestedWeight does not increment when reps below target`() {
        assertEquals(100.0, computeNextSuggestedWeight(100.0, 5, 3, 2.5))
    }

    // --- TimerPanelState Tests ---

    @Test
    fun `TimerPanelState progress calculates correctly`() {
        val state = TimerPanelState(remainingSeconds = 45, totalDuration = 90, isExpired = false, isVisible = true)
        assertEquals(0.5f, state.progress)
    }

    @Test
    fun `TimerPanelState displayText formats correctly`() {
        val state = TimerPanelState(remainingSeconds = 90, totalDuration = 90, isExpired = false, isVisible = true)
        assertEquals("1:30", state.displayText)
    }

    @Test
    fun `TimerPanelState displayText zero seconds`() {
        val state = TimerPanelState(remainingSeconds = 0, totalDuration = 90, isExpired = true, isVisible = true)
        assertEquals("0:00", state.displayText)
    }

    @Test
    fun `TimerPanelState handles zero total duration`() {
        val state = TimerPanelState(remainingSeconds = 0, totalDuration = 0, isExpired = false, isVisible = false)
        assertEquals(0f, state.progress)
    }

    // --- Helpers ---

    private fun makeExerciseUi(
        exerciseId: String = "ex1",
        status: ExerciseStatus = ExerciseStatus.PENDING,
        sets: List<ExerciseSetUi> = listOf(makeSetUi()),
        targetSets: Int = 3,
    ) = WorkoutExerciseUi(
        exerciseId = exerciseId,
        exerciseName = "Bench Press",
        exerciseStatus = status,
        suggestedWeight = 100.0,
        isCustomWeight = false,
        sets = sets,
        targetSets = targetSets,
        targetReps = 5,
        restSeconds = 90,
        weightIncrement = 2.5,
    )

    private fun makeSetUi(
        setIndex: Int = 0,
        isCompleted: Boolean = false,
        targetWeight: Double = 100.0,
    ) = ExerciseSetUi(
        setIndex = setIndex,
        targetWeight = targetWeight,
        actualWeight = if (isCompleted) 100.0 else null,
        actualReps = if (isCompleted) 5 else null,
        isCompleted = isCompleted,
    )

    private fun makeExerciseList(
        count: Int,
        statuses: List<ExerciseStatus> = List(count) { ExerciseStatus.PENDING },
    ): List<WorkoutExerciseUi> {
        return (0 until count).map { i ->
            makeExerciseUi(
                exerciseId = "ex$i",
                status = statuses.getOrElse(i) { ExerciseStatus.PENDING },
            )
        }
    }
}
