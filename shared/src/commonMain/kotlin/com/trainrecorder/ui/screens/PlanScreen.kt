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
import androidx.compose.material3.MaterialTheme
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
import com.trainrecorder.domain.model.TrainingType
import com.trainrecorder.domain.repository.PlanWithDays
import com.trainrecorder.viewmodel.PlanEvent
import com.trainrecorder.viewmodel.PlanUiState
import com.trainrecorder.viewmodel.PlanViewModel

/**
 * The Plan Management screen (UF-3, Tab 2).
 *
 * Displays the active plan with training day cards,
 * and provides navigation to create/edit plans.
 */
@Composable
fun PlanScreen(
    viewModel: PlanViewModel,
    onCreatePlan: () -> Unit = {},
    onEditPlan: (planId: String) -> Unit = {},
    onEditDay: (planId: String, dayId: String) -> Unit = { _, _ -> },
    modifier: Modifier = Modifier,
) {
    val state by viewModel.state.collectAsState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        // Navigation header
        PlanScreenHeader()

        if (!state.isLoaded) {
            PlanLoadingState()
        } else if (state.activePlan == null && state.allPlans.isEmpty()) {
            PlanEmptyState(onCreatePlan = onCreatePlan)
        } else {
            PlanContent(
                state = state,
                onCreatePlan = onCreatePlan,
                onEditPlan = onEditPlan,
                onEditDay = { dayId ->
                    state.activePlan?.let { onEditDay(it.plan.id, dayId) }
                },
                onActivatePlan = { planId ->
                    viewModel.onEvent(PlanEvent.ActivatePlan(planId))
                },
                onDeletePlan = { planId ->
                    viewModel.onEvent(PlanEvent.DeletePlan(planId))
                },
            )
        }
    }
}

/**
 * Header row with title.
 */
@Composable
private fun PlanScreenHeader(
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = "Training Plans",
            style = MaterialTheme.typography.titleLarge.copy(
                fontWeight = FontWeight.SemiBold,
            ),
            color = MaterialTheme.colorScheme.onSurface,
        )
    }
}

/**
 * Empty state when no plans exist.
 */
@Composable
private fun PlanEmptyState(
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
                text = "No training plans yet",
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
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            )
            Spacer(modifier = Modifier.height(24.dp))
            Button(
                onClick = onCreatePlan,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
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
 * Main content when plans exist.
 */
@Composable
private fun PlanContent(
    state: PlanUiState,
    onCreatePlan: () -> Unit,
    onEditPlan: (planId: String) -> Unit,
    onEditDay: (dayId: String) -> Unit,
    onActivatePlan: (planId: String) -> Unit,
    onDeletePlan: (planId: String) -> Unit,
    modifier: Modifier = Modifier,
) {
    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        // Active plan card
        if (state.activePlan != null) {
            item {
                ActivePlanCard(
                    planWithDays = state.activePlan,
                    onEditPlan = { onEditPlan(state.activePlan.plan.id) },
                    onEditDay = { dayId ->
                        onEditDay(dayId)
                    },
                )
            }
        }

        // Create new plan button
        item {
            Button(
                onClick = onCreatePlan,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                ),
            ) {
                Text(
                    text = "+ New Plan",
                    style = MaterialTheme.typography.bodyLarge.copy(
                        fontWeight = FontWeight.SemiBold,
                    ),
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
        }

        // Other plans list
        val inactivePlans = state.allPlans.filter { !it.isActive }
        if (inactivePlans.isNotEmpty()) {
            item {
                Text(
                    text = "Other Plans",
                    style = MaterialTheme.typography.titleSmall.copy(
                        fontWeight = FontWeight.SemiBold,
                    ),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(modifier = Modifier.height(4.dp))
            }
            items(inactivePlans, key = { it.id }) { plan ->
                InactivePlanCard(
                    planName = plan.displayName,
                    planMode = planModeLabel(plan.planMode),
                    onActivate = { onActivatePlan(plan.id) },
                    onDelete = { onDeletePlan(plan.id) },
                )
            }
        }

        // Bottom spacing
        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

/**
 * Card showing the active plan with its training days.
 */
@Composable
private fun ActivePlanCard(
    planWithDays: PlanWithDays,
    onEditPlan: () -> Unit,
    onEditDay: (dayId: String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val plan = planWithDays.plan
    val typeColor = TrainingTypeColor.PUSH.toComposeColor()

    Card(
        modifier = modifier
            .fillMaxWidth()
            .border(
                width = 2.dp,
                color = MaterialTheme.colorScheme.primary,
                shape = RoundedCornerShape(16.dp),
            ),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface,
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
            // Plan name and status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = plan.displayName,
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.SemiBold,
                    ),
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f),
                )
                Spacer(modifier = Modifier.width(8.dp))
                // Active indicator
                Box(
                    modifier = Modifier
                        .background(
                            color = Color(0xFF30D158).copy(alpha = 0.15f),
                            shape = RoundedCornerShape(4.dp),
                        )
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                ) {
                    Text(
                        text = planStatusText(plan),
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.SemiBold,
                        ),
                        color = Color(0xFF30D158),
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Plan mode and schedule info
            Text(
                text = "${planModeLabel(plan.planMode)} - ${scheduleModeLabel(plan.scheduleMode)}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Training day cards
            planWithDays.days.forEach { dayWithExercises ->
                TrainingDayCard(
                    dayName = dayWithExercises.day.displayName,
                    dayType = dayWithExercises.day.dayType,
                    exerciseSummary = formatDaySummary(
                        dayWithExercises.exercises,
                    ) { exercise ->
                        val summary = formatExerciseSummary(exercise)
                        // We use exerciseId as placeholder for exercise name display
                        // In real app, we'd resolve exerciseId to display name
                        summary
                    },
                    onClick = { onEditDay(dayWithExercises.day.id) },
                )
                Spacer(modifier = Modifier.height(8.dp))
            }

            // Edit plan button
            TextButton(
                onClick = onEditPlan,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Edit Plan")
            }
        }
    }
}

/**
 * A training day card within the active plan.
 */
@Composable
private fun TrainingDayCard(
    dayName: String,
    dayType: TrainingType,
    exerciseSummary: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val typeColor = TrainingTypeColor.fromTrainingType(dayType).toComposeColor()

    Card(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        ),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Training type indicator
            Box(
                modifier = Modifier
                    .background(typeColor.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                    .padding(horizontal = 8.dp, vertical = 4.dp),
            ) {
                Text(
                    text = trainingTypeLabel(dayType),
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = FontWeight.SemiBold,
                    ),
                    color = typeColor,
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = dayName,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.Medium,
                    ),
                    color = MaterialTheme.colorScheme.onSurface,
                )
                if (exerciseSummary.isNotBlank()) {
                    Text(
                        text = exerciseSummary,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
        }
    }
}

/**
 * Card for an inactive plan in the list.
 */
@Composable
private fun InactivePlanCard(
    planName: String,
    planMode: String,
    onActivate: () -> Unit,
    onDelete: () -> Unit,
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
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = planName,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.Medium,
                    ),
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Text(
                    text = planMode,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            TextButton(onClick = onActivate) {
                Text("Activate")
            }
            TextButton(onClick = onDelete) {
                Text(
                    text = "Delete",
                    color = MaterialTheme.colorScheme.error,
                )
            }
        }
    }
}

/**
 * Loading state placeholder.
 */
@Composable
private fun PlanLoadingState(modifier: Modifier = Modifier) {
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
