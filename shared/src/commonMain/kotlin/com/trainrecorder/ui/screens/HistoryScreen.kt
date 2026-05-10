package com.trainrecorder.ui.screens

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.trainrecorder.ui.components.BarChart
import com.trainrecorder.ui.components.LineChart
import com.trainrecorder.viewmodel.HistoryEvent
import com.trainrecorder.viewmodel.HistoryTab
import com.trainrecorder.viewmodel.HistoryUiState
import com.trainrecorder.viewmodel.HistoryViewModel
import com.trainrecorder.viewmodel.WorkoutSessionSummary

/**
 * The History screen (UF-5, Tab 3).
 *
 * Displays 4 tabs: History, Progress, Volume, PR.
 * Each tab shows different views of training history data.
 */
@Composable
fun HistoryScreen(
    viewModel: HistoryViewModel,
    onViewSessionDetail: (sessionId: String) -> Unit = {},
    onEditSession: (sessionId: String) -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val state by viewModel.state.collectAsState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        // Screen header
        HistoryScreenHeader()

        // 4-segment tab bar
        HistoryTabBar(
            selectedTab = state.selectedTab,
            onTabSelected = { viewModel.onEvent(HistoryEvent.SelectTab(it)) },
        )

        // Tab content with animated transitions
        AnimatedContent(
            targetState = state.selectedTab,
            transitionSpec = {
                if (targetState.ordinal > initialState.ordinal) {
                    slideInHorizontally { it } togetherWith slideOutHorizontally { -it }
                } else {
                    slideInHorizontally { -it } togetherWith slideOutHorizontally { it }
                }
            },
            label = "history_tab_transition",
        ) { tab ->
            when (tab) {
                HistoryTab.HISTORY -> HistoryTabContent(
                    state = state,
                    onViewSessionDetail = onViewSessionDetail,
                    onEditSession = onEditSession,
                    onDeleteSession = { viewModel.onEvent(HistoryEvent.DeleteSession(it)) },
                )
                HistoryTab.PROGRESS -> ProgressTabContent(state = state)
                HistoryTab.VOLUME -> VolumeTabContent(state = state)
                HistoryTab.PR -> PRTabContent(state = state)
            }
        }
    }
}

/**
 * Header row with title.
 */
@Composable
private fun HistoryScreenHeader(
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = "History",
            style = MaterialTheme.typography.titleLarge.copy(
                fontWeight = FontWeight.SemiBold,
            ),
            color = MaterialTheme.colorScheme.onSurface,
        )
    }
}

/**
 * 4-segment tab bar for History, Progress, Volume, PR.
 */
@Composable
private fun HistoryTabBar(
    selectedTab: HistoryTab,
    onTabSelected: (HistoryTab) -> Unit,
    modifier: Modifier = Modifier,
) {
    val tabs = getHistoryTabs()

    TabRow(
        selectedTabIndex = selectedTab.ordinal,
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        containerColor = Color.Transparent,
        contentColor = MaterialTheme.colorScheme.onSurface,
        indicator = { tabPositions ->
            TabRowDefaults.Indicator(
                modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTab.ordinal]),
                color = MaterialTheme.colorScheme.primary,
            )
        },
        divider = {
            HorizontalDivider(
                color = MaterialTheme.colorScheme.outlineVariant,
            )
        },
    ) {
        tabs.forEach { tab ->
            Tab(
                selected = tab == selectedTab,
                onClick = { onTabSelected(tab) },
                text = {
                    Text(
                        text = HISTORY_TAB_LABELS[tab] ?: tab.name,
                        style = MaterialTheme.typography.labelMedium.copy(
                            fontWeight = if (tab == selectedTab) FontWeight.SemiBold else FontWeight.Normal,
                        ),
                    )
                },
                selectedContentColor = MaterialTheme.colorScheme.primary,
                unselectedContentColor = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

/**
 * History tab: session cards list.
 */
@Composable
private fun HistoryTabContent(
    state: HistoryUiState,
    onViewSessionDetail: (sessionId: String) -> Unit,
    onEditSession: (sessionId: String) -> Unit,
    onDeleteSession: (sessionId: String) -> Unit,
    modifier: Modifier = Modifier,
) {
    if (!state.isLoaded) {
        LoadingState()
        return
    }

    if (state.sessions.isEmpty()) {
        EmptyHistoryState()
        return
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        items(state.sessions, key = { it.sessionId }) { session ->
            SessionCard(
                session = session,
                onClick = { onViewSessionDetail(session.sessionId) },
                onEdit = { onEditSession(session.sessionId) },
                onDelete = { onDeleteSession(session.sessionId) },
            )
        }

        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

/**
 * A session card showing date, training type, volume, and exercises.
 */
@Composable
private fun SessionCard(
    session: WorkoutSessionSummary,
    onClick: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val typeColor = TrainingTypeColor.fromTrainingType(session.trainingType).toComposeColor()

    Card(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface,
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = 1.dp,
        ),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                // Date
                Text(
                    text = formatSessionDate(session.date),
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.SemiBold,
                    ),
                    color = MaterialTheme.colorScheme.onSurface,
                )

                // Training type badge
                Box(
                    modifier = Modifier
                        .background(typeColor.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                ) {
                    Text(
                        text = trainingTypeLabel(session.trainingType),
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.SemiBold,
                        ),
                        color = typeColor,
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Volume and exercises
            if (session.totalVolume > 0) {
                Text(
                    text = formatVolume(session.totalVolume),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            if (session.exercises.isNotEmpty()) {
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = session.exercises.joinToString(", "),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }

            // Edit/Delete row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
            ) {
                TextButton(onClick = onEdit) {
                    Text("Edit", style = MaterialTheme.typography.labelSmall)
                }
                TextButton(onClick = onDelete) {
                    Text(
                        text = "Delete",
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.labelSmall,
                    )
                }
            }
        }
    }
}

/**
 * Progress tab: exercise selector + line chart with PR markers.
 */
@Composable
private fun ProgressTabContent(
    state: HistoryUiState,
    modifier: Modifier = Modifier,
) {
    if (!state.isLoaded) {
        LoadingState()
        return
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 8.dp),
    ) {
        if (state.progressData == null || state.progressData.isEmpty()) {
            // No exercise selected or no data
            EmptyDataState(
                message = if (state.selectedExerciseId == null) {
                    "Select an exercise to view progress"
                } else {
                    "No progress data for this exercise"
                },
            )
        } else {
            // Line chart with PR markers
            LineChart(
                dataPoints = toLineChartData(state.progressData),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(220.dp),
                label = "Weight (kg)",
            )
        }
    }
}

/**
 * Volume tab: bar chart + summary card.
 */
@Composable
private fun VolumeTabContent(
    state: HistoryUiState,
    modifier: Modifier = Modifier,
) {
    if (!state.isLoaded) {
        LoadingState()
        return
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 8.dp),
    ) {
        if (state.volumeData == null || state.volumeData.isEmpty()) {
            EmptyDataState(message = "No volume data available")
        } else {
            // Summary card
            val totalVolume = state.volumeData.sumOf { it.volume }
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                ),
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "Total Volume",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Text(
                            text = formatVolume(totalVolume),
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.SemiBold,
                            ),
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "Sessions",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Text(
                            text = "${state.volumeData.size}",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.SemiBold,
                            ),
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Bar chart
            BarChart(
                dataPoints = toBarChartData(state.volumeData),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(220.dp),
            )
        }
    }
}

/**
 * PR tab: exercise PR cards.
 */
@Composable
private fun PRTabContent(
    state: HistoryUiState,
    modifier: Modifier = Modifier,
) {
    if (!state.isLoaded) {
        LoadingState()
        return
    }

    if (state.personalRecords.isEmpty()) {
        EmptyDataState(message = "No personal records yet")
        return
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        items(state.personalRecords, key = { it.id }) { record ->
            PRCord(
                exerciseId = record.exerciseId,
                maxWeight = record.maxWeight,
                maxVolume = record.maxVolume,
                maxWeightDate = record.maxWeightDate,
                maxVolumeDate = record.maxVolumeDate,
            )
        }

        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

/**
 * A PR card showing exercise personal records.
 */
@Composable
private fun PRCord(
    exerciseId: String,
    maxWeight: Double,
    maxVolume: Double,
    maxWeightDate: kotlinx.datetime.LocalDate,
    maxVolumeDate: kotlinx.datetime.LocalDate,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface,
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = 1.dp,
        ),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
        ) {
            Text(
                text = exerciseId, // In real app, resolve to exercise name
                style = MaterialTheme.typography.bodyMedium.copy(
                    fontWeight = FontWeight.SemiBold,
                ),
                color = MaterialTheme.colorScheme.onSurface,
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Column {
                    Text(
                        text = "Max Weight",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Text(
                        text = "${maxWeight} kg",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = FontWeight.Medium,
                        ),
                        color = MaterialTheme.colorScheme.primary,
                    )
                    Text(
                        text = formatSessionDate(maxWeightDate),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }

                Spacer(modifier = Modifier.width(16.dp))

                Column {
                    Text(
                        text = "Max Volume",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Text(
                        text = formatVolume(maxVolume),
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = FontWeight.Medium,
                        ),
                        color = MaterialTheme.colorScheme.primary,
                    )
                    Text(
                        text = formatSessionDate(maxVolumeDate),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}

/**
 * Empty state when no sessions exist.
 */
@Composable
private fun EmptyHistoryState(
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = "No training history",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.SemiBold,
                ),
                color = MaterialTheme.colorScheme.onSurface,
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Complete a workout to see your history here",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

/**
 * Generic empty data state for chart tabs.
 */
@Composable
private fun EmptyDataState(
    message: String,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

/**
 * Loading state indicator.
 */
@Composable
private fun LoadingState(
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        CircularProgressIndicator()
    }
}

/**
 * Convert TrainingTypeColor to Compose Color.
 */
private fun TrainingTypeColor.toComposeColor(): Color = Color(hex.toLong())
