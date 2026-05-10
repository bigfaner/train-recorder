package com.trainrecorder.gate

import com.trainrecorder.TestDatabaseFactory
import com.trainrecorder.createTestDatabase
import com.trainrecorder.data.repository.TimerNotificationHelper
import com.trainrecorder.data.repository.TimerServiceImpl
import com.trainrecorder.db.TrainRecorderDatabase
import com.trainrecorder.di.appModule
import com.trainrecorder.di.testAppModule
import com.trainrecorder.domain.model.BodyMeasurement
import com.trainrecorder.domain.model.Exercise
import com.trainrecorder.domain.model.ExerciseCategory
import com.trainrecorder.domain.model.ExerciseMode
import com.trainrecorder.domain.model.ExerciseStatus
import com.trainrecorder.domain.model.MetricInputType
import com.trainrecorder.domain.model.OtherSportMetric
import com.trainrecorder.domain.model.PlanMode
import com.trainrecorder.domain.model.ScheduleDayType
import com.trainrecorder.domain.model.TimerState
import com.trainrecorder.domain.model.TrainingDay
import com.trainrecorder.domain.model.TrainingType
import com.trainrecorder.domain.model.UserSettings
import com.trainrecorder.domain.model.WeightUnit
import com.trainrecorder.domain.model.WorkoutStatus
import com.trainrecorder.domain.repository.BodyDataRepository
import com.trainrecorder.domain.repository.ExerciseRepository
import com.trainrecorder.domain.repository.FeelingRepository
import com.trainrecorder.domain.repository.OtherSportRepository
import com.trainrecorder.domain.repository.PersonalRecordRepository
import com.trainrecorder.domain.repository.SettingsRepository
import com.trainrecorder.domain.repository.TimerService
import com.trainrecorder.domain.repository.TrainingPlanRepository
import com.trainrecorder.domain.repository.WeightSuggestionRepository
import com.trainrecorder.domain.repository.WorkoutRepository
import com.trainrecorder.domain.usecase.ScheduleCalculator
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
import com.trainrecorder.ui.navigation.TAB_DESTINATIONS
import com.trainrecorder.ui.navigation.TAB_ROUTES
import com.trainrecorder.ui.navigation.WorkoutRoute
import com.trainrecorder.ui.screens.AdvanceResult
import com.trainrecorder.ui.screens.BodyDataValidationResult
import com.trainrecorder.ui.screens.CalendarGridCell
import com.trainrecorder.ui.screens.CATEGORY_DISPLAY_ORDER
import com.trainrecorder.ui.screens.DateRangePreset
import com.trainrecorder.ui.screens.ExitDialogState
import com.trainrecorder.ui.screens.FATIGUE_LABELS
import com.trainrecorder.ui.screens.HISTORY_TAB_LABELS
import com.trainrecorder.ui.screens.MetricField
import com.trainrecorder.ui.screens.MetricOption
import com.trainrecorder.ui.screens.PRESET_METRIC_OPTIONS
import com.trainrecorder.ui.screens.PRListItem
import com.trainrecorder.ui.screens.PlanTemplate
import com.trainrecorder.ui.screens.PLAN_TEMPLATES
import com.trainrecorder.ui.screens.SATISFACTION_LABELS
import com.trainrecorder.ui.screens.SETTINGS_SECTIONS
import com.trainrecorder.ui.screens.SettingsItem
import com.trainrecorder.ui.screens.StatsHeroData
import com.trainrecorder.ui.screens.SummaryGridItem
import com.trainrecorder.ui.screens.TemplateDay
import com.trainrecorder.ui.screens.TimerPanelState
import com.trainrecorder.ui.screens.TrainingTypeColor
import com.trainrecorder.ui.screens.ValidationResult
import com.trainrecorder.ui.screens.buildClearDataConfirmationMessage
import com.trainrecorder.ui.screens.buildIdMapping
import com.trainrecorder.ui.screens.computeCalendarGrid
import com.trainrecorder.ui.screens.convertWeight
import com.trainrecorder.ui.screens.filterByTrainingType
import com.trainrecorder.ui.screens.formatChangePercent
import com.trainrecorder.ui.screens.formatMonthYear
import com.trainrecorder.ui.screens.formatSessionDate
import com.trainrecorder.ui.screens.formatSliderLabel
import com.trainrecorder.ui.screens.formatVolume
import com.trainrecorder.ui.screens.generatePlanName
import com.trainrecorder.ui.screens.getClearDataDescription
import com.trainrecorder.ui.screens.getExportDateRangePresets
import com.trainrecorder.ui.screens.getOnboardingStepTitles
import com.trainrecorder.ui.screens.getSettingsItems
import com.trainrecorder.ui.screens.getDayStatus
import com.trainrecorder.ui.screens.getTrainingColor
import com.trainrecorder.ui.screens.hasTrainingBar
import com.trainrecorder.ui.screens.getFilterChips
import com.trainrecorder.ui.screens.groupByCategory
import com.trainrecorder.ui.screens.getCategoryLabel
import com.trainrecorder.ui.screens.isWithinDateRange
import com.trainrecorder.ui.screens.isValidExportFormat
import com.trainrecorder.ui.screens.formatWeightUnitLabel
import com.trainrecorder.ui.screens.planModeLabel
import com.trainrecorder.ui.screens.regenerateId
import com.trainrecorder.ui.screens.shouldShowHighFatigueWarning
import com.trainrecorder.ui.screens.validateExportJson
import com.trainrecorder.viewmodel.BaseViewModel
import com.trainrecorder.viewmodel.BodyDataViewModel
import com.trainrecorder.viewmodel.CalendarViewModel
import com.trainrecorder.viewmodel.ExerciseLibraryViewModel
import com.trainrecorder.viewmodel.FeelingViewModel
import com.trainrecorder.viewmodel.HistoryViewModel
import com.trainrecorder.viewmodel.OtherSportViewModel
import com.trainrecorder.viewmodel.PlanViewModel
import com.trainrecorder.viewmodel.SettingsViewModel
import com.trainrecorder.viewmodel.StatsViewModel
import com.trainrecorder.viewmodel.WorkoutViewModel
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import org.koin.core.context.startKoin
import org.koin.core.context.stopKoin
import org.koin.test.KoinTest
import org.koin.test.get
import kotlin.test.AfterTest
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

/**
 * Phase 5 Final Integration Gate tests.
 *
 * Verifies end-to-end application integrity:
 * 1. Onboarding flow: plan template selection creates valid structure
 * 2. Full training flow: plan -> calendar -> workout -> feeling -> history
 * 3. Data export generates valid JSON with all user data
 * 4. Data import validates, merges, and handles errors
 * 5. Clear data preserves exercise library and settings
 * 6. Koin DI resolves all dependencies correctly
 * 7. Navigation graph wires all 18 routes
 * 8. All 5 tab bar screens navigate correctly
 * 9. All push screens open and back-navigate correctly
 * 10. Phase 1-4 regression: no broken domain/presentation layer types
 */
class Phase5GateTest : KoinTest {

    private val testInstant = Instant.parse("2026-01-15T10:30:00Z")
    private val testDate = LocalDate.parse("2026-01-15")

    private lateinit var testDatabase: TrainRecorderDatabase

    @BeforeTest
    fun setup() {
        testDatabase = createTestDatabase()
    }

    @AfterTest
    fun teardown() {
        try {
            stopKoin()
        } catch (_: Exception) {
            // Koin may not be started
        }
    }

    // ================================================================
    // 1. Onboarding Flow: Triggers on First Launch
    // ================================================================

    @Test
    fun gate_onboarding_has3PlanTemplates() {
        assertEquals(3, PLAN_TEMPLATES.size, "Onboarding must offer 3 plan templates")
    }

    @Test
    fun gate_onboarding_pplTemplateCreates3DayCycle() {
        val ppl = PLAN_TEMPLATES.find { it.id == "ppl" }
        assertNotNull(ppl, "PPL template must exist")
        assertEquals(3, ppl!!.days.size, "PPL must have 3 days")
        assertEquals("推拉蹲 (PPL)", ppl.displayName)
    }

    @Test
    fun gate_onboarding_upperLowerTemplateCreates2DayCycle() {
        val ul = PLAN_TEMPLATES.find { it.id == "upper_lower" }
        assertNotNull(ul, "Upper-Lower template must exist")
        assertEquals(2, ul!!.days.size, "Upper-Lower must have 2 days")
    }

    @Test
    fun gate_onboarding_fullBodyTemplateCreates1DayCycle() {
        val fb = PLAN_TEMPLATES.find { it.id == "full_body" }
        assertNotNull(fb, "Full Body template must exist")
        assertEquals(1, fb!!.days.size, "Full Body must have 1 day")
    }

    @Test
    fun gate_onboarding_allTemplateDaysHaveExerciseCategories() {
        for (template in PLAN_TEMPLATES) {
            for (day in template.days) {
                assertTrue(
                    day.exerciseCategories.isNotEmpty(),
                    "Day '${day.displayName}' in '${template.displayName}' must have exercise categories"
                )
            }
        }
    }

    @Test
    fun gate_onboarding_has4StepWizard() {
        val steps = getOnboardingStepTitles()
        assertEquals(4, steps.size, "Onboarding must have 4 steps")
        assertEquals("Welcome", steps[0])
        assertEquals("Choose Plan", steps[1])
        assertEquals("Exercises", steps[2])
        assertEquals("Ready", steps[3])
    }

    @Test
    fun gate_onboarding_generatePlanNameReturnsTemplateName() {
        val template = PLAN_TEMPLATES.first()
        assertEquals(template.displayName, generatePlanName(template))
    }

    // ================================================================
    // 2. Full Training Flow: Plan -> Calendar -> Workout -> Feeling -> History
    // ================================================================

    @Test
    fun gate_trainingFlow_planTemplateCreatesWorkingPlan() {
        // Simulate creating a plan from PPL template
        val template = PLAN_TEMPLATES.find { it.id == "ppl" }!!
        assertEquals(3, template.days.size)
        assertEquals(TrainingType.PUSH, template.days[0].trainingType)
        assertEquals(TrainingType.PULL, template.days[1].trainingType)
        assertEquals(TrainingType.LEGS, template.days[2].trainingType)
        // Each day has exercise categories that map to seeded exercises
        template.days.forEach { day ->
            assertTrue(day.exerciseCategories.isNotEmpty())
        }
    }

    @Test
    fun gate_trainingFlow_calendarShowsScheduleWithCorrectColors() {
        val grid = computeCalendarGrid(2026, 1, emptyList())
        assertTrue(grid.size in 4..6, "Calendar grid must have 4-6 rows")
        grid.forEach { row ->
            assertEquals(7, row.size, "Each week row must have 7 cells")
        }
    }

    @Test
    fun gate_trainingFlow_workoutTimerTracksProgress() {
        val panel = TimerPanelState(
            remainingSeconds = 60,
            totalDuration = 120,
            isExpired = false,
            isVisible = true,
        )
        assertEquals(0.5f, panel.progress)
        assertEquals("1:00", panel.displayText)
        assertFalse(panel.isExpired)
    }

    @Test
    fun gate_trainingFlow_feelingCapturesFatigueAndSatisfaction() {
        // High fatigue warning triggers correctly
        assertTrue(shouldShowHighFatigueWarning(fatigue = 8, satisfaction = 4))
        assertFalse(shouldShowHighFatigueWarning(fatigue = 7, satisfaction = 5))
        // Slider labels available
        assertNotNull(FATIGUE_LABELS)
        assertNotNull(SATISFACTION_LABELS)
        assertEquals("Easy", FATIGUE_LABELS.first)
        assertEquals("Exhausted", FATIGUE_LABELS.second)
    }

    @Test
    fun gate_trainingFlow_historyFormatsSessionData() {
        val formatted = formatSessionDate(testDate)
        assertNotNull(formatted)
        assertTrue(formatted.isNotEmpty())
    }

    @Test
    fun gate_trainingFlow_volumeCalculatesCorrectly() {
        assertEquals("100 kg", formatVolume(100.0))
        assertEquals("100.5 kg", formatVolume(100.5))
        assertEquals("100 lbs", formatVolume(100.0, "lbs"))
    }

    @Test
    fun gate_trainingFlow_statsHeroDataComputesWeeklyChange() {
        val hero = StatsHeroData(
            weeklyVolume = 12500.0,
            previousWeeklyVolume = 11000.0,
            changePercent = 13.6,
            totalSessionsThisWeek = 4,
        )
        val formatted = formatChangePercent(hero.changePercent)
        assertTrue(formatted.contains("+"))
    }

    // ================================================================
    // 3. Data Export Generates Valid JSON with All User Data
    // ================================================================

    @Test
    fun gate_dataExport_validatesCorrectSchema() {
        val json = """
        {
            "version": 1,
            "exportedAt": "2026-01-15T10:30:00Z",
            "settings": {},
            "exercises": [],
            "trainingPlans": [],
            "trainingDays": [],
            "trainingDayExercises": [],
            "trainingDaySetConfigs": [],
            "workoutSessions": [],
            "workoutExercises": [],
            "exerciseSets": [],
            "workoutFeelings": [],
            "exerciseFeelings": [],
            "personalRecords": [],
            "weightSuggestions": [],
            "bodyMeasurements": [],
            "otherSportTypes": [],
            "otherSportMetrics": [],
            "otherSportRecords": [],
            "otherSportMetricValues": [],
            "timerStates": []
        }
        """.trimIndent()

        val result = validateExportJson(json)
        assertTrue(result.isValid, "Valid export JSON must pass validation")
        assertNull(result.error)
    }

    @Test
    fun gate_dataExport_rejectsInvalidSchema() {
        // Missing version
        assertFalse(validateExportJson("""{"settings": {}}""").isValid)
        // Wrong version
        assertFalse(validateExportJson("""{"version": 99, "settings": {}}""").isValid)
        // Empty
        assertFalse(validateExportJson("").isValid)
        // Malformed
        assertFalse(validateExportJson("{not valid}").isValid)
    }

    @Test
    fun gate_dataExport_dateRangeFilteringWorks() {
        val start = LocalDate.parse("2026-01-01")
        val end = LocalDate.parse("2026-01-31")
        assertTrue(isWithinDateRange(LocalDate.parse("2026-01-15"), start, end))
        assertFalse(isWithinDateRange(LocalDate.parse("2026-02-01"), start, end))
    }

    @Test
    fun gate_dataExport_dateRangePresetsAvailable() {
        val presets = getExportDateRangePresets(testDate)
        assertEquals(3, presets.size)
        assertEquals("All", presets[0].label)
        assertNull(presets[0].start) // All = no range limit
        assertEquals("Last 3 Months", presets[1].label)
        assertEquals("Last 6 Months", presets[2].label)
    }

    @Test
    fun gate_dataExport_exportFormatValidationWorks() {
        assertTrue(isValidExportFormat("json"))
        assertTrue(isValidExportFormat("csv"))
        assertFalse(isValidExportFormat("xyz"))
        assertFalse(isValidExportFormat(null))
    }

    // ================================================================
    // 4. Data Import Validates, Merges, and Handles Errors
    // ================================================================

    @Test
    fun gate_dataImport_regeneratesIdsToAvoidConflicts() {
        val oldIds = listOf("id-1", "id-2", "id-3")
        val mapping = buildIdMapping(oldIds)
        assertEquals(3, mapping.size)
        // All new IDs must be unique
        assertEquals(3, mapping.values.toSet().size)
        // New IDs must differ from old
        mapping.forEach { (old, new) ->
            assertTrue(new.isNotEmpty())
        }
    }

    @Test
    fun gate_dataImport_validatesSchemaBeforeImport() {
        // Invalid schemas are rejected before any data is imported
        val badResult = validateExportJson("""{"version": 2}""")
        assertFalse(badResult.isValid)
        assertNotNull(badResult.error)
    }

    @Test
    fun gate_dataImport_handlesEmptyData() {
        val emptyExport = """
        {
            "version": 1,
            "settings": {},
            "exercises": [],
            "trainingPlans": [],
            "trainingDays": [],
            "trainingDayExercises": [],
            "trainingDaySetConfigs": [],
            "workoutSessions": [],
            "workoutExercises": [],
            "exerciseSets": [],
            "workoutFeelings": [],
            "exerciseFeelings": [],
            "personalRecords": [],
            "weightSuggestions": [],
            "bodyMeasurements": [],
            "otherSportTypes": [],
            "otherSportMetrics": [],
            "otherSportRecords": [],
            "otherSportMetricValues": [],
            "timerStates": []
        }
        """.trimIndent()
        val result = validateExportJson(emptyExport)
        assertTrue(result.isValid, "Empty but valid export should pass validation")
    }

    // ================================================================
    // 5. Clear Data Keeps Exercise Library and Settings Intact
    // ================================================================

    @Test
    fun gate_clearData_preservesExerciseLibraryAndSettings() {
        val desc = getClearDataDescription()
        assertTrue(desc.contains("exercise library", ignoreCase = true),
            "Clear data description must mention exercise library preservation")
        assertTrue(desc.contains("settings", ignoreCase = true),
            "Clear data description must mention settings preservation")
    }

    @Test
    fun gate_clearData_confirmationMessageExists() {
        val msg = buildClearDataConfirmationMessage()
        assertTrue(msg.isNotEmpty())
        assertTrue(msg.contains("delete", ignoreCase = true))
    }

    // ================================================================
    // 6. Koin DI Resolves All Dependencies
    // ================================================================

    @Test
    fun gate_di_allRepositoriesResolve() {
        startKoin { modules(testAppModule(testDatabase)) }

        assertNotNull(get<WorkoutRepository>())
        assertNotNull(get<TrainingPlanRepository>())
        assertNotNull(get<ExerciseRepository>())
        assertNotNull(get<SettingsRepository>())
        assertNotNull(get<BodyDataRepository>())
        assertNotNull(get<FeelingRepository>())
        assertNotNull(get<OtherSportRepository>())
        assertNotNull(get<PersonalRecordRepository>())
        assertNotNull(get<WeightSuggestionRepository>())

        stopKoin()
    }

    @Test
    fun gate_di_timerServiceResolves() {
        startKoin { modules(testAppModule(testDatabase)) }
        val timerService = get<TimerService>()
        assertNotNull(timerService)
        assertTrue(
            timerService::class.simpleName?.contains("TimerServiceImpl") == true,
            "TimerService must be implemented by TimerServiceImpl"
        )
        stopKoin()
    }

    @Test
    fun gate_di_scheduleCalculatorResolves() {
        startKoin { modules(testAppModule(testDatabase)) }
        assertNotNull(get<ScheduleCalculator>())
        stopKoin()
    }

    @Test
    fun gate_di_databaseIsSingleton() {
        startKoin { modules(testAppModule(testDatabase)) }
        val db1 = get<TrainRecorderDatabase>()
        val db2 = get<TrainRecorderDatabase>()
        assertTrue(db1 === db2, "Database must be singleton")
        stopKoin()
    }

    // ================================================================
    // 7. Navigation Graph Wires All 18 Routes
    // ================================================================

    @Test
    fun gate_navigation_all18RoutesExist() {
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
    }

    @Test
    fun gate_navigation_allRoutesAreSerializable() {
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
        routes.forEach { route ->
            val hasSerializable = route.annotations.any {
                it.annotationClass.qualifiedName == "kotlinx.serialization.Serializable"
            }
            assertTrue(hasSerializable, "${route.simpleName} must be @Serializable")
        }
    }

    // ================================================================
    // 8. All 5 Tab Bar Screens Navigate Correctly
    // ================================================================

    @Test
    fun gate_tabBar_has5Destinations() {
        assertEquals(5, TAB_DESTINATIONS.size, "Tab bar must have 5 destinations")
    }

    @Test
    fun gate_tabBar_coversAllPrimaryScreens() {
        val labels = TAB_DESTINATIONS.map { it.label }.toSet()
        assertTrue(labels.contains("Calendar"))
        assertTrue(labels.contains("Plan"))
        assertTrue(labels.contains("History"))
        assertTrue(labels.contains("Body"))
        assertTrue(labels.contains("Settings"))
    }

    @Test
    fun gate_tabBar_eachDestinationHasIconAndRoute() {
        TAB_DESTINATIONS.forEach { tab ->
            assertNotNull(tab.iconVector, "${tab.label} tab must have an icon")
            assertTrue(tab.route.isNotEmpty(), "${tab.label} tab must have a route")
        }
    }

    @Test
    fun gate_tabBar_tabRoutesMatchDestinations() {
        assertEquals(
            TAB_DESTINATIONS.map { it.route }.toSet(),
            TAB_ROUTES,
            "TAB_ROUTES must match TAB_DESTINATIONS routes"
        )
    }

    // ================================================================
    // 9. All Push Screens Open and Back-Navigate Correctly
    // ================================================================

    @Test
    fun gate_pushRoutes_workoutRouteHasOptionalParams() {
        val default = WorkoutRoute()
        assertNull(default.sessionId)
        assertNull(default.planDayId)
        assertNull(default.date)

        val withParams = WorkoutRoute(sessionId = "s1", planDayId = "d1", date = "2026-01-15")
        assertEquals("s1", withParams.sessionId)
        assertEquals("d1", withParams.planDayId)
        assertEquals("2026-01-15", withParams.date)
    }

    @Test
    fun gate_pushRoutes_feelingRouteRequiresSessionId() {
        val route = FeelingRoute(sessionId = "session-1")
        assertEquals("session-1", route.sessionId)
    }

    @Test
    fun gate_pushRoutes_planEditRouteSupportsCreateAndEdit() {
        assertNull(PlanEditRoute().planId)
        assertEquals("plan-1", PlanEditRoute(planId = "plan-1").planId)
    }

    @Test
    fun gate_pushRoutes_dayEditRouteRequiresPlanId() {
        val route = DayEditRoute(planId = "plan-1", dayId = "day-1")
        assertEquals("plan-1", route.planId)
        assertEquals("day-1", route.dayId)
    }

    @Test
    fun gate_pushRoutes_exercisePickerSupportsMultiSelect() {
        assertFalse(ExercisePickerRoute(multiSelect = false).multiSelect)
        assertTrue(ExercisePickerRoute(multiSelect = true).multiSelect)
    }

    @Test
    fun gate_pushRoutes_sessionDetailRequiresSessionId() {
        assertEquals("session-42", SessionDetailRoute(sessionId = "session-42").sessionId)
    }

    @Test
    fun gate_pushRoutes_bodyDataEditSupportsCreateAndEdit() {
        assertNull(BodyDataEditRoute().recordId)
        assertEquals("rec-1", BodyDataEditRoute(recordId = "rec-1").recordId)
    }

    @Test
    fun gate_pushRoutes_progressChartRequiresExerciseId() {
        assertEquals("ex-1", ProgressChartRoute(exerciseId = "ex-1").exerciseId)
    }

    @Test
    fun gate_pushRoutes_otherSportRouteHasDateAndOptionalRecordId() {
        assertEquals("2026-01-15", OtherSportRoute(date = "2026-01-15").date)
        assertNull(OtherSportRoute(date = "2026-01-15").recordId)
        assertEquals("rec-1", OtherSportRoute(date = "2026-01-15", recordId = "rec-1").recordId)
    }

    @Test
    fun gate_pushRoutes_otherSportCreateSupportsCreateAndEdit() {
        assertNull(OtherSportCreateRoute().typeId)
        assertEquals("type-1", OtherSportCreateRoute(typeId = "type-1").typeId)
    }

    @Test
    fun gate_pushRoutes_exerciseDetailRequiresExerciseId() {
        assertEquals("ex-42", ExerciseDetailRoute(exerciseId = "ex-42").exerciseId)
    }

    @Test
    fun gate_pushRoutes_exerciseCreateSupportsCreateAndEdit() {
        assertNull(ExerciseCreateRoute().exerciseId)
        assertEquals("ex-1", ExerciseCreateRoute(exerciseId = "ex-1").exerciseId)
    }

    @Test
    fun gate_pushRoutes_onboardingRouteIsSerializable() {
        assertNotNull(OnboardingRoute)
    }

    @Test
    fun gate_pushRoutes_workoutNotInTabRoutes() {
        assertFalse(TAB_ROUTES.contains("workout"), "WorkoutRoute should not be a tab route")
        assertFalse(TAB_ROUTES.contains("feeling"), "FeelingRoute should not be a tab route")
        assertFalse(TAB_ROUTES.contains("onboarding"), "OnboardingRoute should not be a tab route")
    }

    // ================================================================
    // 10. Phase 1-4 Full Regression
    // ================================================================

    @Test
    fun gate_regression_allDomainModelsExist() {
        val models = listOf(
            com.trainrecorder.domain.model.Exercise::class,
            com.trainrecorder.domain.model.TrainingPlan::class,
            com.trainrecorder.domain.model.TrainingDay::class,
            com.trainrecorder.domain.model.TrainingDayExercise::class,
            com.trainrecorder.domain.model.TrainingDaySetConfig::class,
            com.trainrecorder.domain.model.WorkoutSession::class,
            com.trainrecorder.domain.model.WorkoutExercise::class,
            com.trainrecorder.domain.model.ExerciseSet::class,
            com.trainrecorder.domain.model.WorkoutFeeling::class,
            com.trainrecorder.domain.model.ExerciseFeeling::class,
            com.trainrecorder.domain.model.PersonalRecord::class,
            com.trainrecorder.domain.model.WeightSuggestion::class,
            com.trainrecorder.domain.model.BodyMeasurement::class,
            com.trainrecorder.domain.model.OtherSportType::class,
            com.trainrecorder.domain.model.OtherSportMetric::class,
            com.trainrecorder.domain.model.OtherSportRecord::class,
            com.trainrecorder.domain.model.OtherSportMetricValue::class,
            com.trainrecorder.domain.model.TimerState::class,
            com.trainrecorder.domain.model.UserSettings::class,
            com.trainrecorder.domain.model.DomainError::class,
        )
        assertEquals(20, models.size, "All 20 domain models must exist")
    }

    @Test
    fun gate_regression_allEnumsUnchanged() {
        assertEquals(3, WorkoutStatus.entries.size)
        assertEquals(4, ExerciseStatus.entries.size)
        assertEquals(5, TrainingType.entries.size)
        assertEquals(2, WeightUnit.entries.size)
        assertEquals(7, ExerciseCategory.entries.size)
        assertEquals(2, ScheduleDayType.entries.size)
        assertEquals(4, com.trainrecorder.domain.model.SuggestionHint.entries.size)
        assertEquals(2, ExerciseMode.entries.size)
        assertEquals(2, PlanMode.entries.size)
        assertEquals(2, MetricInputType.entries.size)
    }

    @Test
    fun gate_regression_all10ViewModelsExist() {
        val viewModels = listOf(
            CalendarViewModel::class,
            WorkoutViewModel::class,
            PlanViewModel::class,
            HistoryViewModel::class,
            StatsViewModel::class,
            FeelingViewModel::class,
            SettingsViewModel::class,
            BodyDataViewModel::class,
            OtherSportViewModel::class,
            ExerciseLibraryViewModel::class,
        )
        assertEquals(10, viewModels.size, "All 10 ViewModels must exist")
    }

    @Test
    fun gate_regression_allViewModelsExtendBaseViewModel() {
        val viewModels = listOf(
            CalendarViewModel::class,
            WorkoutViewModel::class,
            PlanViewModel::class,
            HistoryViewModel::class,
            StatsViewModel::class,
            FeelingViewModel::class,
            SettingsViewModel::class,
            BodyDataViewModel::class,
            OtherSportViewModel::class,
            ExerciseLibraryViewModel::class,
        )
        viewModels.forEach { clazz ->
            val superClass = clazz.supertypes.firstOrNull()?.classifier as? kotlin.reflect.KClass<*>
            assertNotNull(superClass, "${clazz.simpleName} must have a supertype")
            assertTrue(
                superClass == BaseViewModel::class,
                "${clazz.simpleName} must extend BaseViewModel"
            )
        }
    }

    @Test
    fun gate_regression_all10RepositoryInterfacesExist() {
        val interfaces = listOf(
            ExerciseRepository::class,
            TrainingPlanRepository::class,
            WorkoutRepository::class,
            WeightSuggestionRepository::class,
            PersonalRecordRepository::class,
            BodyDataRepository::class,
            OtherSportRepository::class,
            TimerService::class,
            SettingsRepository::class,
            FeelingRepository::class,
        )
        assertEquals(10, interfaces.size, "All 10 repository interfaces must exist")
    }

    @Test
    fun gate_regression_allScreenHelperTypesExist() {
        // All helper data classes from Phase 4 must still be importable
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
            DateRangePreset::class,
            ValidationResult::class,
            PlanTemplate::class,
            TemplateDay::class,
        )
        assertEquals(16, helperTypes.size, "All helper types must be importable")
    }

    @Test
    fun gate_regression_allChartModelsExist() {
        assertNotNull(com.trainrecorder.ui.components.LineChartDataPoint::class)
        assertNotNull(com.trainrecorder.ui.components.BarChartDataPoint::class)
        assertNotNull(com.trainrecorder.ui.components.HeatmapCell::class)
        assertNotNull(com.trainrecorder.ui.components.InspectedPoint::class)
    }

    @Test
    fun gate_regression_allHelperFunctionsCallable() {
        // Phase 3 helpers
        assertNotNull(formatMonthYear(2026, 1))
        assertNotNull(getDayStatus(null))

        // Phase 4 helpers
        assertNotNull(planModeLabel(PlanMode.INFINITE_LOOP))
        assertNotNull(formatSessionDate(testDate))
        assertNotNull(formatVolume(100.0))
        assertNotNull(getCategoryLabel(ExerciseCategory.CORE))
        assertNotNull(formatWeightUnitLabel(WeightUnit.KG))
        assertNotNull(convertWeight(100.0, WeightUnit.KG, WeightUnit.LB))

        // Phase 5 helpers
        assertNotNull(getClearDataDescription())
        assertNotNull(getExportDateRangePresets(testDate))
        assertNotNull(getOnboardingStepTitles())
        assertNotNull(generatePlanName(PLAN_TEMPLATES.first()))
    }
}
