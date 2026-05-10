package com.trainrecorder.ui.navigation

import kotlinx.serialization.Serializable

// --- Tab bar destinations (top-level) ---
@Serializable object CalendarRoute

@Serializable object PlanListRoute

@Serializable object HistoryRoute

@Serializable object BodyDataRoute

@Serializable object SettingsRoute

// --- Detail / sub-pages ---
@Serializable data class WorkoutRoute(
    val sessionId: String? = null,
    val planDayId: String? = null,
    val date: String? = null,
)

@Serializable data class FeelingRoute(val sessionId: String)

@Serializable data class OtherSportRoute(
    val date: String,
    val recordId: String? = null,
)

@Serializable data class PlanEditRoute(val planId: String? = null)

@Serializable data class DayEditRoute(
    val planId: String,
    val dayId: String? = null,
)

@Serializable data class ExercisePickerRoute(val multiSelect: Boolean = true)

@Serializable data class ExerciseDetailRoute(val exerciseId: String)

@Serializable data class ExerciseCreateRoute(val exerciseId: String? = null)

@Serializable data class SessionDetailRoute(val sessionId: String)

@Serializable data class BodyDataEditRoute(
    val recordId: String? = null,
    val date: String? = null,
)

@Serializable data class ProgressChartRoute(val exerciseId: String)

@Serializable data class OtherSportCreateRoute(val typeId: String? = null)

@Serializable object OnboardingRoute
