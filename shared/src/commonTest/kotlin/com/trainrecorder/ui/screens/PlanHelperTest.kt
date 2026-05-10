package com.trainrecorder.ui.screens

import com.trainrecorder.domain.model.ExerciseMode
import com.trainrecorder.domain.model.PlanMode
import com.trainrecorder.domain.model.ScheduleDayType
import com.trainrecorder.domain.model.TrainingDay
import com.trainrecorder.domain.model.TrainingDayExercise
import com.trainrecorder.domain.model.TrainingPlan
import com.trainrecorder.domain.model.TrainingType
import kotlinx.datetime.Clock
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class PlanHelperTest {

    // --- Plan Mode Label Tests ---

    @Test
    fun `planModeLabel returns correct labels`() {
        assertEquals("Infinite Loop", planModeLabel(PlanMode.INFINITE_LOOP))
        assertEquals("Fixed Cycle", planModeLabel(PlanMode.FIXED_CYCLE))
    }

    // --- Schedule Mode Label Tests ---

    @Test
    fun `scheduleModeLabel returns correct labels`() {
        assertEquals("Fixed Days", scheduleModeLabel(ScheduleDayType.WEEKLY_FIXED))
        assertEquals("Interval", scheduleModeLabel(ScheduleDayType.FIXED_INTERVAL))
    }

    // --- Training Type Label Tests ---

    @Test
    fun `trainingTypeLabel returns correct labels`() {
        assertEquals("Push", trainingTypeLabel(TrainingType.PUSH))
        assertEquals("Pull", trainingTypeLabel(TrainingType.PULL))
        assertEquals("Legs", trainingTypeLabel(TrainingType.LEGS))
        assertEquals("Other", trainingTypeLabel(TrainingType.OTHER))
        assertEquals("Custom", trainingTypeLabel(TrainingType.CUSTOM))
    }

    // --- Day of Week Label Tests ---

    @Test
    fun `dayOfWeekLabels has 7 entries`() {
        assertEquals(7, DAY_OF_WEEK_LABELS.size)
    }

    @Test
    fun `dayOfWeekLabels starts with Mon and ends with Sun`() {
        assertEquals("Mon", DAY_OF_WEEK_LABELS[0])
        assertEquals("Sun", DAY_OF_WEEK_LABELS[6])
    }

    // --- Exercise Mode Label Tests ---

    @Test
    fun `exerciseModeLabel returns correct labels`() {
        assertEquals("Fixed", exerciseModeLabel(ExerciseMode.FIXED))
        assertEquals("Custom", exerciseModeLabel(ExerciseMode.CUSTOM))
    }

    // --- Format Exercise Summary Tests ---

    @Test
    fun `formatExerciseSummary formats fixed mode exercise`() {
        val exercise = makeTrainingDayExercise(
            exerciseMode = ExerciseMode.FIXED,
            targetSets = 4,
            targetReps = 8,
        )
        assertEquals("4x8", formatExerciseSummary(exercise))
    }

    @Test
    fun `formatExerciseSummary formats custom mode exercise with total sets`() {
        val exercise = makeTrainingDayExercise(
            exerciseMode = ExerciseMode.CUSTOM,
            targetSets = 3,
            targetReps = 0,
        )
        assertEquals("3 sets (custom)", formatExerciseSummary(exercise))
    }

    // --- Day Summary Text Tests ---

    @Test
    fun `formatDaySummary joins exercise names with separator`() {
        val exercises = listOf(
            makeTrainingDayExercise(note = "Bench Press"),
            makeTrainingDayExercise(note = "Overhead Press"),
        )
        assertEquals("Bench Press | Overhead Press", formatDaySummary(exercises) { it.note ?: "" })
    }

    @Test
    fun `formatDaySummary returns empty for no exercises`() {
        val result = formatDaySummary(emptyList<TrainingDayExercise>()) { it.note ?: "" }
        assertEquals("", result)
    }

    // --- Plan Status Text Tests ---

    @Test
    fun `planStatusText returns Active for active plan`() {
        val plan = makePlan(isActive = true)
        assertEquals("Active", planStatusText(plan))
    }

    @Test
    fun `planStatusText returns Inactive for inactive plan`() {
        val plan = makePlan(isActive = false)
        assertEquals("Inactive", planStatusText(plan))
    }

    // --- Interval Description Tests ---

    @Test
    fun `formatIntervalDescription formats rest days correctly`() {
        assertEquals("1 rest day between sessions", formatIntervalDescription(1))
        assertEquals("2 rest days between sessions", formatIntervalDescription(2))
        assertEquals("3 rest days between sessions", formatIntervalDescription(3))
    }

    @Test
    fun `formatIntervalDescription handles zero interval`() {
        assertEquals("Train every day", formatIntervalDescription(0))
    }

    // --- Training Day Order Tests ---

    @Test
    fun `formatDayOrderText formats training day cycle`() {
        val days = listOf(
            makeTrainingDay(dayType = TrainingType.PUSH, displayName = "Push"),
            makeTrainingDay(dayType = TrainingType.PULL, displayName = "Pull"),
            makeTrainingDay(dayType = TrainingType.LEGS, displayName = "Legs"),
        )
        val result = formatDayOrderText(days)
        assertTrue(result.contains("Push"))
        assertTrue(result.contains("Pull"))
        assertTrue(result.contains("Legs"))
        assertTrue(result.contains("->"))
    }

    @Test
    fun `formatDayOrderText returns empty for no days`() {
        assertEquals("", formatDayOrderText(emptyList()))
    }

    // --- Fixed Mode Input Validation Tests ---

    @Test
    fun `validateFixedModeInputs returns null for valid inputs`() {
        assertNull(validateFixedModeInputs(4, 8, 60.0))
    }

    @Test
    fun `validateFixedModeInputs returns error for zero sets`() {
        assertEquals("Sets must be at least 1", validateFixedModeInputs(0, 8, 60.0))
    }

    @Test
    fun `validateFixedModeInputs returns error for negative reps`() {
        assertEquals("Reps must be at least 1", validateFixedModeInputs(4, 0, 60.0))
    }

    @Test
    fun `validateFixedModeInputs returns error for negative weight`() {
        assertEquals("Weight must be positive", validateFixedModeInputs(4, 8, -1.0))
    }

    // --- Plan Name Validation Tests ---

    @Test
    fun `validatePlanName returns null for valid name`() {
        assertNull(validatePlanName("Push/Pull/Legs Split"))
    }

    @Test
    fun `validatePlanName returns error for empty name`() {
        assertEquals("Plan name is required", validatePlanName(""))
    }

    @Test
    fun `validatePlanName returns error for blank name`() {
        assertEquals("Plan name is required", validatePlanName("   "))
    }

    @Test
    fun `validatePlanName returns error for too long name`() {
        val longName = "a".repeat(101)
        assertEquals("Plan name must be 100 characters or less", validatePlanName(longName))
    }

    @Test
    fun `validatePlanName accepts name at max length`() {
        val maxName = "a".repeat(100)
        assertNull(validatePlanName(maxName))
    }

    // --- Schedule Day Selection Tests ---

    @Test
    fun `toggleDayOfWeek adds day to selection`() {
        val selected = setOf(0, 2) // Mon, Wed
        val result = toggleDayOfWeek(selected, 4) // Add Fri
        assertEquals(setOf(0, 2, 4), result)
    }

    @Test
    fun `toggleDayOfWeek removes day from selection`() {
        val selected = setOf(0, 2, 4) // Mon, Wed, Fri
        val result = toggleDayOfWeek(selected, 2) // Remove Wed
        assertEquals(setOf(0, 4), result)
    }

    @Test
    fun `toggleDayOfWeek works on empty set`() {
        val result = toggleDayOfWeek(emptySet(), 0)
        assertEquals(setOf(0), result)
    }

    // --- Day Assignment Tests ---

    @Test
    fun `assignedDaysForSelection maps selected day indices to training days`() {
        val trainingDays = listOf(
            makeTrainingDay(dayType = TrainingType.PUSH, displayName = "Push", orderIndex = 0),
            makeTrainingDay(dayType = TrainingType.PULL, displayName = "Pull", orderIndex = 1),
            makeTrainingDay(dayType = TrainingType.LEGS, displayName = "Legs", orderIndex = 2),
        )
        // Selected days: Mon (0), Wed (2), Fri (4)
        val selected = setOf(0, 2, 4)
        val assignments = assignedDaysForSelection(selected, trainingDays)

        assertEquals(3, assignments.size)
        assertEquals("Mon", assignments[0].dayLabel)
        assertEquals("Push", assignments[0].trainingDay.displayName)
        assertEquals("Wed", assignments[1].dayLabel)
        assertEquals("Pull", assignments[1].trainingDay.displayName)
        assertEquals("Fri", assignments[2].dayLabel)
        assertEquals("Legs", assignments[2].trainingDay.displayName)
    }

    @Test
    fun `assignedDaysForSelection returns empty for no selected days`() {
        val trainingDays = listOf(makeTrainingDay())
        val assignments = assignedDaysForSelection(emptySet(), trainingDays)
        assertTrue(assignments.isEmpty())
    }

    @Test
    fun `assignedDaysForSelection handles more selected days than training days`() {
        val trainingDays = listOf(
            makeTrainingDay(dayType = TrainingType.PUSH, displayName = "Push", orderIndex = 0),
            makeTrainingDay(dayType = TrainingType.PULL, displayName = "Pull", orderIndex = 1),
        )
        // 5 selected days but only 2 training days -- should cycle
        val selected = setOf(0, 1, 2, 3, 4)
        val assignments = assignedDaysForSelection(selected, trainingDays)

        assertEquals(5, assignments.size)
        assertEquals("Push", assignments[0].trainingDay.displayName)
        assertEquals("Pull", assignments[1].trainingDay.displayName)
        assertEquals("Push", assignments[2].trainingDay.displayName) // cycles back
    }

    // --- Helpers ---

    private fun makePlan(
        id: String = "plan1",
        isActive: Boolean = true,
        displayName: String = "Test Plan",
        planMode: PlanMode = PlanMode.INFINITE_LOOP,
        scheduleMode: ScheduleDayType = ScheduleDayType.WEEKLY_FIXED,
        intervalDays: Int? = null,
    ) = TrainingPlan(
        id = id,
        displayName = displayName,
        planMode = planMode,
        cycleLength = null,
        scheduleMode = scheduleMode,
        intervalDays = intervalDays,
        isActive = isActive,
        createdAt = Clock.System.now(),
        updatedAt = Clock.System.now(),
    )

    private fun makeTrainingDay(
        id: String = "day1",
        planId: String = "plan1",
        dayType: TrainingType = TrainingType.PUSH,
        displayName: String = "Push Day",
        orderIndex: Int = 0,
    ) = TrainingDay(
        id = id,
        planId = planId,
        displayName = displayName,
        dayType = dayType,
        orderIndex = orderIndex,
        createdAt = Clock.System.now(),
        updatedAt = Clock.System.now(),
    )

    private fun makeTrainingDayExercise(
        id: String = "tde1",
        trainingDayId: String = "day1",
        exerciseId: String = "ex1",
        exerciseMode: ExerciseMode = ExerciseMode.FIXED,
        targetSets: Int = 4,
        targetReps: Int = 8,
        note: String? = null,
        restSeconds: Int = 90,
        weightIncrement: Double = 2.5,
        orderIndex: Int = 0,
    ) = TrainingDayExercise(
        id = id,
        trainingDayId = trainingDayId,
        exerciseId = exerciseId,
        orderIndex = orderIndex,
        exerciseMode = exerciseMode,
        targetSets = targetSets,
        targetReps = targetReps,
        startWeight = null,
        note = note,
        restSeconds = restSeconds,
        weightIncrement = weightIncrement,
        createdAt = Clock.System.now(),
        updatedAt = Clock.System.now(),
    )
}
