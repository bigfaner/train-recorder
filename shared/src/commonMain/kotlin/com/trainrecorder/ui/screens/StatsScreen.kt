package com.trainrecorder.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.trainrecorder.ui.components.BarChart
import com.trainrecorder.ui.components.HeatmapGrid
import com.trainrecorder.viewmodel.StatsEvent
import com.trainrecorder.viewmodel.StatsUiState
import com.trainrecorder.viewmodel.StatsViewModel
import kotlinx.datetime.Clock
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.minus
import kotlinx.datetime.plus
import kotlinx.datetime.todayIn

/**
 * The Stats screen (UF-9, Tab 4).
 *
 * Displays hero card, 4-grid summary, weekly volume bar chart,
 * PR list, and training frequency heatmap.
 */
@Composable
fun StatsScreen(
    viewModel: StatsViewModel,
    modifier: Modifier = Modifier,
) {
    val state by viewModel.state.collectAsState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        // Screen header
        StatsScreenHeader()

        if (!state.isLoaded) {
            LoadingState()
        } else {
            StatsContent(state = state)
        }
    }
}

/**
 * Header row with title.
 */
@Composable
private fun StatsScreenHeader(
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = "Stats",
            style = MaterialTheme.typography.titleLarge.copy(
                fontWeight = FontWeight.SemiBold,
            ),
            color = MaterialTheme.colorScheme.onSurface,
        )
    }
}

/**
 * Main stats content with all sections.
 */
@Composable
private fun StatsContent(
    state: StatsUiState,
    modifier: Modifier = Modifier,
) {
    val heroData = computeHeroData(state.weeklyStats)
    val summaryGrid = computeSummaryGrid(
        state.weeklyStats,
        emptyList(), // PRs from repository
        state.estimatedOneRepMax,
    )
    val weeklyVolumeChart = computeWeeklyVolumeChart(state.weeklyStats)
    val prList = computePRList(state.estimatedOneRepMax)
    val today = Clock.System.todayIn(TimeZone.currentSystemDefault())

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        // Hero card: weekly volume + change%
        item {
            StatsHeroCard(
                weeklyVolume = heroData.weeklyVolume,
                changePercent = heroData.changePercent,
                totalSessions = heroData.totalSessionsThisWeek,
            )
        }

        // 4-grid summary
        item {
            SummaryGridRow(items = summaryGrid)
        }

        // Weekly volume bar chart (8 weeks)
        item {
            WeeklyVolumeSection(chartData = weeklyVolumeChart)
        }

        // PR list (1RM estimates)
        if (prList.isNotEmpty()) {
            item {
                Text(
                    text = "Personal Records (1RM)",
                    style = MaterialTheme.typography.titleSmall.copy(
                        fontWeight = FontWeight.SemiBold,
                    ),
                    color = MaterialTheme.colorScheme.onSurface,
                )
            }
            items(prList, key = { it.exerciseName }) { pr ->
                PRCard(
                    exerciseName = pr.exerciseName,
                    estimatedOneRM = pr.estimatedOneRM,
                    date = pr.date,
                )
            }
        }

        // Training frequency heatmap (4 weeks)
        item {
            HeatmapSection(state = state, today = today)
        }

        // Bottom spacing
        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

/**
 * Hero card showing weekly volume and change percentage.
 */
@Composable
private fun StatsHeroCard(
    weeklyVolume: Double,
    changePercent: Double,
    totalSessions: Int,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer,
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = 2.dp,
        ),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
        ) {
            Text(
                text = "This Week",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
            )
            Spacer(modifier = Modifier.height(4.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom,
            ) {
                Column {
                    Text(
                        text = formatVolume(weeklyVolume),
                        style = MaterialTheme.typography.headlineMedium.copy(
                            fontWeight = FontWeight.Bold,
                        ),
                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = formatChangePercent(changePercent),
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.SemiBold,
                        ),
                        color = if (changePercent >= 0) {
                            Color(0xFF30D158) // Green for positive
                        } else {
                            MaterialTheme.colorScheme.error // Red for negative
                        },
                    )
                    Text(
                        text = "$totalSessions sessions",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f),
                    )
                }
            }
        }
    }
}

/**
 * 4-grid summary row showing key stats.
 */
@Composable
private fun SummaryGridRow(
    items: List<SummaryGridItem>,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceEvenly,
    ) {
        items.forEach { item ->
            SummaryGridCard(
                item = item,
                modifier = Modifier.weight(1f),
            )
        }
    }
}

/**
 * A single summary card in the 4-grid.
 * Uses RowScope.weight for even distribution.
 */
@Composable
private fun RowScope.SummaryGridCard(
    item: SummaryGridItem,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier
            .weight(1f)
            .padding(horizontal = 4.dp),
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
                .padding(10.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = item.label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = item.value,
                style = MaterialTheme.typography.bodyMedium.copy(
                    fontWeight = FontWeight.SemiBold,
                ),
                color = MaterialTheme.colorScheme.onSurface,
            )
            Text(
                text = item.subtitle,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

/**
 * Weekly volume bar chart section.
 */
@Composable
private fun WeeklyVolumeSection(
    chartData: List<com.trainrecorder.ui.components.BarChartDataPoint>,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = "Weekly Volume",
            style = MaterialTheme.typography.titleSmall.copy(
                fontWeight = FontWeight.SemiBold,
            ),
            color = MaterialTheme.colorScheme.onSurface,
        )
        Spacer(modifier = Modifier.height(8.dp))

        if (chartData.isEmpty()) {
            Text(
                text = "No volume data available",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        } else {
            BarChart(
                dataPoints = chartData,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp),
            )
        }
    }
}

/**
 * PR card for a single exercise.
 */
@Composable
private fun PRCard(
    exerciseName: String,
    estimatedOneRM: Double,
    date: LocalDate,
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
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = exerciseName,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.SemiBold,
                    ),
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Text(
                    text = formatSessionDate(date),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Text(
                text = String.format("%.1f kg", estimatedOneRM),
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                ),
                color = MaterialTheme.colorScheme.primary,
            )
        }
    }
}

/**
 * Training frequency heatmap section.
 */
@Composable
private fun HeatmapSection(
    state: StatsUiState,
    today: LocalDate,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = "Training Frequency (4 weeks)",
            style = MaterialTheme.typography.titleSmall.copy(
                fontWeight = FontWeight.SemiBold,
            ),
            color = MaterialTheme.colorScheme.onSurface,
        )
        Spacer(modifier = Modifier.height(8.dp))

        val heatmapCells = computeHeatmapCells(emptyList(), today)
        // In a real implementation, we would pass actual sessions to computeHeatmapCells
        // For now, we use the heatmapData from the ViewModel if available
        val cells = if (state.heatmapData.isNotEmpty()) {
            val startDate = today.minus(27, DateTimeUnit.DAY)
            (0..27).map { dayOffset ->
                val date = startDate.plus(dayOffset, DateTimeUnit.DAY)
                val sessionCount = state.heatmapData[date] ?: 0
                com.trainrecorder.ui.components.HeatmapCell(
                    date = date,
                    intensity = when {
                        sessionCount == 0 -> 0
                        sessionCount == 1 -> 1
                        sessionCount == 2 -> 2
                        sessionCount == 3 -> 3
                        else -> 4
                    },
                )
            }
        } else {
            heatmapCells
        }

        HeatmapGrid(
            cells = cells,
            modifier = Modifier
                .fillMaxWidth()
                .height(180.dp),
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
