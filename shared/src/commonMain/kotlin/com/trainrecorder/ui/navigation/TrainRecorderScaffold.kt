package com.trainrecorder.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController

/**
 * Data class representing a tab destination.
 */
data class TabDestination(
    val label: String,
    val iconVector: ImageVector,
    val route: String,
)

/**
 * All tab bar destinations.
 */
val TAB_DESTINATIONS = listOf(
    TabDestination("Calendar", TrainRecorderIcons.Calendar, "calendar"),
    TabDestination("Plan", TrainRecorderIcons.ClipboardList, "plan_list"),
    TabDestination("History", TrainRecorderIcons.ChartBar, "history"),
    TabDestination("Body", TrainRecorderIcons.FigureStand, "body_data"),
    TabDestination("Settings", TrainRecorderIcons.Gear, "settings"),
)

/**
 * Set of routes that correspond to top-level tab destinations.
 */
val TAB_ROUTES = TAB_DESTINATIONS.map { it.route }.toSet()

/**
 * Main scaffold with bottom tab bar and navigation host.
 *
 * Creates and provides a [NavHostController] to [content] so that the
 * tab bar and NavHost share the same controller.
 *
 * @param content The composable content (typically NavHost), receiving the shared NavController.
 */
@Composable
fun TrainRecorderScaffold(
    content: @Composable (NavHostController) -> Unit,
) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    // Determine which tab is selected (if any)
    val selectedTab = TAB_DESTINATIONS.find { it.route == currentRoute }

    // Hide tab bar on fullscreen screens (workout execution, onboarding)
    val showTabBar = selectedTab != null

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        bottomBar = {
            if (showTabBar) {
                TrainRecorderTabBar(
                    selectedTab = selectedTab,
                    onTabSelected = { tab ->
                        navController.navigate(tab.route) {
                            popUpTo(navController.graph.findStartDestination().id) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                )
            }
        },
    ) { innerPadding ->
        Box(
            modifier = Modifier.padding(innerPadding),
        ) {
            content(navController)
        }
    }
}

@Composable
private fun TrainRecorderTabBar(
    selectedTab: TabDestination?,
    onTabSelected: (TabDestination) -> Unit,
) {
    NavigationBar(
        modifier = Modifier
            .fillMaxWidth()
            .height(83.dp),
        containerColor = MaterialTheme.colorScheme.surface,
        contentColor = MaterialTheme.colorScheme.onSurface,
    ) {
        TAB_DESTINATIONS.forEach { tab ->
            val selected = tab == selectedTab

            NavigationBarItem(
                icon = {
                    Icon(
                        imageVector = tab.iconVector,
                        contentDescription = tab.label,
                    )
                },
                label = {
                    Text(
                        text = tab.label,
                        fontSize = 10.sp,
                    )
                },
                selected = selected,
                onClick = { onTabSelected(tab) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = MaterialTheme.colorScheme.primary,
                    selectedTextColor = MaterialTheme.colorScheme.primary,
                    unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    indicatorColor = MaterialTheme.colorScheme.primaryContainer,
                ),
            )
        }
    }
}
