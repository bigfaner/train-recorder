package com.trainrecorder.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.toRoute
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
import com.trainrecorder.ui.navigation.TrainRecorderScaffold
import com.trainrecorder.ui.navigation.WorkoutRoute
import com.trainrecorder.ui.screens.BodyDataScreen
import com.trainrecorder.ui.screens.CalendarScreen
import com.trainrecorder.ui.screens.DayEditScreen
import com.trainrecorder.ui.screens.ExerciseLibraryScreen
import com.trainrecorder.ui.screens.FeelingScreen
import com.trainrecorder.ui.screens.HistoryScreen
import com.trainrecorder.ui.screens.OnboardingScreen
import com.trainrecorder.ui.screens.OtherSportScreen
import com.trainrecorder.ui.screens.PlanEditScreen
import com.trainrecorder.ui.screens.PlanScreen
import com.trainrecorder.ui.screens.SettingsScreen
import com.trainrecorder.ui.screens.WorkoutScreen
import com.trainrecorder.viewmodel.BodyDataViewModel
import com.trainrecorder.viewmodel.CalendarViewModel
import com.trainrecorder.viewmodel.ExerciseLibraryViewModel
import com.trainrecorder.viewmodel.FeelingViewModel
import com.trainrecorder.viewmodel.HistoryViewModel
import com.trainrecorder.viewmodel.OtherSportViewModel
import com.trainrecorder.viewmodel.PlanViewModel
import com.trainrecorder.viewmodel.SettingsViewModel
import com.trainrecorder.viewmodel.WorkoutViewModel
import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.todayIn
import org.koin.mp.KoinPlatform

/**
 * Root composable for the Train Recorder application.
 *
 * Initializes MaterialTheme, tab scaffold, and the navigation graph
 * connecting all 18 routes to their respective screens.
 */
@Composable
fun App() {
    MaterialTheme {
        TrainRecorderScaffold { navController ->
            TrainRecorderNavHost(navController)
        }
    }
}

/**
 * Navigation host wiring all routes to their screen composables.
 *
 * Tab routes (5): Calendar, Plan, History, Body, Settings
 * Push routes (13): Workout, Feeling, PlanEdit, DayEdit, ExercisePicker,
 *   ExerciseDetail, ExerciseCreate, SessionDetail, BodyDataEdit,
 *   ProgressChart, OtherSport, OtherSportCreate, Onboarding
 */
@Composable
fun TrainRecorderNavHost(
    navController: NavHostController,
) {
    NavHost(
        navController = navController,
        startDestination = CalendarRoute,
    ) {
        // --- Tab routes ---

        composable<CalendarRoute> {
            val viewModel = remember {
                CalendarViewModel(
                    planRepository = KoinPlatform.getKoin().get(),
                    workoutRepository = KoinPlatform.getKoin().get(),
                    scheduleCalculator = KoinPlatform.getKoin().get(),
                    today = Clock.System.todayIn(TimeZone.currentSystemDefault()),
                )
            }
            CalendarScreen(
                viewModel = viewModel,
                onStartWorkout = { date ->
                    navController.navigate(WorkoutRoute(date = date.toString()))
                },
                onRecordOtherSport = {
                    navController.navigate(
                        OtherSportRoute(
                            date = Clock.System
                                .todayIn(TimeZone.currentSystemDefault())
                                .toString(),
                        ),
                    )
                },
            )
        }

        composable<PlanListRoute> {
            val viewModel = remember {
                PlanViewModel(
                    planRepository = KoinPlatform.getKoin().get(),
                )
            }
            PlanScreen(
                viewModel = viewModel,
                onCreatePlan = {
                    navController.navigate(PlanEditRoute())
                },
                onEditPlan = { planId ->
                    navController.navigate(PlanEditRoute(planId = planId))
                },
                onEditDay = { planId, dayId ->
                    navController.navigate(DayEditRoute(planId = planId, dayId = dayId))
                },
            )
        }

        composable<HistoryRoute> {
            val viewModel = remember {
                HistoryViewModel(
                    workoutRepository = KoinPlatform.getKoin().get(),
                    personalRecordRepository = KoinPlatform.getKoin().get(),
                )
            }
            HistoryScreen(
                viewModel = viewModel,
                onViewSessionDetail = { sessionId ->
                    navController.navigate(SessionDetailRoute(sessionId = sessionId))
                },
            )
        }

        composable<BodyDataRoute> {
            val viewModel = remember {
                BodyDataViewModel(
                    bodyDataRepository = KoinPlatform.getKoin().get(),
                )
            }
            BodyDataScreen(
                viewModel = viewModel,
                onAddRecord = {
                    navController.navigate(BodyDataEditRoute())
                },
                onEditRecord = { recordId ->
                    navController.navigate(BodyDataEditRoute(recordId = recordId))
                },
            )
        }

        composable<SettingsRoute> {
            val viewModel = remember {
                SettingsViewModel(
                    settingsRepository = KoinPlatform.getKoin().get(),
                )
            }
            SettingsScreen(
                viewModel = viewModel,
                onNavigateToExerciseLibrary = {
                    navController.navigate(ExercisePickerRoute(multiSelect = false))
                },
            )
        }

        // --- Push routes ---

        composable<WorkoutRoute> { backStackEntry ->
            val route: WorkoutRoute = backStackEntry.toRoute()
            val viewModel = remember {
                WorkoutViewModel(
                    workoutRepository = KoinPlatform.getKoin().get(),
                    weightSuggestionRepository = KoinPlatform.getKoin().get(),
                    timerService = KoinPlatform.getKoin().get(),
                    sessionId = route.sessionId ?: "",
                )
            }
            WorkoutScreen(
                viewModel = viewModel,
                onNavigateBack = {
                    navController.popBackStack()
                },
            )
        }

        composable<FeelingRoute> { backStackEntry ->
            val route: FeelingRoute = backStackEntry.toRoute()
            val viewModel = remember {
                FeelingViewModel(
                    feelingRepository = KoinPlatform.getKoin().get(),
                    workoutRepository = KoinPlatform.getKoin().get(),
                    sessionId = route.sessionId,
                )
            }
            FeelingScreen(
                viewModel = viewModel,
                onSaveComplete = {
                    navController.popBackStack(CalendarRoute, inclusive = false)
                },
                onSkip = {
                    navController.popBackStack(CalendarRoute, inclusive = false)
                },
            )
        }

        composable<PlanEditRoute> { backStackEntry ->
            val route: PlanEditRoute = backStackEntry.toRoute()
            PlanEditScreen(
                planId = route.planId,
                onBack = { navController.popBackStack() },
                onSave = { _, _, _, _, _ ->
                    navController.popBackStack()
                },
                onEditDay = { _ ->
                    val planId = route.planId ?: ""
                    navController.navigate(DayEditRoute(planId = planId))
                },
                onAddDay = {
                    val planId = route.planId ?: ""
                    navController.navigate(DayEditRoute(planId = planId))
                },
            )
        }

        composable<DayEditRoute> { backStackEntry ->
            val route: DayEditRoute = backStackEntry.toRoute()
            DayEditScreen(
                onSave = { _, _, _ ->
                    navController.popBackStack()
                },
                onBack = { navController.popBackStack() },
                onAddExercise = {
                    navController.navigate(ExercisePickerRoute(multiSelect = true))
                },
            )
        }

        composable<ExercisePickerRoute> { backStackEntry ->
            val route: ExercisePickerRoute = backStackEntry.toRoute()
            val viewModel = remember {
                ExerciseLibraryViewModel(
                    exerciseRepository = KoinPlatform.getKoin().get(),
                )
            }
            ExerciseLibraryScreen(
                viewModel = viewModel,
                isSelectionMode = route.multiSelect,
                onExerciseClick = { exerciseId ->
                    navController.navigate(ExerciseDetailRoute(exerciseId = exerciseId))
                },
                onCreateExercise = {
                    navController.navigate(ExerciseCreateRoute())
                },
                onSelectionComplete = {
                    navController.popBackStack()
                },
            )
        }

        composable<ExerciseDetailRoute> {
            val viewModel = remember {
                ExerciseLibraryViewModel(
                    exerciseRepository = KoinPlatform.getKoin().get(),
                )
            }
            ExerciseLibraryScreen(
                viewModel = viewModel,
                onExerciseClick = {},
                onCreateExercise = {
                    navController.navigate(ExerciseCreateRoute())
                },
            )
        }

        composable<ExerciseCreateRoute> {
            val viewModel = remember {
                ExerciseLibraryViewModel(
                    exerciseRepository = KoinPlatform.getKoin().get(),
                )
            }
            ExerciseLibraryScreen(
                viewModel = viewModel,
                isSelectionMode = false,
                onExerciseClick = {},
                onCreateExercise = {},
            )
        }

        composable<SessionDetailRoute> {
            val viewModel = remember {
                HistoryViewModel(
                    workoutRepository = KoinPlatform.getKoin().get(),
                    personalRecordRepository = KoinPlatform.getKoin().get(),
                )
            }
            HistoryScreen(
                viewModel = viewModel,
                onViewSessionDetail = {},
            )
        }

        composable<BodyDataEditRoute> {
            val viewModel = remember {
                BodyDataViewModel(
                    bodyDataRepository = KoinPlatform.getKoin().get(),
                )
            }
            BodyDataScreen(
                viewModel = viewModel,
                onAddRecord = {},
                onEditRecord = {},
            )
        }

        composable<ProgressChartRoute> {
            val viewModel = remember {
                HistoryViewModel(
                    workoutRepository = KoinPlatform.getKoin().get(),
                    personalRecordRepository = KoinPlatform.getKoin().get(),
                )
            }
            HistoryScreen(
                viewModel = viewModel,
                onViewSessionDetail = { sessionId ->
                    navController.navigate(SessionDetailRoute(sessionId = sessionId))
                },
            )
        }

        composable<OtherSportRoute> { backStackEntry ->
            val route: OtherSportRoute = backStackEntry.toRoute()
            val viewModel = remember {
                OtherSportViewModel(
                    otherSportRepository = KoinPlatform.getKoin().get(),
                )
            }
            OtherSportScreen(
                viewModel = viewModel,
                onSaveComplete = {
                    navController.popBackStack()
                },
                onCreateCustomSport = {
                    navController.navigate(OtherSportCreateRoute())
                },
            )
        }

        composable<OtherSportCreateRoute> {
            val viewModel = remember {
                OtherSportViewModel(
                    otherSportRepository = KoinPlatform.getKoin().get(),
                )
            }
            OtherSportScreen(
                viewModel = viewModel,
                onSaveComplete = {
                    navController.popBackStack()
                },
                onCreateCustomSport = {},
            )
        }

        composable<OnboardingRoute> {
            OnboardingScreen(
                onComplete = {
                    navController.navigate(CalendarRoute) {
                        popUpTo(OnboardingRoute) { inclusive = true }
                    }
                },
            )
        }
    }
}
