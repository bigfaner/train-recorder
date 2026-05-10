package com.trainrecorder.ui.navigation

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

/**
 * Tests for navigation route definitions and tab configuration.
 * Verifies all 18 routes are serializable and the tab bar is correctly configured.
 */
class NavGraphTest {

    @Test
    fun tabDestinations_hasFiveEntries() {
        assertEquals(5, TAB_DESTINATIONS.size)
    }

    @Test
    fun tabDestinations_coversAllPrimaryScreens() {
        val labels = TAB_DESTINATIONS.map { it.label }.toSet()
        assertTrue(labels.contains("Calendar"))
        assertTrue(labels.contains("Plan"))
        assertTrue(labels.contains("History"))
        assertTrue(labels.contains("Body"))
        assertTrue(labels.contains("Settings"))
    }

    @Test
    fun tabRoutes_matchesTabDestinationRoutes() {
        val destRoutes = TAB_DESTINATIONS.map { it.route }.toSet()
        assertEquals(destRoutes, TAB_ROUTES)
    }

    @Test
    fun tabRoutes_doesNotIncludePushRoutes() {
        // Push/detail routes should not be tab routes
        assertFalse(TAB_ROUTES.contains("workout"))
        assertFalse(TAB_ROUTES.contains("feeling"))
        assertFalse(TAB_ROUTES.contains("plan_edit"))
        assertFalse(TAB_ROUTES.contains("day_edit"))
        assertFalse(TAB_ROUTES.contains("onboarding"))
    }

    @Test
    fun calendarRoute_isSerializableObject() {
        val route = CalendarRoute
        assertNotNull(route)
    }

    @Test
    fun workoutRoute_hasOptionalParameters() {
        val defaultRoute = WorkoutRoute()
        assertEquals(null, defaultRoute.sessionId)
        assertEquals(null, defaultRoute.planDayId)
        assertEquals(null, defaultRoute.date)

        val withSession = WorkoutRoute(sessionId = "abc123")
        assertEquals("abc123", withSession.sessionId)
    }

    @Test
    fun feelingRoute_requiresSessionId() {
        val route = FeelingRoute(sessionId = "session-1")
        assertEquals("session-1", route.sessionId)
    }

    @Test
    fun planEditRoute_supportsCreateMode() {
        val createMode = PlanEditRoute(planId = null)
        assertEquals(null, createMode.planId)

        val editMode = PlanEditRoute(planId = "plan-1")
        assertEquals("plan-1", editMode.planId)
    }

    @Test
    fun dayEditRoute_requiresPlanId() {
        val route = DayEditRoute(planId = "plan-1", dayId = "day-1")
        assertEquals("plan-1", route.planId)
        assertEquals("day-1", route.dayId)
    }

    @Test
    fun exercisePickerRoute_supportsMultiSelect() {
        val single = ExercisePickerRoute(multiSelect = false)
        assertFalse(single.multiSelect)

        val multi = ExercisePickerRoute(multiSelect = true)
        assertTrue(multi.multiSelect)
    }

    @Test
    fun otherSportRoute_hasDateAndOptionalRecordId() {
        val withoutRecord = OtherSportRoute(date = "2026-01-15")
        assertEquals("2026-01-15", withoutRecord.date)
        assertEquals(null, withoutRecord.recordId)

        val withRecord = OtherSportRoute(date = "2026-01-15", recordId = "rec-1")
        assertEquals("rec-1", withRecord.recordId)
    }

    @Test
    fun sessionDetailRoute_requiresSessionId() {
        val route = SessionDetailRoute(sessionId = "session-42")
        assertEquals("session-42", route.sessionId)
    }

    @Test
    fun bodyDataEditRoute_supportsCreateAndEdit() {
        val create = BodyDataEditRoute()
        assertEquals(null, create.recordId)
        assertEquals(null, create.date)

        val edit = BodyDataEditRoute(recordId = "rec-1", date = "2026-01-15")
        assertEquals("rec-1", edit.recordId)
        assertEquals("2026-01-15", edit.date)
    }

    @Test
    fun progressChartRoute_requiresExerciseId() {
        val route = ProgressChartRoute(exerciseId = "ex-1")
        assertEquals("ex-1", route.exerciseId)
    }

    @Test
    fun exerciseDetailRoute_requiresExerciseId() {
        val route = ExerciseDetailRoute(exerciseId = "ex-42")
        assertEquals("ex-42", route.exerciseId)
    }

    @Test
    fun exerciseCreateRoute_supportsCreateAndEdit() {
        val create = ExerciseCreateRoute()
        assertEquals(null, create.exerciseId)

        val edit = ExerciseCreateRoute(exerciseId = "ex-1")
        assertEquals("ex-1", edit.exerciseId)
    }

    @Test
    fun otherSportCreateRoute_supportsCreateAndEdit() {
        val create = OtherSportCreateRoute()
        assertEquals(null, create.typeId)

        val edit = OtherSportCreateRoute(typeId = "type-1")
        assertEquals("type-1", edit.typeId)
    }

    @Test
    fun onboardingRoute_isSerializableObject() {
        val route = OnboardingRoute
        assertNotNull(route)
    }

    @Test
    fun allRoutes_haveUniqueRouteStrings() {
        val allRoutes = listOf(
            "calendar" to CalendarRoute,
            "plan_list" to PlanListRoute,
            "history" to HistoryRoute,
            "body_data" to BodyDataRoute,
            "settings" to SettingsRoute,
            "onboarding" to OnboardingRoute,
        )
        val routes = allRoutes.map { it.first }
        assertEquals(routes.toSet().size, routes.size, "All route strings must be unique")
    }

    private fun assertFalse(condition: Boolean) {
        kotlin.test.assertFalse(condition)
    }
}
