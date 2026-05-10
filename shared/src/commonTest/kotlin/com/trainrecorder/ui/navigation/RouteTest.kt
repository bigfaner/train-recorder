package com.trainrecorder.ui.navigation

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class RouteTest {

    @Test
    fun `all 15 navigation routes are defined`() {
        // 5 top-level routes
        val topLevelRoutes = listOf(
            CalendarRoute,
            PlanListRoute,
            HistoryRoute,
            BodyDataRoute,
            SettingsRoute,
        )
        assertEquals(5, topLevelRoutes.size, "Should have 5 top-level tab routes")

        // 10 detail/sub-page routes (verified by instantiation)
        val workoutRoute = WorkoutRoute()
        val feelingRoute = FeelingRoute(sessionId = "test-session")
        val otherSportRoute = OtherSportRoute(date = "2026-05-11")
        val planEditRoute = PlanEditRoute()
        val dayEditRoute = DayEditRoute(planId = "plan-1")
        val exercisePickerRoute = ExercisePickerRoute()
        val exerciseDetailRoute = ExerciseDetailRoute(exerciseId = "ex-1")
        val exerciseCreateRoute = ExerciseCreateRoute()
        val sessionDetailRoute = SessionDetailRoute(sessionId = "session-1")
        val bodyDataEditRoute = BodyDataEditRoute()
        val progressChartRoute = ProgressChartRoute(exerciseId = "ex-1")
        val otherSportCreateRoute = OtherSportCreateRoute()
        val onboardingRoute = OnboardingRoute

        val allRoutes = topLevelRoutes + listOf(
            workoutRoute,
            feelingRoute,
            otherSportRoute,
            planEditRoute,
            dayEditRoute,
            exercisePickerRoute,
            exerciseDetailRoute,
            exerciseCreateRoute,
            sessionDetailRoute,
            bodyDataEditRoute,
            progressChartRoute,
            otherSportCreateRoute,
            onboardingRoute,
        )
        // 5 tab routes + 13 detail/sub-page routes = 18 total
        assertEquals(18, allRoutes.size, "Should have all routes defined")
    }

    @Test
    fun `WorkoutRoute supports optional parameters`() {
        val default = WorkoutRoute()
        assertEquals(null, default.sessionId)
        assertEquals(null, default.planDayId)
        assertEquals(null, default.date)

        val withSession = WorkoutRoute(sessionId = "s1", date = "2026-05-11")
        assertEquals("s1", withSession.sessionId)
        assertEquals("2026-05-11", withSession.date)
    }

    @Test
    fun `PlanEditRoute null planId means create mode`() {
        val create = PlanEditRoute()
        assertEquals(null, create.planId)

        val edit = PlanEditRoute(planId = "plan-1")
        assertEquals("plan-1", edit.planId)
    }

    @Test
    fun `DayEditRoute requires planId`() {
        val route = DayEditRoute(planId = "plan-1", dayId = "day-1")
        assertEquals("plan-1", route.planId)
        assertEquals("day-1", route.dayId)

        val withoutDay = DayEditRoute(planId = "plan-1")
        assertEquals(null, withoutDay.dayId)
    }

    @Test
    fun `ExercisePickerRoute defaults to multi-select`() {
        val route = ExercisePickerRoute()
        assertTrue(route.multiSelect)

        val singleSelect = ExercisePickerRoute(multiSelect = false)
        assertEquals(false, singleSelect.multiSelect)
    }

    @Test
    fun `OtherSportRoute has required date parameter`() {
        val route = OtherSportRoute(date = "2026-05-11")
        assertEquals("2026-05-11", route.date)
        assertEquals(null, route.recordId)

        val withRecord = OtherSportRoute(date = "2026-05-11", recordId = "r1")
        assertEquals("r1", withRecord.recordId)
    }

    @Test
    fun `FeelingRoute requires sessionId`() {
        val route = FeelingRoute(sessionId = "session-1")
        assertEquals("session-1", route.sessionId)
    }

    @Test
    fun `SessionDetailRoute requires sessionId`() {
        val route = SessionDetailRoute(sessionId = "session-1")
        assertEquals("session-1", route.sessionId)
    }

    @Test
    fun `ProgressChartRoute requires exerciseId`() {
        val route = ProgressChartRoute(exerciseId = "ex-1")
        assertEquals("ex-1", route.exerciseId)
    }

    @Test
    fun `BodyDataEditRoute supports optional recordId and date`() {
        val empty = BodyDataEditRoute()
        assertEquals(null, empty.recordId)
        assertEquals(null, empty.date)

        val withDate = BodyDataEditRoute(date = "2026-05-11")
        assertEquals("2026-05-11", withDate.date)

        val edit = BodyDataEditRoute(recordId = "rec-1")
        assertEquals("rec-1", edit.recordId)
    }

    @Test
    fun `OtherSportCreateRoute optional typeId`() {
        val create = OtherSportCreateRoute()
        assertEquals(null, create.typeId)

        val edit = OtherSportCreateRoute(typeId = "type-1")
        assertEquals("type-1", edit.typeId)
    }

    @Test
    fun `ExerciseCreateRoute optional exerciseId for edit mode`() {
        val create = ExerciseCreateRoute()
        assertEquals(null, create.exerciseId)

        val edit = ExerciseCreateRoute(exerciseId = "ex-1")
        assertEquals("ex-1", edit.exerciseId)
    }

    @Test
    fun `tab destinations contain 5 tabs with correct routes`() {
        assertEquals(5, TAB_DESTINATIONS.size)
        val routes = TAB_DESTINATIONS.map { it.route }
        assertTrue(routes.contains("calendar"))
        assertTrue(routes.contains("plan_list"))
        assertTrue(routes.contains("history"))
        assertTrue(routes.contains("body_data"))
        assertTrue(routes.contains("settings"))
    }

    @Test
    fun `tab destinations have labels and icons`() {
        TAB_DESTINATIONS.forEach { tab ->
            assertNotNull(tab.label, "Tab should have a label")
            assertTrue(tab.label.isNotEmpty(), "Tab label should not be empty")
            assertNotNull(tab.iconVector, "Tab should have an icon")
        }
    }

    @Test
    fun `TAB_ROUTES matches tab destinations`() {
        assertEquals(TAB_DESTINATIONS.map { it.route }.toSet(), TAB_ROUTES)
    }
}
