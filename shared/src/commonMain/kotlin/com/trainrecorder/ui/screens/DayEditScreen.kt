package com.trainrecorder.ui.screens

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
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
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

/**
 * Training day exercise item for the day edit form.
 */
data class DayExerciseItem(
    val id: String,
    val exerciseId: String,
    val exerciseName: String,
    val exerciseMode: com.trainrecorder.domain.model.ExerciseMode,
    val targetSets: Int,
    val targetReps: Int,
    val startWeight: Double?,
    val weightIncrement: Double,
    val restSeconds: Int,
    val orderIndex: Int,
)

/**
 * The Day Edit screen for editing a training day within a plan.
 *
 * Provides:
 * - Training type selector (Push/Pull/Legs/Other)
 * - Exercise list with mode, sets, reps, weight
 * - Add exercise button (opens exercise picker)
 * - Fixed mode: uniform sets/reps/weight fields
 * - Custom mode: per-set configuration fields
 * - Save button
 */
@Composable
fun DayEditScreen(
    dayName: String = "Day 1",
    dayType: com.trainrecorder.domain.model.TrainingType = com.trainrecorder.domain.model.TrainingType.PUSH,
    exercises: List<DayExerciseItem> = emptyList(),
    onSave: (displayName: String, dayType: com.trainrecorder.domain.model.TrainingType, exercises: List<DayExerciseItem>) -> Unit = { _, _, _ -> },
    onBack: () -> Unit = {},
    onAddExercise: () -> Unit = {},
    onRemoveExercise: (exerciseId: String) -> Unit = {},
    onEditExercise: (exerciseId: String) -> Unit = {},
    modifier: Modifier = Modifier,
) {
    var currentName by remember { mutableStateOf(dayName) }
    var currentType by remember { mutableStateOf(dayType) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        // Header
        DayEditHeader(
            title = currentName,
            onBack = onBack,
        )

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            // Day name
            item {
                Column {
                    Text(
                        text = "Day Name",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = FontWeight.Medium,
                        ),
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = currentName,
                        onValueChange = { currentName = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("e.g., Push Day") },
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                    )
                }
            }

            // Training type selector
            item {
                Column {
                    Text(
                        text = "Training Type",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = FontWeight.Medium,
                        ),
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    TrainingTypeSelector(
                        selectedType = currentType,
                        onTypeSelected = { currentType = it },
                    )
                }
            }

            // Exercise list header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = "Exercises",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = FontWeight.Medium,
                        ),
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                    if (exercises.isNotEmpty()) {
                        Text(
                            text = "${exercises.size} exercises",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }

            // Exercise cards
            if (exercises.isEmpty()) {
                item {
                    EmptyExercisesState(onAddExercise = onAddExercise)
                }
            } else {
                items(exercises, key = { it.id }) { exercise ->
                    ExerciseCard(
                        exercise = exercise,
                        onRemove = { onRemoveExercise(exercise.id) },
                        onEdit = { onEditExercise(exercise.id) },
                    )
                }

                // Add exercise button
                item {
                    TextButton(
                        onClick = onAddExercise,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("+ Add from Exercise Library")
                    }
                }
            }

            // Save button
            item {
                Spacer(modifier = Modifier.height(8.dp))
                Button(
                    onClick = {
                        onSave(currentName, currentType, exercises)
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
                        text = "Save",
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
 * Header with back button and day title.
 */
@Composable
private fun DayEditHeader(
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
 * Training type selector with push/pull/legs/other buttons.
 */
@Composable
private fun TrainingTypeSelector(
    selectedType: com.trainrecorder.domain.model.TrainingType,
    onTypeSelected: (com.trainrecorder.domain.model.TrainingType) -> Unit,
    modifier: Modifier = Modifier,
) {
    val types = listOf(
        com.trainrecorder.domain.model.TrainingType.PUSH,
        com.trainrecorder.domain.model.TrainingType.PULL,
        com.trainrecorder.domain.model.TrainingType.LEGS,
        com.trainrecorder.domain.model.TrainingType.OTHER,
    )

    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        types.forEach { type ->
            val isSelected = type == selectedType
            val typeColor = TrainingTypeColor.fromTrainingType(type).toComposeColor()

            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(8.dp))
                    .background(
                        if (isSelected) typeColor.copy(alpha = 0.15f)
                        else MaterialTheme.colorScheme.surfaceVariant,
                    )
                    .clickable { onTypeSelected(type) }
                    .padding(vertical = 10.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = trainingTypeLabel(type),
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                    ),
                    color = if (isSelected) typeColor
                    else MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

/**
 * Card for a single exercise in the training day editor.
 * Shows exercise name, mode, sets/reps, weight increment, rest, and delete.
 */
@Composable
private fun ExerciseCard(
    exercise: DayExerciseItem,
    onRemove: () -> Unit,
    onEdit: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onEdit),
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
            // Exercise name and mode
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = exercise.exerciseName,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.Medium,
                    ),
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.weight(1f),
                )

                // Mode tag
                Box(
                    modifier = Modifier
                        .background(
                            MaterialTheme.colorScheme.surfaceVariant,
                            RoundedCornerShape(4.dp),
                        )
                        .padding(horizontal = 6.dp, vertical = 2.dp),
                ) {
                    Text(
                        text = exerciseModeLabel(exercise.exerciseMode),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }

                Spacer(modifier = Modifier.width(8.dp))

                // Remove button
                TextButton(onClick = onRemove) {
                    Text("x", color = MaterialTheme.colorScheme.error)
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Exercise details
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                // Sets x Reps
                Text(
                    text = formatExerciseSummary(
                        com.trainrecorder.domain.model.TrainingDayExercise(
                            id = exercise.id,
                            trainingDayId = "",
                            exerciseId = exercise.exerciseId,
                            orderIndex = exercise.orderIndex,
                            exerciseMode = exercise.exerciseMode,
                            targetSets = exercise.targetSets,
                            targetReps = exercise.targetReps,
                            startWeight = exercise.startWeight,
                            note = null,
                            restSeconds = exercise.restSeconds,
                            weightIncrement = exercise.weightIncrement,
                            createdAt = kotlinx.datetime.Clock.System.now(),
                            updatedAt = kotlinx.datetime.Clock.System.now(),
                        ),
                    ),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )

                // Weight increment
                if (exercise.startWeight != null) {
                    Text(
                        text = "${exercise.startWeight}kg",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }

                // Increment
                Text(
                    text = "+${exercise.weightIncrement}kg",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary,
                )

                // Rest time
                Text(
                    text = "Rest ${exercise.restSeconds}s",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

/**
 * Empty state when no exercises are added yet.
 */
@Composable
private fun EmptyExercisesState(
    onAddExercise: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        ),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = "No exercises added yet",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(modifier = Modifier.height(12.dp))
            Button(
                onClick = onAddExercise,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                ),
            ) {
                Text("+ Add from Exercise Library")
            }
        }
    }
}

/**
 * Convert TrainingTypeColor to Compose Color.
 */
private fun TrainingTypeColor.toComposeColor(): Color = Color(hex.toLong())
