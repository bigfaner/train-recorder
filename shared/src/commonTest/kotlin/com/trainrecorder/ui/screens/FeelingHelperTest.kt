package com.trainrecorder.ui.screens

import com.trainrecorder.viewmodel.ExerciseFeelingUi
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class FeelingHelperTest {

    // --- Slider Validation Tests ---

    @Test
    fun `validateFatigueLevel clamps to 1 minimum`() {
        assertEquals(1, validateFatigueLevel(0))
        assertEquals(1, validateFatigueLevel(-5))
    }

    @Test
    fun `validateFatigueLevel clamps to 10 maximum`() {
        assertEquals(10, validateFatigueLevel(11))
        assertEquals(10, validateFatigueLevel(100))
    }

    @Test
    fun `validateFatigueLevel preserves valid values`() {
        assertEquals(1, validateFatigueLevel(1))
        assertEquals(5, validateFatigueLevel(5))
        assertEquals(10, validateFatigueLevel(10))
    }

    @Test
    fun `validateSatisfactionLevel clamps to 1 minimum`() {
        assertEquals(1, validateSatisfactionLevel(0))
    }

    @Test
    fun `validateSatisfactionLevel clamps to 10 maximum`() {
        assertEquals(10, validateSatisfactionLevel(15))
    }

    @Test
    fun `validateSatisfactionLevel preserves valid values`() {
        assertEquals(3, validateSatisfactionLevel(3))
        assertEquals(7, validateSatisfactionLevel(7))
    }

    // --- High Fatigue Warning Tests ---

    @Test
    fun `shouldShowHighFatigueWarning returns true when fatigue 8 and satisfaction 4`() {
        assertTrue(shouldShowHighFatigueWarning(8, 4))
    }

    @Test
    fun `shouldShowHighFatigueWarning returns true when fatigue 9 and satisfaction 3`() {
        assertTrue(shouldShowHighFatigueWarning(9, 3))
    }

    @Test
    fun `shouldShowHighFatigueWarning returns true when fatigue 10 and satisfaction 1`() {
        assertTrue(shouldShowHighFatigueWarning(10, 1))
    }

    @Test
    fun `shouldShowHighFatigueWarning returns false when fatigue 7 and satisfaction 4`() {
        assertFalse(shouldShowHighFatigueWarning(7, 4))
    }

    @Test
    fun `shouldShowHighFatigueWarning returns false when fatigue 8 and satisfaction 5`() {
        assertFalse(shouldShowHighFatigueWarning(8, 5))
    }

    @Test
    fun `shouldShowHighFatigueWarning returns false for moderate values`() {
        assertFalse(shouldShowHighFatigueWarning(5, 5))
    }

    @Test
    fun `shouldShowHighFatigueWarning returns false for low fatigue high satisfaction`() {
        assertFalse(shouldShowHighFatigueWarning(2, 9))
    }

    // --- Slider Label Tests ---

    @Test
    fun `formatSliderLabel returns first label for value 1`() {
        assertEquals("Easy", formatSliderLabel(1, FATIGUE_LABELS))
    }

    @Test
    fun `formatSliderLabel returns second label for value 10`() {
        assertEquals("Exhausted", formatSliderLabel(10, FATIGUE_LABELS))
    }

    @Test
    fun `formatSliderLabel returns numeric value for middle values`() {
        assertEquals("5", formatSliderLabel(5, FATIGUE_LABELS))
        assertEquals("7", formatSliderLabel(7, SATISFACTION_LABELS))
    }

    // --- Notes Validation Tests ---

    @Test
    fun `isValidNotes returns false for null`() {
        assertFalse(isValidNotes(null))
    }

    @Test
    fun `isValidNotes returns false for blank string`() {
        assertFalse(isValidNotes(""))
        assertFalse(isValidNotes("   "))
    }

    @Test
    fun `isValidNotes returns true for non-blank string`() {
        assertTrue(isValidNotes("Felt good"))
        assertTrue(isValidNotes(" a "))
    }

    // --- Exercise Notes Map Tests ---

    @Test
    fun `buildExerciseNotesMap filters out null and blank notes`() {
        val feelings = listOf(
            ExerciseFeelingUi("e1", "Squat", "Good form"),
            ExerciseFeelingUi("e2", "Bench", null),
            ExerciseFeelingUi("e3", "Row", ""),
            ExerciseFeelingUi("e4", "Press", "  "),
        )
        val map = buildExerciseNotesMap(feelings)
        assertEquals(1, map.size)
        assertEquals("Good form", map["e1"])
    }

    @Test
    fun `buildExerciseNotesMap returns empty map for empty list`() {
        val map = buildExerciseNotesMap(emptyList())
        assertTrue(map.isEmpty())
    }

    @Test
    fun `buildExerciseNotesMap includes all non-blank notes`() {
        val feelings = listOf(
            ExerciseFeelingUi("e1", "Squat", "Heavy"),
            ExerciseFeelingUi("e2", "Bench", "Light"),
        )
        val map = buildExerciseNotesMap(feelings)
        assertEquals(2, map.size)
    }
}
