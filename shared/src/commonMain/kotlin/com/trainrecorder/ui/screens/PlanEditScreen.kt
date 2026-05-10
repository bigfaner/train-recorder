package com.trainrecorder.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp

/**
 * Plan edit/create screen state holder.
 * This is managed locally in the composable since it's form state,
 * not persisted through the ViewModel until save.
 */
data class PlanEditState(
    val planName: String = "",
    val planMode: PlanModeSelection = PlanModeSelection.INFINITE_LOOP,
    val scheduleMode: ScheduleModeSelection = ScheduleModeSelection.WEEKLY_FIXED,
    val selectedDays: Set<Int> = emptySet(),
    val intervalDays: Int = 1,
    val dayCount: Int = 1,
    val nameError: String? = null,
)

enum class PlanModeSelection(val label: String) {
    INFINITE_LOOP("Infinite Loop"),
    FIXED_CYCLE("Fixed Cycle"),
}

enum class ScheduleModeSelection(val label: String) {
    WEEKLY_FIXED("Fixed Days"),
    FIXED_INTERVAL("Interval"),
}

/**
 * The Plan Edit/Create screen.
 *
 * Form for creating or editing a training plan with:
 * - Plan name input
 * - Plan mode toggle (Infinite Loop / Fixed Cycle)
 * - Schedule mode toggle (Fixed Days / Interval)
 * - Day-of-week selection (for weekly_fixed)
 * - Interval stepper (for fixed_interval)
 * - Save button
 */
@Composable
fun PlanEditScreen(
    planId: String? = null, // null = create mode
    planName: String = "",
    planMode: PlanModeSelection = PlanModeSelection.INFINITE_LOOP,
    scheduleMode: ScheduleModeSelection = ScheduleModeSelection.WEEKLY_FIXED,
    onSave: (name: String, planMode: PlanModeSelection, scheduleMode: ScheduleModeSelection, selectedDays: Set<Int>, intervalDays: Int) -> Unit = { _, _, _, _, _ -> },
    onBack: () -> Unit = {},
    onEditDay: (dayIndex: Int) -> Unit = {},
    onAddDay: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    var currentName by remember { mutableStateOf(planName) }
    var currentPlanMode by remember { mutableStateOf(planMode) }
    var currentScheduleMode by remember { mutableStateOf(scheduleMode) }
    var selectedDays by remember { mutableStateOf<Set<Int>>(emptySet()) }
    var intervalDays by remember { mutableIntStateOf(1) }
    var dayCount by remember { mutableIntStateOf(1) }
    var nameError by remember { mutableStateOf<String?>(null) }

    val isCreateMode = planId == null

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        // Header
        PlanEditHeader(
            title = if (isCreateMode) "New Plan" else "Edit Plan",
            onBack = onBack,
        )

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            // Plan name
            item {
                Column {
                    Text(
                        text = "Plan Name",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = FontWeight.Medium,
                        ),
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = currentName,
                        onValueChange = { newName ->
                            currentName = newName
                            nameError = validatePlanName(newName)
                        },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = {
                            Text("e.g., Push/Pull/Legs Split")
                        },
                        isError = nameError != null,
                        supportingText = nameError?.let {
                            { Text(it, color = MaterialTheme.colorScheme.error) }
                        },
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                    )
                }
            }

            // Plan mode toggle
            item {
                Column {
                    Text(
                        text = "Plan Mode",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = FontWeight.Medium,
                        ),
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    SegmentedControl(
                        options = PlanModeSelection.entries.map { it.label },
                        selectedIndex = PlanModeSelection.entries.indexOf(currentPlanMode),
                        onSelected = { index ->
                            currentPlanMode = PlanModeSelection.entries[index]
                        },
                    )
                }
            }

            // Schedule mode toggle
            item {
                Column {
                    Text(
                        text = "Schedule Mode",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = FontWeight.Medium,
                        ),
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    SegmentedControl(
                        options = ScheduleModeSelection.entries.map { it.label },
                        selectedIndex = ScheduleModeSelection.entries.indexOf(currentScheduleMode),
                        onSelected = { index ->
                            currentScheduleMode = ScheduleModeSelection.entries[index]
                        },
                    )
                }
            }

            // Schedule configuration
            if (currentScheduleMode == ScheduleModeSelection.WEEKLY_FIXED) {
                // Day-of-week selection
                item {
                    Column {
                        Text(
                            text = "Training Days",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                fontWeight = FontWeight.Medium,
                            ),
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        DayOfWeekSelector(
                            selectedDays = selectedDays,
                            onDayToggle = { dayIndex ->
                                selectedDays = toggleDayOfWeek(selectedDays, dayIndex)
                            },
                        )

                        // Day assignments preview
                        if (selectedDays.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(12.dp))
                            SelectedDaysPreview(selectedDays = selectedDays)
                        }
                    }
                }
            } else {
                // Interval stepper
                item {
                    Column {
                        Text(
                            text = "Training Interval",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                fontWeight = FontWeight.Medium,
                            ),
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        IntervalStepper(
                            value = intervalDays,
                            onValueChange = { intervalDays = it },
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = formatIntervalDescription(intervalDays),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }

            // Training days section
            item {
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = "Training Days",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = FontWeight.Medium,
                        ),
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                    TextButton(onClick = onAddDay) {
                        Text("+ Add Day")
                    }
                }
            }

            // Day items
            items(dayCount) { index ->
                TrainingDayFormItem(
                    dayIndex = index,
                    dayName = "Day ${index + 1}",
                    onClick = { onEditDay(index) },
                )
            }

            // Save button
            item {
                Spacer(modifier = Modifier.height(8.dp))
                Button(
                    onClick = {
                        val error = validatePlanName(currentName)
                        if (error != null) {
                            nameError = error
                        } else {
                            onSave(
                                currentName,
                                currentPlanMode,
                                currentScheduleMode,
                                selectedDays,
                                intervalDays,
                            )
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary,
                    ),
                ) {
                    Text(
                        text = "Save Plan",
                        style = MaterialTheme.typography.bodyLarge.copy(
                            fontWeight = FontWeight.SemiBold,
                        ),
                    )
                }
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}

/**
 * Header with back button and title.
 */
@Composable
private fun PlanEditHeader(
    title: String,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        TextButton(onClick = onBack) {
            Text("< Back")
        }
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium.copy(
                fontWeight = FontWeight.SemiBold,
            ),
            color = MaterialTheme.colorScheme.onSurface,
        )
    }
}

/**
 * Segmented control for toggling between options.
 */
@Composable
private fun SegmentedControl(
    options: List<String>,
    selectedIndex: Int,
    onSelected: (index: Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .padding(2.dp),
        horizontalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        options.forEachIndexed { index, label ->
            val isSelected = index == selectedIndex
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(6.dp))
                    .background(
                        if (isSelected) MaterialTheme.colorScheme.primary
                        else Color.Transparent,
                    )
                    .clickable { onSelected(index) }
                    .padding(vertical = 10.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = label,
                    style = MaterialTheme.typography.bodySmall.copy(
                        fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                    ),
                    color = if (isSelected) MaterialTheme.colorScheme.onPrimary
                    else MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                )
            }
        }
    }
}

/**
 * Day-of-week selection buttons.
 */
@Composable
private fun DayOfWeekSelector(
    selectedDays: Set<Int>,
    onDayToggle: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        DAY_OF_WEEK_LABELS.forEachIndexed { index, label ->
            val isSelected = index in selectedDays
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(8.dp))
                    .background(
                        if (isSelected) MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)
                        else MaterialTheme.colorScheme.surfaceVariant,
                    )
                    .border(
                        width = if (isSelected) 1.dp else 0.dp,
                        color = if (isSelected) MaterialTheme.colorScheme.primary
                        else Color.Transparent,
                        shape = RoundedCornerShape(8.dp),
                    )
                    .clickable { onDayToggle(index) }
                    .padding(vertical = 10.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = label,
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                    ),
                    color = if (isSelected) MaterialTheme.colorScheme.primary
                    else MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                )
            }
        }
    }
}

/**
 * Preview showing selected day assignments.
 */
@Composable
private fun SelectedDaysPreview(
    selectedDays: Set<Int>,
    modifier: Modifier = Modifier,
) {
    val sortedDays = selectedDays.sorted()
    Column(modifier = modifier) {
        sortedDays.forEach { dayIndex ->
            Text(
                text = "${DAY_OF_WEEK_LABELS[dayIndex]}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

/**
 * Interval stepper for fixed interval mode.
 */
@Composable
private fun IntervalStepper(
    value: Int,
    onValueChange: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = "Rest",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface,
        )
        Spacer(modifier = Modifier.width(12.dp))

        // Minus button
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(8.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant)
                .clickable(enabled = value > 0) { onValueChange(value - 1) }
                .padding(horizontal = 16.dp, vertical = 8.dp),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = "-",
                style = MaterialTheme.typography.titleMedium,
                color = if (value > 0) MaterialTheme.colorScheme.onSurface
                else MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }

        Spacer(modifier = Modifier.width(12.dp))

        // Value display
        Text(
            text = "$value",
            style = MaterialTheme.typography.titleMedium.copy(
                fontWeight = FontWeight.SemiBold,
            ),
            color = MaterialTheme.colorScheme.onSurface,
        )

        Spacer(modifier = Modifier.width(12.dp))

        // Plus button
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(8.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant)
                .clickable { onValueChange(value + 1) }
                .padding(horizontal = 16.dp, vertical = 8.dp),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = "+",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface,
            )
        }

        Spacer(modifier = Modifier.width(8.dp))

        Text(
            text = "days",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface,
        )
    }
}

/**
 * A training day form item in the plan editor.
 */
@Composable
private fun TrainingDayFormItem(
    dayIndex: Int,
    dayName: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface,
        ),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = dayName,
                style = MaterialTheme.typography.bodyMedium.copy(
                    fontWeight = FontWeight.Medium,
                ),
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.weight(1f),
            )
            Text(
                text = "Tap to edit >",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
