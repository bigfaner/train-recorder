package com.trainrecorder.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.trainrecorder.domain.model.TrainingType
import com.trainrecorder.domain.model.WorkoutStatus
import com.trainrecorder.domain.usecase.DayType
import com.trainrecorder.domain.usecase.ScheduleDay
import com.trainrecorder.viewmodel.CalendarEvent
import com.trainrecorder.viewmodel.CalendarUiState
import com.trainrecorder.viewmodel.CalendarViewModel
import com.trainrecorder.viewmodel.TodaySummary
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.todayIn

/**
 * The Calendar screen (UF-1, Tab 1).
 *
 * Displays a month-view calendar grid with training type color bars,
 * date selection, filter chips, and a bottom summary card.
 */
@Composable
fun CalendarScreen(
    viewModel: CalendarViewModel,
    onStartWorkout: (date: LocalDate) -> Unit = {},
    onRecordOtherSport: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val state by viewModel.state.collectAsState()
    val selectedDate by viewModel.selectedDate.collectAsState()
    var filterType by remember { mutableStateOf<TrainingType?>(null) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        // Month navigation header
        MonthNavigationHeader(
            currentMonth = state.month,
            onPreviousMonth = {
                val prev = state.month.minus(1)
                viewModel.onEvent(CalendarEvent.ChangeMonth(prev))
            },
            onNextMonth = {
                val next = state.month.plus(1)
                viewModel.onEvent(CalendarEvent.ChangeMonth(next))
            },
            onTodayClick = {
                val todayDate = Clock.System.todayIn(TimeZone.currentSystemDefault())
                viewModel.onEvent(CalendarEvent.ChangeMonth(
                    com.trainrecorder.viewmodel.YearMonth.from(todayDate),
                ))
            },
        )

        // Filter chips
        val filteredDays = remember(state.scheduleDays, filterType) {
            filterByTrainingType(state.scheduleDays, filterType)
        }
        val filterChipData = remember(state.scheduleDays, filterType) {
            getFilterChips(state.scheduleDays, filterType)
        }

        if (filterChipData.isNotEmpty()) {
            FilterChipRow(
                chips = filterChipData,
                onChipSelected = { type ->
                    filterType = if (filterType == type) null else type
                },
            )
        }

        // Calendar grid or empty state
        if (!state.isLoaded) {
            LoadingState()
        } else if (state.scheduleDays.isEmpty()) {
            EmptyCalendarState(
                onCreatePlan = { /* Navigate to plan creation */ },
            )
        } else {
            CalendarGrid(
                state = state,
                selectedDate = selectedDate,
                filteredDays = filteredDays,
                filterType = filterType,
                onSelectDate = { viewModel.onEvent(CalendarEvent.SelectDate(it)) },
                onSwipeLeft = {
                    val next = state.month.plus(1)
                    viewModel.onEvent(CalendarEvent.ChangeMonth(next))
                },
                onSwipeRight = {
                    val prev = state.month.minus(1)
                    viewModel.onEvent(CalendarEvent.ChangeMonth(prev))
                },
            )
        }

        // Bottom summary card
        val summaryDate = selectedDate ?: state.scheduleDays.firstOrNull { it.isToday }?.date
        val summaryDay = summaryDate?.let { date ->
            state.scheduleDays.find { it.date == date }
        }
        if (summaryDay != null && state.isLoaded) {
            TodaySummaryCard(
                scheduleDay = summaryDay,
                onStartWorkout = { date -> onStartWorkout(date) },
                onRecordOtherSport = onRecordOtherSport,
            )
        }
    }
}

/**
 * Month navigation header with previous/next buttons and today button.
 */
@Composable
private fun MonthNavigationHeader(
    currentMonth: com.trainrecorder.viewmodel.YearMonth,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit,
    onTodayClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Previous month button
        TextButton(onClick = onPreviousMonth) {
            Text(
                text = "<",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.primary,
            )
        }

        // Month title
        Text(
            text = formatMonthYear(currentMonth.year, currentMonth.monthNumber),
            style = MaterialTheme.typography.titleMedium.copy(
                fontWeight = FontWeight.SemiBold,
            ),
            color = MaterialTheme.colorScheme.onSurface,
        )

        // Next month button
        TextButton(onClick = onNextMonth) {
            Text(
                text = ">",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.primary,
            )
        }

        Spacer(modifier = Modifier.width(8.dp))

        // Today button
        TextButton(onClick = onTodayClick) {
            Text(
                text = "Today",
                style = MaterialTheme.typography.bodySmall.copy(
                    fontWeight = FontWeight.Medium,
                ),
                color = MaterialTheme.colorScheme.primary,
            )
        }
    }
}

/**
 * Row of filter chips for training type filtering.
 */
@Composable
private fun FilterChipRow(
    chips: List<FilterChipState>,
    onChipSelected: (TrainingType) -> Unit,
    modifier: Modifier = Modifier,
) {
    LazyRow(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        items(chips) { chip ->
            val color = TrainingTypeColor.fromTrainingType(chip.trainingType).toComposeColor()
            FilterChip(
                selected = chip.isSelected,
                onClick = { onChipSelected(chip.trainingType) },
                label = {
                    Text(
                        text = chip.label,
                        style = MaterialTheme.typography.labelSmall,
                    )
                },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = color.copy(alpha = 0.15f),
                    selectedLabelColor = color,
                ),
                shape = RoundedCornerShape(50),
                border = null,
            )
        }
    }
}

/**
 * Calendar grid with swipe gesture support.
 */
@Composable
private fun CalendarGrid(
    state: CalendarUiState,
    selectedDate: LocalDate?,
    filteredDays: List<ScheduleDay>,
    filterType: TrainingType?,
    onSelectDate: (LocalDate) -> Unit,
    onSwipeLeft: () -> Unit,
    onSwipeRight: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val gridRows = remember(state.month, state.scheduleDays) {
        computeCalendarGrid(
            state.month.year,
            state.month.monthNumber,
            state.scheduleDays,
        )
    }

    // Filtered dates set for highlighting
    val filteredDates = remember(filteredDays) {
        filteredDays.map { it.date }.toSet()
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            // Swipe gesture for month navigation
            .pointerInput(state.month) {
                detectHorizontalDragGestures { _, dragAmount ->
                    if (dragAmount < -50f) onSwipeLeft()
                    if (dragAmount > 50f) onSwipeRight()
                }
            },
    ) {
        // Day-of-week headers
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly,
        ) {
            DAY_OF_WEEK_HEADERS.forEach { header ->
                Text(
                    text = header,
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = FontWeight.Medium,
                    ),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.weight(1f),
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Grid rows
        gridRows.forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
            ) {
                row.forEach { cell ->
                    val isSelected = cell.date == selectedDate
                    val isHighlighted = filterType == null || cell.date in filteredDates

                    CalendarDayCell(
                        cell = cell,
                        isSelected = isSelected,
                        isHighlighted = isHighlighted,
                        filterType = filterType,
                        onClick = { onSelectDate(cell.date) },
                        modifier = Modifier.weight(1f),
                    )
                }
            }
            Spacer(modifier = Modifier.height(4.dp))
        }
    }
}

/**
 * A single day cell in the calendar grid.
 */
@Composable
private fun CalendarDayCell(
    cell: CalendarGridCell,
    isSelected: Boolean,
    isHighlighted: Boolean,
    filterType: TrainingType?,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val day = cell.scheduleDay
    val isToday = day?.isToday == true
    val status = getDayStatus(day)
    val hasBar = hasTrainingBar(day)
    val barColor = getTrainingColor(day).toComposeColor()
    val isCompleted = status == "completed"
    val isSkipped = status == "skipped"

    Column(
        modifier = modifier
            .size(44.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(
                when {
                    isSelected && !isToday -> MaterialTheme.colorScheme.primaryContainer
                    isToday -> MaterialTheme.colorScheme.primary
                    !isHighlighted -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                    else -> Color.Transparent
                },
            )
            .clickable(enabled = cell.isCurrentMonth) { onClick() },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Box {
            // Date number
            Text(
                text = if (cell.isCurrentMonth) "${cell.date.dayOfMonth}" else "",
                style = MaterialTheme.typography.bodySmall.copy(
                    fontWeight = if (isToday || isSelected) FontWeight.Bold else FontWeight.Normal,
                ),
                color = when {
                    isToday -> MaterialTheme.colorScheme.onPrimary
                    isSelected -> MaterialTheme.colorScheme.onPrimaryContainer
                    !cell.isCurrentMonth -> MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f)
                    !isHighlighted -> MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f)
                    else -> MaterialTheme.colorScheme.onSurface
                },
                textAlign = TextAlign.Center,
            )

            // Completed checkmark (top-right corner)
            if (isCompleted) {
                Text(
                    text = "v",
                    fontSize = 8.sp,
                    color = SuccessColor,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(end = 2.dp),
                )
            }
        }

        // Training type color bar at bottom
        if (hasBar && cell.isCurrentMonth) {
            Spacer(modifier = Modifier.height(2.dp))
            Box(
                modifier = Modifier
                    .width(16.dp)
                    .height(4.dp)
                    .background(
                        color = if (isSkipped) barColor.copy(alpha = 0.5f) else barColor,
                        shape = RoundedCornerShape(2.dp),
                    ),
            )
            // Draw dashed border for skipped
            if (isSkipped) {
                Box(
                    modifier = Modifier
                        .width(16.dp)
                        .height(4.dp)
                        .drawDashedBorder(barColor),
                )
            }
        } else {
            Spacer(modifier = Modifier.height(6.dp))
        }
    }
}

/**
 * Bottom card showing the selected/today day's workout summary.
 */
@Composable
private fun TodaySummaryCard(
    scheduleDay: ScheduleDay,
    onStartWorkout: (LocalDate) -> Unit,
    onRecordOtherSport: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val status = getDayStatus(scheduleDay)

    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface,
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = 4.dp,
        ),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
        ) {
            // Handle bar
            Box(
                modifier = Modifier
                    .align(Alignment.CenterHorizontally)
                    .width(36.dp)
                    .height(4.dp)
                    .background(
                        MaterialTheme.colorScheme.outlineVariant,
                        RoundedCornerShape(2.dp),
                    ),
            )

            Spacer(modifier = Modifier.height(12.dp))

            if (status == "rest") {
                // Rest day
                Text(
                    text = "Rest Day",
                    style = MaterialTheme.typography.titleSmall.copy(
                        fontWeight = FontWeight.SemiBold,
                    ),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "No training scheduled for today",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(modifier = Modifier.height(12.dp))
                TextButton(
                    onClick = onRecordOtherSport,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Record Other Sport")
                }
            } else if (status == "completed") {
                // Completed workout
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    val typeColor = getTrainingColor(scheduleDay).toComposeColor()
                    Box(
                        modifier = Modifier
                            .background(typeColor.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp),
                    ) {
                        Text(
                            text = scheduleDay.trainingDay?.displayName ?: "Workout",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.SemiBold,
                            ),
                            color = typeColor,
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Completed",
                        style = MaterialTheme.typography.labelSmall,
                        color = SuccessColor,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
            } else {
                // Planned workout or in-progress
                val typeColor = getTrainingColor(scheduleDay).toComposeColor()

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Box(
                        modifier = Modifier
                            .background(typeColor.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp),
                    ) {
                        Text(
                            text = scheduleDay.trainingDay?.displayName ?: "Workout",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.SemiBold,
                            ),
                            color = typeColor,
                        )
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                // Exercises summary
                Text(
                    text = scheduleDay.trainingDay?.displayName ?: "",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Start Workout button
                androidx.compose.material3.Button(
                    onClick = { onStartWorkout(scheduleDay.date) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary,
                    ),
                ) {
                    Text(
                        text = "Start Workout",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = FontWeight.SemiBold,
                        ),
                    )
                }
            }
        }
    }
}

/**
 * Empty state shown when no plan is active.
 */
@Composable
private fun EmptyCalendarState(
    onCreatePlan: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 32.dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = "No active training plan",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.SemiBold,
                ),
                color = MaterialTheme.colorScheme.onSurface,
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Create your first training plan to get started",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )
            Spacer(modifier = Modifier.height(24.dp))
            androidx.compose.material3.Button(
                onClick = onCreatePlan,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                ),
            ) {
                Text(
                    text = "Create Training Plan",
                    style = MaterialTheme.typography.bodyLarge.copy(
                        fontWeight = FontWeight.SemiBold,
                    ),
                )
            }
        }
    }
}

/**
 * Loading state placeholder.
 */
@Composable
private fun LoadingState(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        androidx.compose.material3.CircularProgressIndicator()
    }
}

/**
 * Convert TrainingTypeColor to Compose Color.
 */
private fun TrainingTypeColor.toComposeColor(): Color = Color(hex.toLong())

/**
 * Success green color for completed state markers.
 */
private val SuccessColor = Color(0xFF30D158)

/**
 * Draw a dashed border around the box.
 */
private fun Modifier.drawDashedBorder(color: Color): Modifier = this.drawBehind {
    drawDashedRect(
        color = color,
        strokeWidth = 1f,
        dashLength = 3f,
        gapLength = 2f,
        cornerRadius = 2.dp.toPx(),
    )
}

private fun DrawScope.drawDashedRect(
    color: Color,
    strokeWidth: Float,
    dashLength: Float,
    gapLength: Float,
    cornerRadius: Float,
) {
    val width = size.width
    val height = size.height

    drawPath(
        path = androidx.compose.ui.graphics.Path().apply {
            addRoundRect(
                androidx.compose.ui.geometry.RoundRect(
                    left = 0f,
                    top = 0f,
                    right = width,
                    bottom = height,
                    cornerRadius = CornerRadius(cornerRadius),
                ),
            )
        },
        color = color,
        style = Stroke(
            width = strokeWidth,
            pathEffect = PathEffect.dashPathEffect(floatArrayOf(dashLength, gapLength)),
        ),
    )
}
