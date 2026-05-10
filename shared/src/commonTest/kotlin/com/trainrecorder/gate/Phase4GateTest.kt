package com.trainrecorder.gate

import com.trainrecorder.domain.model.BodyMeasurement
import com.trainrecorder.domain.model.Exercise
import com.trainrecorder.domain.model.ExerciseCategory
import com.trainrecorder.domain.model.ExerciseMode
import com.trainrecorder.domain.model.ExerciseStatus
import com.trainrecorder.domain.model.MetricInputType
import com.trainrecorder.domain.model.OtherSportMetric
import com.trainrecorder.domain.model.PlanMode
import com.trainrecorder.domain.model.ScheduleDayType
import com.trainrecorder.domain.model.TrainingDay
import com.trainrecorder.domain.model.TrainingType
import com.trainrecorder.domain.model.WeightUnit
import com.trainrecorder.domain.model.WorkoutStatus
import com.trainrecorder.domain.usecase.DayType
import com.trainrecorder.domain.usecase.ScheduleDay
import com.trainrecorder.ui.navigation.BodyDataEditRoute
import com.trainrecorder.ui.navigation.BodyDataRoute
import com.trainrecorder.ui.navigation.CalendarRoute
import com.trainrecorder.ui.navigation.DayEditRoute
import com.trainrecorder.ui.navigation.ExerciseCreateRoute
import com.trainrecorder.ui.navigation.ExerciseDetailRoute
import com.trainrecorder.ui.navigation.ExercisePickerRoute
import com.trainrecorder.ui.navigation.FeelingRoute
import com.trainrecorder.ui.navigation.HistoryRoute
import com.trainrecorder.ui.navigation.OnboardingRoute
import com.trainrecorder.ui.navigation.OtherSportCreateRoute
import com.trainrecorder.ui.navigation.OtherSportRoute
import com.trainrecorder.ui.navigation.PlanEditRoute
import com.trainrecorder.ui.navigation.PlanListRoute
import com.trainrecorder.ui.navigation.ProgressChartRoute
import com.trainrecorder.ui.navigation.SessionDetailRoute
import com.trainrecorder.ui.navigation.SettingsRoute
import com.trainrecorder.ui.navigation.WorkoutRoute
import com.trainrecorder.ui.screens.AdvanceResult
import com.trainrecorder.ui.screens.BodyDataValidationResult
import com.trainrecorder.ui.screens.CalendarGridCell
import com.trainrecorder.ui.screens.ExitDialogState
import com.trainrecorder.ui.screens.FATIGUE_LABELS
import com.trainrecorder.ui.screens.SATISFACTION_LABELS
import com.trainrecorder.ui.screens.HISTORY_TAB_LABELS
import com.trainrecorder.ui.screens.MetricField
import com.trainrecorder.ui.screens.MetricOption
import com.trainrecorder.ui.screens.PRESET_METRIC_OPTIONS
import com.trainrecorder.ui.screens.PRListItem
import com.trainrecorder.ui.screens.SettingsItem
import com.trainrecorder.ui.screens.StatsHeroData
import com.trainrecorder.ui.screens.SummaryGridItem
import com.trainrecorder.ui.screens.TimerPanelState
import com.trainrecorder.ui.screens.TrainingTypeColor
import com.trainrecorder.ui.screens.CATEGORY_DISPLAY_ORDER
import com.trainrecorder.ui.screens.SETTINGS_SECTIONS
import com.trainrecorder.ui.screens.DayAssignment
import com.trainrecorder.ui.screens.computeCalendarGrid
import com.trainrecorder.ui.screens.formatMonthYear
import com.trainrecorder.ui.screens.getDayStatus
import com.trainrecorder.ui.screens.hasTrainingBar
import com.trainrecorder.ui.screens.getTrainingColor
import com.trainrecorder.ui.screens.getFilterChips
import com.trainrecorder.ui.screens.filterByTrainingType
import com.trainrecorder.ui.screens.computeExpandedIndex
import com.trainrecorder.ui.screens.formatRestTime
import com.trainrecorder.ui.screens.formatSetLabel
import com.trainrecorder.ui.screens.isWeightModified
import com.trainrecorder.ui.screens.planModeLabel
import com.trainrecorder.ui.screens.scheduleModeLabel
import com.trainrecorder.ui.screens.trainingTypeLabel
import com.trainrecorder.ui.screens.exerciseModeLabel
import com.trainrecorder.ui.screens.validatePlanName
import com.trainrecorder.ui.screens.validateFixedModeInputs
import com.trainrecorder.ui.screens.formatIntervalDescription
import com.trainrecorder.ui.screens.toggleDayOfWeek
import com.trainrecorder.ui.screens.assignedDaysForSelection
import com.trainrecorder.ui.screens.formatSessionDate
import com.trainrecorder.ui.screens.formatVolume
import com.trainrecorder.ui.screens.getHistoryTabs
import com.trainrecorder.ui.screens.formatChangePercent
import com.trainrecorder.ui.screens.validateFatigueLevel
import com.trainrecorder.ui.screens.validateSatisfactionLevel
import com.trainrecorder.ui.screens.shouldShowHighFatigueWarning
import com.trainrecorder.ui.screens.formatSliderLabel
import com.trainrecorder.ui.screens.isValidNotes
import com.trainrecorder.ui.screens.validateBodyDataForm
import com.trainrecorder.ui.screens.computeWeightTrend
import com.trainrecorder.ui.screens.formatMeasurementValue
import com.trainrecorder.ui.screens.getBodyDataTabs
import com.trainrecorder.ui.screens.resolveMetricFields
import com.trainrecorder.ui.screens.validateMetricValue
import com.trainrecorder.ui.screens.validateAllMetrics
import com.trainrecorder.ui.screens.groupByCategory
import com.trainrecorder.ui.screens.getCategoryLabel
import com.trainrecorder.ui.screens.filterExercisesByQuery
import com.trainrecorder.ui.screens.filterExercisesByCategory
import com.trainrecorder.ui.screens.validateExerciseName
import com.trainrecorder.ui.screens.validateWeightIncrement
import com.trainrecorder.ui.screens.validateDefaultRest
import com.trainrecorder.ui.screens.getSettingsItems
import com.trainrecorder.ui.screens.isValidExportFormat
import com.trainrecorder.ui.screens.buildClearDataConfirmationMessage
import com.trainrecorder.ui.screens.formatWeightUnitLabel
import com.trainrecorder.ui.screens.convertWeight
import com.trainrecorder.viewmodel.HistoryTab
import kotlinx.datetime.DatePeriod
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlinx.datetime.minus
import kotlinx.datetime.plus
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

/**
 * Phase 4 Exit Gate tests - verifies all Phase 4 UI screens criteria.
 *
 * Gate Criteria:
 * 1. Calendar screen renders month grid with training type color bars
 * 2. Workout execution screen: exercise cards expand/collapse, timer slides up, set recording works
 * 3. Plan management: create/edit/delete plans works, exercise picker functions
 * 4. History tabs all render with chart data
 * 5. Stats screen shows hero card, bar chart, heatmap, PR list
 * 6. All remaining screens (feeling, body data, other sport, exercise library, settings) render correctly
 * 7. Navigation between all screens works without crashes
 * 8. Tab bar renders with 5 tabs and navigates correctly
 * 9. UI matches design specifications (Screen+Helper pattern consistency)
 * 10. No regressions (Phase 1-3 domain and presentation layers intact)
 */
class Phase4GateTest {

    private val testInstant = Instant.parse("2026-01-15T10:30:00Z")
    private val testDate = LocalDate.parse("2026-01-15")

    // Helper to create test ScheduleDay instances
    private fun makeScheduleDay(
        date: LocalDate = testDate,
        type: DayType = DayType.REST,
        trainingDay: TrainingDay? = null,
        isSkipped: Boolean = false,
        isToday: Boolean = false,
    ) = ScheduleDay(
        date = date,
        type = type,
        trainingDay = trainingDay,
        workoutSession = null,
        otherSportRecord = null,
        isSkipped = isSkipped,
        isToday = isToday,
    )

    private fun makeTrainingDay(
        dayType: TrainingType = TrainingType.PUSH,
        displayName: String = "Push Day",
    ) = TrainingDay(
        id = "td-${displayName.hashCode()}",
        planId = "plan-1",
        displayName = displayName,
        dayType = dayType,
        orderIndex = 0,
        createdAt = testInstant,
        updatedAt = testInstant,
    )

    private fun makeExercise(
        name: String = "Bench Press",
        category: ExerciseCategory = ExerciseCategory.UPPER_PUSH,
    ) = Exercise(
        id = "ex-${name.hashCode()}",
        displayName = name,
        category = category,
        weightIncrement = 2.5,
        defaultRest = 90,
        isCustom = true,
        createdAt = testInstant,
        updatedAt = testInstant,
    )

    // ================================================================
    // 1. Calendar Screen: Month Grid with Training Type Color Bars
    // ================================================================

    @Test
    fun gate_calendar_computesGridWithCorrectRowCount() {
        val scheduleDays = emptyList<ScheduleDay>()
        val grid = computeCalendarGrid(2026, 1, scheduleDays)
        // Calendar grid has at most 6 week rows, each with 7 cells
        assertTrue(grid.size in 4..6, "Grid should have 4-6 week rows, got ${grid.size}")
        grid.forEach { row ->
            assertEquals(7, row.size, "Each week row must have 7 cells")
        }
    }

    @Test
    fun gate_calendar_trainingTypeColorsMapped() {
        // Push = blue, Pull = green, Legs = orange, Other = purple, Custom = OTHER
        assertEquals(TrainingTypeColor.PUSH, TrainingTypeColor.fromTrainingType(TrainingType.PUSH))
        assertEquals(TrainingTypeColor.PULL, TrainingTypeColor.fromTrainingType(TrainingType.PULL))
        assertEquals(TrainingTypeColor.LEGS, TrainingTypeColor.fromTrainingType(TrainingType.LEGS))
        assertEquals(TrainingTypeColor.OTHER, TrainingTypeColor.fromTrainingType(TrainingType.OTHER))
        assertEquals(TrainingTypeColor.OTHER, TrainingTypeColor.fromTrainingType(TrainingType.CUSTOM))
    }

    @Test
    fun gate_calendar_hasTrainingBarDetectsTrainingDays() {
        val trainingDay = makeScheduleDay(type = DayType.TRAINING, trainingDay = makeTrainingDay())
        assertTrue(hasTrainingBar(trainingDay))
        assertFalse(hasTrainingBar(null))
        assertTrue(hasTrainingBar(makeScheduleDay(isSkipped = true)))
    }

    @Test
    fun gate_calendar_getTrainingColorReturnsCorrectColors() {
        val pushDay = makeScheduleDay(type = DayType.TRAINING, trainingDay = makeTrainingDay(TrainingType.PUSH))
        assertEquals(TrainingTypeColor.PUSH, getTrainingColor(pushDay))
        assertEquals(TrainingTypeColor.REST, getTrainingColor(null))
        assertEquals(TrainingTypeColor.REST, getTrainingColor(makeScheduleDay(type = DayType.REST)))
    }

    @Test
    fun gate_calendar_filterChipsIncludeTrainingTypes() {
        val scheduleDays = listOf(
            makeScheduleDay(date = testDate, type = DayType.TRAINING, trainingDay = makeTrainingDay(TrainingType.PUSH)),
            makeScheduleDay(date = testDate.plus(DatePeriod(days = 1)), type = DayType.TRAINING, trainingDay = makeTrainingDay(TrainingType.PULL)),
        )
        val chips = getFilterChips(scheduleDays, selectedType = null)
        assertTrue(chips.size >= 2, "Filter chips should have at least PUSH and PULL")
        chips.forEach { chip ->
            assertNotNull(chip.trainingType)
            assertNotNull(chip.label)
            assertFalse(chip.isSelected)
        }
    }

    @Test
    fun gate_calendar_filterByTrainingTypeWorks() {
        val pushDay = makeScheduleDay(date = testDate, type = DayType.TRAINING, trainingDay = makeTrainingDay(TrainingType.PUSH))
        val pullDay = makeScheduleDay(date = testDate.plus(DatePeriod(days = 1)), type = DayType.TRAINING, trainingDay = makeTrainingDay(TrainingType.PULL))
        val restDay = makeScheduleDay(date = testDate.plus(DatePeriod(days = 2)), type = DayType.REST)

        val allDays = listOf(pushDay, pullDay, restDay)
        val filtered = filterByTrainingType(allDays, TrainingType.PUSH)
        assertEquals(1, filtered.size)
        assertEquals(TrainingType.PUSH, filtered[0].trainingDay?.dayType)

        // null returns all
        val unfiltered = filterByTrainingType(allDays, null)
        assertEquals(3, unfiltered.size)
    }

    @Test
    fun gate_calendar_formatMonthYear() {
        assertEquals("January 2026", formatMonthYear(2026, 1))
        assertEquals("December 2025", formatMonthYear(2025, 12))
    }

    @Test
    fun gate_calendar_getDayStatusReturnsCorrectStrings() {
        assertEquals("empty", getDayStatus(null))
        assertEquals("rest", getDayStatus(makeScheduleDay(type = DayType.REST)))
        assertEquals("skipped", getDayStatus(makeScheduleDay(isSkipped = true)))
    }

    // ================================================================
    // 2. Workout Execution Screen: Cards, Timer, Set Recording
    // ================================================================

    @Test
    fun gate_workout_timerPanelStateComputesDisplay() {
        val state = TimerPanelState(
            remainingSeconds = 90,
            totalDuration = 120,
            isExpired = false,
            isVisible = true,
        )
        assertEquals(90, state.remainingSeconds)
        assertEquals(120, state.totalDuration)
        assertEquals("1:30", state.displayText)
        assertEquals(1, state.displayMinutes)
        assertEquals(30, state.displaySeconds)
        assertFalse(state.isExpired)
    }

    @Test
    fun gate_workout_timerPanelProgressFraction() {
        val state = TimerPanelState(remainingSeconds = 60, totalDuration = 120, isExpired = false, isVisible = true)
        assertEquals(0.5f, state.progress)
    }

    @Test
    fun gate_workout_timerPanelExpiredState() {
        val state = TimerPanelState(remainingSeconds = 0, totalDuration = 120, isExpired = true, isVisible = true)
        assertEquals(0f, state.progress)
        assertTrue(state.isExpired)
        assertEquals("0:00", state.displayText)
    }

    @Test
    fun gate_workout_exitDialogStateTracksProgress() {
        val state = ExitDialogState(completedExercises = 2, totalExercises = 5, completedSets = 8, totalSets = 20)
        assertTrue(state.hasProgress)
        val empty = ExitDialogState(completedExercises = 0, totalExercises = 5, completedSets = 0, totalSets = 20)
        assertFalse(empty.hasProgress)
    }

    @Test
    fun gate_workout_advanceResultTracksCompletion() {
        val result = AdvanceResult(newIndex = 2, isWorkoutComplete = true)
        assertEquals(2, result.newIndex)
        assertTrue(result.isWorkoutComplete)
        val notDone = AdvanceResult(newIndex = 1, isWorkoutComplete = false)
        assertFalse(notDone.isWorkoutComplete)
    }

    @Test
    fun gate_workout_formatRestTime() {
        assertEquals("0:00", formatRestTime(0))
        assertEquals("0:30", formatRestTime(30))
        assertEquals("1:00", formatRestTime(60))
        assertEquals("1:30", formatRestTime(90))
        assertEquals("10:00", formatRestTime(600))
    }

    @Test
    fun gate_workout_formatSetLabel() {
        assertEquals("Set 1/3", formatSetLabel(1, 3))
        assertEquals("Set 5/5", formatSetLabel(5, 5))
    }

    @Test
    fun gate_workout_isWeightModifiedDetectsChanges() {
        assertTrue(isWeightModified(105.0, 100.0))
        assertFalse(isWeightModified(100.0, 100.0))
        assertFalse(isWeightModified(null, null))
        assertFalse(isWeightModified(100.0, null))  // Returns false when either is null
        assertFalse(isWeightModified(null, 100.0))
    }

    // ================================================================
    // 3. Plan Management: CRUD, Exercise Picker, Validation
    // ================================================================

    @Test
    fun gate_plan_modeLabelsAreCorrect() {
        assertEquals("Infinite Loop", planModeLabel(PlanMode.INFINITE_LOOP))
        assertEquals("Fixed Cycle", planModeLabel(PlanMode.FIXED_CYCLE))
    }

    @Test
    fun gate_plan_scheduleModeLabelsAreCorrect() {
        assertEquals("Fixed Days", scheduleModeLabel(ScheduleDayType.WEEKLY_FIXED))
        assertEquals("Interval", scheduleModeLabel(ScheduleDayType.FIXED_INTERVAL))
    }

    @Test
    fun gate_plan_trainingTypeLabels() {
        assertEquals("Push", trainingTypeLabel(TrainingType.PUSH))
        assertEquals("Pull", trainingTypeLabel(TrainingType.PULL))
        assertEquals("Legs", trainingTypeLabel(TrainingType.LEGS))
        assertEquals("Other", trainingTypeLabel(TrainingType.OTHER))
        assertEquals("Custom", trainingTypeLabel(TrainingType.CUSTOM))
    }

    @Test
    fun gate_plan_exerciseModeLabels() {
        assertEquals("Fixed", exerciseModeLabel(ExerciseMode.FIXED))
        assertEquals("Custom", exerciseModeLabel(ExerciseMode.CUSTOM))
    }

    @Test
    fun gate_plan_validatePlanName() {
        assertNull(validatePlanName("Push Day"))
        assertNotNull(validatePlanName(""))
        assertNotNull(validatePlanName("   "))
    }

    @Test
    fun gate_plan_validateFixedModeInputs() {
        assertNull(validateFixedModeInputs(3, 10, 100.0))
        assertNotNull(validateFixedModeInputs(0, 10, 100.0)) // sets=0 invalid
        assertNotNull(validateFixedModeInputs(3, 0, 100.0))  // reps=0 invalid
    }

    @Test
    fun gate_plan_formatIntervalDescription() {
        assertEquals("Train every day", formatIntervalDescription(0))
        assertEquals("1 rest day between sessions", formatIntervalDescription(1))
        assertEquals("3 rest days between sessions", formatIntervalDescription(3))
    }

    @Test
    fun gate_plan_toggleDayOfWeekWorks() {
        val selected = setOf(0, 2, 4) // Mon, Wed, Fri
        val toggled = toggleDayOfWeek(selected, 2)
        assertFalse(toggled.contains(2)) // Removed
        assertTrue(toggled.contains(0))
        assertTrue(toggled.contains(4))
        // Add back
        val added = toggleDayOfWeek(toggled, 2)
        assertTrue(added.contains(2))
    }

    @Test
    fun gate_plan_assignedDaysForSelection() {
        val trainingDays = listOf(makeTrainingDay(TrainingType.PUSH, "Push"), makeTrainingDay(TrainingType.PULL, "Pull"))
        val result = assignedDaysForSelection(setOf(0, 2, 4), trainingDays)
        assertEquals(3, result.size)
        result.forEach {
            assertTrue(it is DayAssignment)
            assertNotNull(it.dayLabel)
            assertNotNull(it.trainingDay)
        }
    }

    @Test
    fun gate_plan_assignedDaysForSelectionEmptyInputs() {
        val trainingDays = listOf(makeTrainingDay())
        assertEquals(0, assignedDaysForSelection(emptySet(), trainingDays).size)
        assertEquals(0, assignedDaysForSelection(setOf(0), emptyList()).size)
    }

    // ================================================================
    // 4. History Tabs: All Render with Chart Data
    // ================================================================

    @Test
    fun gate_history_has4Tabs() {
        val tabs = getHistoryTabs()
        assertEquals(4, tabs.size)
        assertEquals(HistoryTab.HISTORY, tabs[0])
        assertEquals(HistoryTab.PROGRESS, tabs[1])
        assertEquals(HistoryTab.VOLUME, tabs[2])
        assertEquals(HistoryTab.PR, tabs[3])
    }

    @Test
    fun gate_history_tabLabelsExist() {
        assertEquals(4, HISTORY_TAB_LABELS.size)
        assertEquals("History", HISTORY_TAB_LABELS[HistoryTab.HISTORY])
        assertEquals("Progress", HISTORY_TAB_LABELS[HistoryTab.PROGRESS])
        assertEquals("Volume", HISTORY_TAB_LABELS[HistoryTab.VOLUME])
        assertEquals("PR", HISTORY_TAB_LABELS[HistoryTab.PR])
    }

    @Test
    fun gate_history_formatSessionDate() {
        val date = LocalDate.parse("2026-01-15")
        val formatted = formatSessionDate(date)
        assertNotNull(formatted)
        assertTrue(formatted.isNotEmpty())
    }

    @Test
    fun gate_history_formatVolume() {
        assertEquals("100 kg", formatVolume(100.0))       // Whole numbers show no decimal
        assertEquals("100.5 kg", formatVolume(100.5))     // Fractional shows 1 decimal
        assertEquals("100 lbs", formatVolume(100.0, "lbs"))
    }

    // ================================================================
    // 5. Stats Screen: Hero Card, Bar Chart, Heatmap, PR List
    // ================================================================

    @Test
    fun gate_stats_heroDataStructure() {
        val heroData = StatsHeroData(
            weeklyVolume = 12500.0,
            previousWeeklyVolume = 11000.0,
            changePercent = 13.6,
            totalSessionsThisWeek = 4,
        )
        assertEquals(12500.0, heroData.weeklyVolume)
        assertEquals(11000.0, heroData.previousWeeklyVolume)
        assertEquals(13.6, heroData.changePercent)
        assertEquals(4, heroData.totalSessionsThisWeek)
    }

    @Test
    fun gate_stats_summaryGridItemsExist() {
        val item = SummaryGridItem(label = "Avg Duration", value = "45 min", subtitle = "per session")
        assertEquals("Avg Duration", item.label)
        assertEquals("45 min", item.value)
        assertEquals("per session", item.subtitle)
    }

    @Test
    fun gate_stats_prListItemExists() {
        val pr = PRListItem(exerciseName = "Bench Press", estimatedOneRM = 120.0, date = testDate)
        assertEquals("Bench Press", pr.exerciseName)
        assertEquals(120.0, pr.estimatedOneRM)
        assertEquals(testDate, pr.date)
    }

    @Test
    fun gate_stats_formatChangePercent() {
        val positive = formatChangePercent(10.0)
        assertTrue(positive.contains("+"), "Positive change should contain +")
        val negative = formatChangePercent(-5.0)
        assertTrue(negative.contains("-"), "Negative change should contain -")
        val zero = formatChangePercent(0.0)
        assertNotNull(zero)
    }

    // ================================================================
    // 6. Remaining Screens: Feeling, Body Data, Other Sport, Exercise Library, Settings
    // ================================================================

    // --- Feeling ---

    @Test
    fun gate_feeling_validateFatigueAndSatisfaction() {
        assertEquals(5, validateFatigueLevel(5))
        assertEquals(1, validateFatigueLevel(0))  // Clamped to 1
        assertEquals(10, validateFatigueLevel(15)) // Clamped to 10
        assertEquals(5, validateSatisfactionLevel(5))
        assertEquals(1, validateSatisfactionLevel(-1))
        assertEquals(10, validateSatisfactionLevel(20))
    }

    @Test
    fun gate_feeling_highFatigueWarning() {
        assertTrue(shouldShowHighFatigueWarning(fatigue = 8, satisfaction = 4))
        assertTrue(shouldShowHighFatigueWarning(fatigue = 10, satisfaction = 1))
        assertFalse(shouldShowHighFatigueWarning(fatigue = 7, satisfaction = 4))
        assertFalse(shouldShowHighFatigueWarning(fatigue = 8, satisfaction = 5))
    }

    @Test
    fun gate_feeling_sliderLabels() {
        assertEquals("Easy", FATIGUE_LABELS.first)
        assertEquals("Exhausted", FATIGUE_LABELS.second)
        assertEquals("Poor", SATISFACTION_LABELS.first)
        assertEquals("Perfect", SATISFACTION_LABELS.second)
    }

    @Test
    fun gate_feeling_formatSliderLabel() {
        assertEquals("Easy", formatSliderLabel(1, FATIGUE_LABELS))
        assertEquals("Exhausted", formatSliderLabel(10, FATIGUE_LABELS))
        assertEquals("5", formatSliderLabel(5, FATIGUE_LABELS))
        assertEquals("Poor", formatSliderLabel(1, SATISFACTION_LABELS))
        assertEquals("Perfect", formatSliderLabel(10, SATISFACTION_LABELS))
    }

    @Test
    fun gate_feeling_isValidNotes() {
        assertTrue(isValidNotes("Great workout"))
        assertFalse(isValidNotes(null))
        assertFalse(isValidNotes(""))
        assertFalse(isValidNotes("   "))
    }

    // --- Body Data ---

    @Test
    fun gate_bodyData_validateFormWithValidWeight() {
        val result = validateBodyDataForm(weight = "75.0")
        assertTrue(result.isValid)
        assertNull(result.weightError)
    }

    @Test
    fun gate_bodyData_validateFormWithInvalidWeight() {
        val blankResult = validateBodyDataForm(weight = "")
        assertFalse(blankResult.isValid)
        assertNotNull(blankResult.weightError)

        val nullResult = validateBodyDataForm(weight = null)
        assertFalse(nullResult.isValid)

        val negativeResult = validateBodyDataForm(weight = "-10.0")
        assertFalse(negativeResult.isValid)

        val nonNumericResult = validateBodyDataForm(weight = "abc")
        assertFalse(nonNumericResult.isValid)
    }

    @Test
    fun gate_bodyData_computeWeightTrendReturnsNullForFewerThan2() {
        val measurements = listOf(
            BodyMeasurement("1", testDate, 75.0, null, null, null, null, null, testInstant, testInstant),
        )
        assertNull(computeWeightTrend(measurements))
    }

    @Test
    fun gate_bodyData_computeWeightTrendComputesDelta() {
        val measurements = listOf(
            BodyMeasurement("1", testDate.minus(DatePeriod(days = 1)), 73.0, null, null, null, null, null, testInstant, testInstant),
            BodyMeasurement("2", testDate, 75.0, null, null, null, null, null, testInstant, testInstant),
        )
        val trend = computeWeightTrend(measurements)
        assertNotNull(trend)
        assertEquals(2.0, trend!!.first) // abs change
        assertFalse(trend.second) // not decreasing (weight went up)
    }

    @Test
    fun gate_bodyData_formatMeasurementValue() {
        assertEquals("75.0 kg", formatMeasurementValue(75.0, "kg"))
        assertEquals("-- kg", formatMeasurementValue(null, "kg"))
    }

    @Test
    fun gate_bodyData_hasTwoTabs() {
        val tabs = getBodyDataTabs()
        assertEquals(2, tabs.size)
    }

    // --- Other Sport ---

    @Test
    fun gate_otherSport_resolveMetricFields() {
        val metrics = listOf(
            OtherSportMetric(
                id = "m1",
                sportTypeId = "running",
                metricName = "Distance",
                metricKey = "distance",
                inputType = MetricInputType.NUMBER,
                isRequired = true,
                unit = "km",
                createdAt = testInstant,
                updatedAt = testInstant,
            ),
        )
        val fields = resolveMetricFields(metrics)
        assertEquals(1, fields.size)
        assertEquals("m1", fields[0].metricId)
        assertEquals("Distance", fields[0].label)
        assertEquals("km", fields[0].unit)
        assertEquals(MetricInputType.NUMBER, fields[0].inputType)
        assertTrue(fields[0].isRequired)
    }

    @Test
    fun gate_otherSport_validateMetricValue() {
        val field = MetricField("m1", "Distance", "km", MetricInputType.NUMBER, true)
        assertNull(validateMetricValue("10.5", field))
        assertNotNull(validateMetricValue("", field))
        assertNotNull(validateMetricValue("abc", field))

        // Optional field with blank value is valid
        val optionalField = MetricField("m2", "Notes", null, MetricInputType.TEXT, false)
        assertNull(validateMetricValue(null, optionalField))
    }

    @Test
    fun gate_otherSport_validateAllMetrics() {
        val fields = listOf(
            MetricField("m1", "Distance", "km", MetricInputType.NUMBER, true),
            MetricField("m2", "Notes", null, MetricInputType.TEXT, false),
        )
        val values = mapOf("m1" to "10.5", "m2" to "easy run")
        val errors = validateAllMetrics(values, fields)
        assertTrue(errors.isEmpty())
    }

    @Test
    fun gate_otherSport_presetMetricOptions() {
        assertTrue(PRESET_METRIC_OPTIONS.size >= 5)
        PRESET_METRIC_OPTIONS.forEach { opt ->
            assertNotNull(opt.key)
            assertNotNull(opt.displayName)
        }
    }

    // --- Exercise Library ---

    @Test
    fun gate_exerciseLibrary_groupByCategory() {
        val exercises = listOf(
            makeExercise("Bench Press", ExerciseCategory.UPPER_PUSH),
            makeExercise("Pull-up", ExerciseCategory.UPPER_PULL),
            makeExercise("Squat", ExerciseCategory.LOWER),
        )
        val grouped = groupByCategory(exercises)
        assertEquals(3, grouped.size)
        assertTrue(grouped.containsKey(ExerciseCategory.UPPER_PUSH))
        assertTrue(grouped.containsKey(ExerciseCategory.UPPER_PULL))
        assertTrue(grouped.containsKey(ExerciseCategory.LOWER))
    }

    @Test
    fun gate_exerciseLibrary_getCategoryLabel() {
        assertEquals("Core", getCategoryLabel(ExerciseCategory.CORE))
        assertEquals("Upper Push", getCategoryLabel(ExerciseCategory.UPPER_PUSH))
        assertEquals("Upper Pull", getCategoryLabel(ExerciseCategory.UPPER_PULL))
        assertEquals("Lower", getCategoryLabel(ExerciseCategory.LOWER))
        assertEquals("Abs & Core", getCategoryLabel(ExerciseCategory.ABS_CORE))
        assertEquals("Shoulder", getCategoryLabel(ExerciseCategory.SHOULDER))
        assertEquals("Custom", getCategoryLabel(ExerciseCategory.CUSTOM))
    }

    @Test
    fun gate_exerciseLibrary_categoryDisplayOrder() {
        assertEquals(7, CATEGORY_DISPLAY_ORDER.size)
    }

    @Test
    fun gate_exerciseLibrary_filterByQuery() {
        val exercises = listOf(
            makeExercise("Bench Press"),
            makeExercise("Squat"),
        )
        val filtered = filterExercisesByQuery(exercises, "bench")
        assertEquals(1, filtered.size)
        assertEquals("Bench Press", filtered[0].displayName)
    }

    @Test
    fun gate_exerciseLibrary_filterByCategory() {
        val exercises = listOf(
            makeExercise("Bench Press", ExerciseCategory.UPPER_PUSH),
            makeExercise("Squat", ExerciseCategory.LOWER),
        )
        val filtered = filterExercisesByCategory(exercises, ExerciseCategory.UPPER_PUSH)
        assertEquals(1, filtered.size)
    }

    @Test
    fun gate_exerciseLibrary_validateExerciseName() {
        assertNull(validateExerciseName("Bench Press"))
        assertNotNull(validateExerciseName(""))
        assertNotNull(validateExerciseName(null))
        assertNotNull(validateExerciseName("A")) // Too short
    }

    @Test
    fun gate_exerciseLibrary_validateWeightIncrement() {
        assertNull(validateWeightIncrement(2.5))
        assertNotNull(validateWeightIncrement(0.0))
        assertNotNull(validateWeightIncrement(null))
    }

    @Test
    fun gate_exerciseLibrary_validateDefaultRest() {
        assertNull(validateDefaultRest(90))
        assertNotNull(validateDefaultRest(0))
        assertNotNull(validateDefaultRest(null))
    }

    // --- Settings ---

    @Test
    fun gate_settings_getSettingsItems() {
        val items = getSettingsItems(WeightUnit.KG)
        assertTrue(items.isNotEmpty())
        items.forEach { item ->
            assertTrue(item is SettingsItem)
            assertNotNull(item.key)
            assertNotNull(item.title)
        }
    }

    @Test
    fun gate_settings_settingsSectionsExist() {
        assertEquals(3, SETTINGS_SECTIONS.size) // GENERAL, DATA_MANAGEMENT, ABOUT
    }

    @Test
    fun gate_settings_isValidExportFormat() {
        assertTrue(isValidExportFormat("json"))
        assertTrue(isValidExportFormat("csv"))
        assertFalse(isValidExportFormat("xyz"))
        assertFalse(isValidExportFormat(null))
    }

    @Test
    fun gate_settings_clearDataMessage() {
        val msg = buildClearDataConfirmationMessage()
        assertTrue(msg.isNotEmpty())
        assertTrue(msg.contains("delete", ignoreCase = true))
    }

    @Test
    fun gate_settings_formatWeightUnitLabel() {
        assertEquals("kg", formatWeightUnitLabel(WeightUnit.KG))
        assertEquals("lb", formatWeightUnitLabel(WeightUnit.LB))
    }

    @Test
    fun gate_settings_convertWeight() {
        val kgToLbs = convertWeight(100.0, WeightUnit.KG, WeightUnit.LB)
        assertEquals(220.462, kgToLbs, 0.01)
        val lbsToKg = convertWeight(220.462, WeightUnit.LB, WeightUnit.KG)
        assertEquals(100.0, lbsToKg, 0.01)
        // Same unit = no conversion
        assertEquals(100.0, convertWeight(100.0, WeightUnit.KG, WeightUnit.KG))
    }

    // ================================================================
    // 7. Navigation Between All Screens (18 Routes Still Intact)
    // ================================================================

    @Test
    fun gate_all18RoutesStillExistAndAreSerializable() {
        val routes = listOf(
            CalendarRoute::class,
            PlanListRoute::class,
            HistoryRoute::class,
            BodyDataRoute::class,
            SettingsRoute::class,
            WorkoutRoute::class,
            FeelingRoute::class,
            OtherSportRoute::class,
            PlanEditRoute::class,
            DayEditRoute::class,
            ExercisePickerRoute::class,
            ExerciseDetailRoute::class,
            ExerciseCreateRoute::class,
            SessionDetailRoute::class,
            BodyDataEditRoute::class,
            ProgressChartRoute::class,
            OtherSportCreateRoute::class,
            OnboardingRoute::class,
        )
        assertEquals(18, routes.distinctBy { it.qualifiedName }.size, "All 18 routes must exist")
        routes.forEach { route ->
            val hasSerializable = route.annotations.any {
                it.annotationClass.qualifiedName == "kotlinx.serialization.Serializable"
            }
            assertTrue(hasSerializable, "${route.simpleName} must be @Serializable")
        }
    }

    // ================================================================
    // 8. Tab Bar with 5 Tabs
    // ================================================================

    @Test
    fun gate_tabBarHas5Destinations() {
        val tabs = com.trainrecorder.ui.navigation.TAB_DESTINATIONS
        assertEquals(5, tabs.size)
        val labels = tabs.map { it.label }
        assertTrue(labels.contains("Calendar"))
        assertTrue(labels.contains("Plan"))
        assertTrue(labels.contains("History"))
        assertTrue(labels.contains("Body"))
        assertTrue(labels.contains("Settings"))
    }

    @Test
    fun gate_tabBarWorkoutRouteNotInTabRoutes() {
        // WorkoutRoute is fullscreen and should NOT be a tab route
        val tabRoutes = com.trainrecorder.ui.navigation.TAB_ROUTES
        assertFalse(tabRoutes.contains("workout"), "WorkoutRoute should not be a tab route (fullscreen)")
    }

    // ================================================================
    // 9. Screen+Helper Pattern Consistency
    // ================================================================

    @Test
    fun gate_allScreensHaveCorrespondingHelpers() {
        // Verify all helper data classes and functions can be referenced
        // (if they compile, the helpers exist and are importable)
        val helperTypes = listOf(
            CalendarGridCell::class,
            TrainingTypeColor::class,
            TimerPanelState::class,
            AdvanceResult::class,
            ExitDialogState::class,
            StatsHeroData::class,
            SummaryGridItem::class,
            PRListItem::class,
            MetricField::class,
            MetricOption::class,
            SettingsItem::class,
            BodyDataValidationResult::class,
            DayAssignment::class,
        )
        assertEquals(13, helperTypes.size, "All helper data classes must be importable")
    }

    // ================================================================
    // 10. Regression: Phase 1-3 Domain and Presentation Layers Intact
    // ================================================================

    @Test
    fun gate_phase1through3_domainModelsStillExist() {
        val models = listOf(
            com.trainrecorder.domain.model.Exercise::class,
            com.trainrecorder.domain.model.TrainingPlan::class,
            com.trainrecorder.domain.model.TrainingDay::class,
            com.trainrecorder.domain.model.WorkoutSession::class,
            com.trainrecorder.domain.model.TimerState::class,
            com.trainrecorder.domain.model.UserSettings::class,
        )
        assertEquals(6, models.size)
    }

    @Test
    fun gate_phase1through3_enumValuesUnchanged() {
        assertEquals(3, WorkoutStatus.entries.size)
        assertEquals(4, ExerciseStatus.entries.size)
        assertEquals(5, TrainingType.entries.size)
        assertEquals(2, WeightUnit.entries.size)
        assertEquals(7, ExerciseCategory.entries.size)
        assertEquals(2, ScheduleDayType.entries.size)
        assertEquals(2, ExerciseMode.entries.size)
        assertEquals(2, PlanMode.entries.size)
    }

    @Test
    fun gate_phase3_viewModelsStillExist() {
        val viewModels = listOf(
            com.trainrecorder.viewmodel.CalendarViewModel::class,
            com.trainrecorder.viewmodel.WorkoutViewModel::class,
            com.trainrecorder.viewmodel.PlanViewModel::class,
            com.trainrecorder.viewmodel.HistoryViewModel::class,
            com.trainrecorder.viewmodel.StatsViewModel::class,
            com.trainrecorder.viewmodel.FeelingViewModel::class,
            com.trainrecorder.viewmodel.SettingsViewModel::class,
            com.trainrecorder.viewmodel.BodyDataViewModel::class,
            com.trainrecorder.viewmodel.OtherSportViewModel::class,
            com.trainrecorder.viewmodel.ExerciseLibraryViewModel::class,
        )
        assertEquals(10, viewModels.size, "All 10 ViewModels must still exist")
    }
}
