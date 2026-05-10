package com.trainrecorder.ui.screens

import com.trainrecorder.domain.model.Exercise
import com.trainrecorder.domain.model.ExerciseCategory
import kotlinx.datetime.Clock
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class ExerciseLibraryHelperTest {

    // --- Group By Category Tests ---

    @Test
    fun `groupByCategory groups exercises correctly`() {
        val exercises = listOf(
            makeExercise("Squat", ExerciseCategory.LOWER),
            makeExercise("Bench Press", ExerciseCategory.UPPER_PUSH),
            makeExercise("Deadlift", ExerciseCategory.CORE),
            makeExercise("Overhead Press", ExerciseCategory.UPPER_PUSH),
        )
        val grouped = groupByCategory(exercises)
        assertEquals(3, grouped.size)
        assertEquals(2, grouped[ExerciseCategory.UPPER_PUSH]!!.size)
        assertEquals(1, grouped[ExerciseCategory.LOWER]!!.size)
        assertEquals(1, grouped[ExerciseCategory.CORE]!!.size)
    }

    @Test
    fun `groupByCategory returns empty map for empty list`() {
        val grouped = groupByCategory(emptyList())
        assertTrue(grouped.isEmpty())
    }

    // --- Category Label Tests ---

    @Test
    fun `getCategoryLabel returns correct labels`() {
        assertEquals("Core", getCategoryLabel(ExerciseCategory.CORE))
        assertEquals("Upper Push", getCategoryLabel(ExerciseCategory.UPPER_PUSH))
        assertEquals("Upper Pull", getCategoryLabel(ExerciseCategory.UPPER_PULL))
        assertEquals("Lower", getCategoryLabel(ExerciseCategory.LOWER))
        assertEquals("Abs & Core", getCategoryLabel(ExerciseCategory.ABS_CORE))
        assertEquals("Shoulder", getCategoryLabel(ExerciseCategory.SHOULDER))
        assertEquals("Custom", getCategoryLabel(ExerciseCategory.CUSTOM))
    }

    // --- Category Display Order Tests ---

    @Test
    fun `CATEGORY_DISPLAY_ORDER has 7 categories`() {
        assertEquals(7, CATEGORY_DISPLAY_ORDER.size)
    }

    @Test
    fun `CATEGORY_DISPLAY_ORDER starts with CORE`() {
        assertEquals(ExerciseCategory.CORE, CATEGORY_DISPLAY_ORDER.first())
    }

    @Test
    fun `CATEGORY_DISPLAY_ORDER ends with CUSTOM`() {
        assertEquals(ExerciseCategory.CUSTOM, CATEGORY_DISPLAY_ORDER.last())
    }

    // --- Filter By Query Tests ---

    @Test
    fun `filterExercisesByQuery returns all for blank query`() {
        val exercises = listOf(
            makeExercise("Squat"),
            makeExercise("Bench Press"),
        )
        val result = filterExercisesByQuery(exercises, "")
        assertEquals(2, result.size)
    }

    @Test
    fun `filterExercisesByQuery filters by name case-insensitively`() {
        val exercises = listOf(
            makeExercise("Squat"),
            makeExercise("Bench Press"),
            makeExercise("Front Squat"),
        )
        val result = filterExercisesByQuery(exercises, "squat")
        assertEquals(2, result.size)
    }

    @Test
    fun `filterExercisesByQuery returns empty when no match`() {
        val exercises = listOf(
            makeExercise("Squat"),
            makeExercise("Bench Press"),
        )
        val result = filterExercisesByQuery(exercises, "yoga")
        assertTrue(result.isEmpty())
    }

    @Test
    fun `filterExercisesByQuery partial match works`() {
        val exercises = listOf(
            makeExercise("Bench Press"),
            makeExercise("Incline Bench Press"),
            makeExercise("Squat"),
        )
        val result = filterExercisesByQuery(exercises, "bench")
        assertEquals(2, result.size)
    }

    // --- Filter By Category Tests ---

    @Test
    fun `filterExercisesByCategory returns all for null category`() {
        val exercises = listOf(
            makeExercise("Squat", ExerciseCategory.LOWER),
            makeExercise("Bench Press", ExerciseCategory.UPPER_PUSH),
        )
        val result = filterExercisesByCategory(exercises, null)
        assertEquals(2, result.size)
    }

    @Test
    fun `filterExercisesByCategory filters to matching category`() {
        val exercises = listOf(
            makeExercise("Squat", ExerciseCategory.LOWER),
            makeExercise("Bench Press", ExerciseCategory.UPPER_PUSH),
            makeExercise("Leg Press", ExerciseCategory.LOWER),
        )
        val result = filterExercisesByCategory(exercises, ExerciseCategory.LOWER)
        assertEquals(2, result.size)
    }

    // --- Exercise Validation Tests ---

    @Test
    fun `validateExerciseName returns error for null`() {
        assertEquals("Exercise name is required", validateExerciseName(null))
    }

    @Test
    fun `validateExerciseName returns error for blank`() {
        assertEquals("Exercise name is required", validateExerciseName(""))
        assertEquals("Exercise name is required", validateExerciseName("   "))
    }

    @Test
    fun `validateExerciseName returns error for single character`() {
        assertEquals("Name must be at least 2 characters", validateExerciseName("A"))
    }

    @Test
    fun `validateExerciseName passes for valid name`() {
        assertNull(validateExerciseName("Squat"))
        assertNull(validateExerciseName("Bench Press"))
    }

    @Test
    fun `validateWeightIncrement returns error for null`() {
        assertEquals("Weight increment is required", validateWeightIncrement(null))
    }

    @Test
    fun `validateWeightIncrement returns error for zero or negative`() {
        assertEquals("Weight increment must be positive", validateWeightIncrement(0.0))
        assertEquals("Weight increment must be positive", validateWeightIncrement(-1.0))
    }

    @Test
    fun `validateWeightIncrement passes for positive value`() {
        assertNull(validateWeightIncrement(2.5))
    }

    @Test
    fun `validateDefaultRest returns error for null`() {
        assertEquals("Rest time is required", validateDefaultRest(null))
    }

    @Test
    fun `validateDefaultRest returns error for zero or negative`() {
        assertEquals("Rest time must be positive", validateDefaultRest(0))
        assertEquals("Rest time must be positive", validateDefaultRest(-30))
    }

    @Test
    fun `validateDefaultRest passes for positive value`() {
        assertNull(validateDefaultRest(90))
    }

    // --- Exercise Detail Formatting Tests ---

    @Test
    fun `formatExerciseDetail formats whole number increment`() {
        val exercise = makeExercise("Squat", weightIncrement = 5.0, defaultRest = 180)
        assertEquals("+5kg  3m rest", formatExerciseDetail(exercise))
    }

    @Test
    fun `formatExerciseDetail formats decimal increment`() {
        val exercise = makeExercise("Bench Press", weightIncrement = 2.5, defaultRest = 90)
        assertEquals("+2.5kg  1m rest", formatExerciseDetail(exercise))
    }

    @Test
    fun `formatExerciseDetail formats sub-minute rest`() {
        val exercise = makeExercise("Exercise", weightIncrement = 1.0, defaultRest = 45)
        assertEquals("+1kg  45s rest", formatExerciseDetail(exercise))
    }

    // --- Helper ---

    private fun makeExercise(
        name: String,
        category: ExerciseCategory = ExerciseCategory.CORE,
        weightIncrement: Double = 2.5,
        defaultRest: Int = 90,
    ): Exercise = Exercise(
        id = "",
        displayName = name,
        category = category,
        weightIncrement = weightIncrement,
        defaultRest = defaultRest,
        isCustom = false,
        createdAt = Clock.System.now(),
        updatedAt = Clock.System.now(),
    )
}
