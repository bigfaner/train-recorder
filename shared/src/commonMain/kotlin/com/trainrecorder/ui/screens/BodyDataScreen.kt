package com.trainrecorder.ui.screens

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.trainrecorder.domain.model.BodyMeasurement
import com.trainrecorder.ui.components.LineChart
import com.trainrecorder.viewmodel.BodyDataEvent
import com.trainrecorder.viewmodel.BodyDataUiState
import com.trainrecorder.viewmodel.BodyDataViewModel
import com.trainrecorder.viewmodel.BodyMetric
import kotlinx.datetime.LocalDate

private val TrendDownColor = Color(0xFF30D158)
private val TrendUpColor = Color(0xFFFF3B30)

/**
 * The Body Data screen (UF-6, Tab 4).
 *
 * Displays latest measurement card, trend chart, and history list.
 * Provides a form for recording new body measurements.
 */
@Composable
fun BodyDataScreen(
    viewModel: BodyDataViewModel,
    onAddRecord: () -> Unit = {},
    onEditRecord: (recordId: String) -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val state by viewModel.state.collectAsState()
    var selectedTab by remember { mutableStateOf(BodyDataTab.TREND) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        // Header
        BodyDataHeader()

        if (!state.isLoaded) {
            LoadingState()
            return
        }

        // Latest data card
        LatestDataCard(
            state = state,
            onAddRecord = onAddRecord,
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Tab bar: Trend / History
        val tabs = getBodyDataTabs()
        val tabLabels = mapOf(
            BodyDataTab.TREND to "Trend",
            BodyDataTab.HISTORY to "History",
        )
        TabRow(
            selectedTabIndex = selectedTab.ordinal,
            modifier = Modifier
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
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            },
        ) {
            tabs.forEach { tab ->
                Tab(
                    selected = tab == selectedTab,
                    onClick = { selectedTab = tab },
                    text = {
                        Text(
                            text = tabLabels[tab] ?: tab.name,
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

        // Tab content
        AnimatedContent(
            targetState = selectedTab,
            transitionSpec = {
                if (targetState.ordinal > initialState.ordinal) {
                    slideInHorizontally { it } togetherWith slideOutHorizontally { -it }
                } else {
                    slideInHorizontally { -it } togetherWith slideOutHorizontally { it }
                }
            },
            label = "bodydata_tab_transition",
        ) { tab ->
            when (tab) {
                BodyDataTab.TREND -> TrendTabContent(state = state)
                BodyDataTab.HISTORY -> HistoryTabContent(
                    state = state,
                    onEdit = onEditRecord,
                    onDelete = { viewModel.onEvent(BodyDataEvent.DeleteRecord(it)) },
                )
            }
        }
    }
}

/**
 * Header row.
 */
@Composable
private fun BodyDataHeader(
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = "Body Data",
            style = MaterialTheme.typography.titleLarge.copy(
                fontWeight = FontWeight.SemiBold,
            ),
            color = MaterialTheme.colorScheme.onSurface,
        )
    }
}

/**
 * Latest measurement card with weight and trend indicator.
 */
@Composable
private fun LatestDataCard(
    state: BodyDataUiState,
    onAddRecord: () -> Unit,
    modifier: Modifier = Modifier,
) {
    if (state.latestMeasurement == null) {
        // Empty state
        Box(
            modifier = modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            contentAlignment = Alignment.Center,
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "Record your first body measurement",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = onAddRecord,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary,
                    ),
                ) {
                    Text(
                        text = "+ Record Data",
                        style = MaterialTheme.typography.bodyLarge.copy(
                            fontWeight = FontWeight.SemiBold,
                        ),
                    )
                }
            }
        }
        return
    }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface,
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
        ) {
            Text(
                text = "Latest Data",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = formatMeasurementValue(
                        state.latestMeasurement.bodyWeight,
                        getMetricUnit(BodyMetric.WEIGHT),
                    ),
                    style = MaterialTheme.typography.headlineMedium.copy(
                        fontWeight = FontWeight.Bold,
                    ),
                    color = MaterialTheme.colorScheme.onSurface,
                )

                // Trend indicator
                val trend = computeWeightTrend(state.trendData)
                if (trend != null) {
                    val (change, isDecreasing) = trend
                    val trendColor = if (isDecreasing) TrendDownColor else TrendUpColor
                    val arrow = if (isDecreasing) "v" else "^"
                    Text(
                        text = "$arrow ${String.format("%.1f", change)}",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = FontWeight.Medium,
                        ),
                        color = trendColor,
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = formatSessionDate(state.latestMeasurement.recordDate),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(modifier = Modifier.height(12.dp))

            Button(
                onClick = onAddRecord,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(44.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                ),
            ) {
                Text(
                    text = "+ Record Data",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.SemiBold,
                    ),
                )
            }
        }
    }
}

/**
 * Trend tab content showing a line chart.
 */
@Composable
private fun TrendTabContent(
    state: BodyDataUiState,
    modifier: Modifier = Modifier,
) {
    if (state.trendData.isEmpty()) {
        EmptyDataState(message = "No trend data available")
        return
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 8.dp),
    ) {
        val chartData = state.trendData.mapNotNull { measurement ->
            measurement.bodyWeight?.let { weight ->
                com.trainrecorder.ui.components.LineChartDataPoint(
                    date = measurement.recordDate,
                    value = weight,
                    isPR = false,
                )
            }
        }

        if (chartData.isEmpty()) {
            EmptyDataState(message = "No weight data for trend chart")
        } else {
            LineChart(
                dataPoints = chartData,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(220.dp),
                label = "Weight (${getMetricUnit(state.selectedMetric)})",
            )
        }
    }
}

/**
 * History tab content listing all measurements.
 */
@Composable
private fun HistoryTabContent(
    state: BodyDataUiState,
    onEdit: (String) -> Unit,
    onDelete: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    if (state.trendData.isEmpty()) {
        EmptyDataState(message = "No measurement history")
        return
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        items(state.trendData.sortedByDescending { it.recordDate }, key = { it.id }) { measurement ->
            MeasurementCard(
                measurement = measurement,
                onEdit = { onEdit(measurement.id) },
                onDelete = { onDelete(measurement.id) },
            )
        }
        item { Spacer(modifier = Modifier.height(16.dp)) }
    }
}

/**
 * A single measurement card for the history list.
 */
@Composable
private fun MeasurementCard(
    measurement: BodyMeasurement,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface,
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
        ) {
            Text(
                text = formatSessionDate(measurement.recordDate),
                style = MaterialTheme.typography.bodyMedium.copy(
                    fontWeight = FontWeight.SemiBold,
                ),
                color = MaterialTheme.colorScheme.onSurface,
            )
            Spacer(modifier = Modifier.height(4.dp))

            // Show available measurements
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
            ) {
                MeasurementItem("Weight", measurement.bodyWeight, "kg")
                MeasurementItem("Chest", measurement.chest, "cm")
                MeasurementItem("Waist", measurement.waist, "cm")
            }

            Spacer(modifier = Modifier.height(8.dp))
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
 * Single measurement value display in a compact column.
 */
@Composable
private fun MeasurementItem(
    label: String,
    value: Double?,
    unit: String,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            text = formatMeasurementValue(value, unit),
            style = MaterialTheme.typography.bodyMedium.copy(
                fontWeight = FontWeight.Medium,
            ),
            color = MaterialTheme.colorScheme.onSurface,
        )
    }
}

/**
 * Empty data state placeholder.
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
private fun LoadingState(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        CircularProgressIndicator()
    }
}
