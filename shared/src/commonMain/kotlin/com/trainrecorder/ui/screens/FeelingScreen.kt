package com.trainrecorder.ui.screens

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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.trainrecorder.viewmodel.ExerciseFeelingUi
import com.trainrecorder.viewmodel.FeelingEvent
import com.trainrecorder.viewmodel.FeelingUiState
import com.trainrecorder.viewmodel.FeelingViewModel

private val WarningColor = Color(0xFFFF9500)

/**
 * The Feeling screen (UF-8, push after workout).
 *
 * Displays fatigue/satisfaction sliders (1-10 scale), per-exercise notes,
 * and a save button. Shows a high-fatigue warning when fatigue >= 8
 * and satisfaction <= 4.
 */
@Composable
fun FeelingScreen(
    viewModel: FeelingViewModel,
    onSaveComplete: () -> Unit = {},
    onSkip: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val state by viewModel.state.collectAsState()

    if (!state.isLoaded) {
        LoadingState()
        return
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        // Header: workout complete summary
        FeelingHeader(state)

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            // Fatigue slider
            item {
                SliderSection(
                    label = "Fatigue",
                    value = state.fatigue,
                    valueRange = 1f..10f,
                    leftLabel = FATIGUE_LABELS.first,
                    rightLabel = FATIGUE_LABELS.second,
                    onValueChange = { viewModel.onEvent(FeelingEvent.SetFatigue(it.toInt())) },
                )
            }

            // Satisfaction slider
            item {
                SliderSection(
                    label = "Satisfaction",
                    value = state.satisfaction,
                    valueRange = 1f..10f,
                    leftLabel = SATISFACTION_LABELS.first,
                    rightLabel = SATISFACTION_LABELS.second,
                    onValueChange = { viewModel.onEvent(FeelingEvent.SetSatisfaction(it.toInt())) },
                )
            }

            // High fatigue warning
            if (state.showHighFatigueWarning) {
                item {
                    HighFatigueWarning()
                }
            }

            // Exercise notes
            if (state.exerciseFeelings.isNotEmpty()) {
                item {
                    Text(
                        text = "Exercise Notes",
                        style = MaterialTheme.typography.titleSmall.copy(
                            fontWeight = FontWeight.SemiBold,
                        ),
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                }

                items(state.exerciseFeelings, key = { it.exerciseId }) { feeling ->
                    ExerciseNoteCard(
                        feeling = feeling,
                        onNotesChange = { notes ->
                            viewModel.onEvent(FeelingEvent.SetExerciseNotes(feeling.exerciseId, notes))
                        },
                    )
                }
            }

            // Overall notes
            item {
                Text(
                    text = "Overall Notes",
                    style = MaterialTheme.typography.titleSmall.copy(
                        fontWeight = FontWeight.SemiBold,
                    ),
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Spacer(modifier = Modifier.height(4.dp))
                OutlinedTextField(
                    value = state.notes ?: "",
                    onValueChange = { viewModel.onEvent(FeelingEvent.SetNotes(it)) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(80.dp),
                    placeholder = {
                        Text(
                            text = "Any additional notes...",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    },
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        unfocusedBorderColor = Color.Transparent,
                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                    ),
                )
            }

            // Save button
            item {
                Spacer(modifier = Modifier.height(8.dp))
                Button(
                    onClick = { viewModel.onEvent(FeelingEvent.Save) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary,
                    ),
                    enabled = !state.isSaving,
                ) {
                    Text(
                        text = if (state.isSaving) "Saving..." else "Save",
                        style = MaterialTheme.typography.bodyLarge.copy(
                            fontWeight = FontWeight.SemiBold,
                        ),
                    )
                }

                // Skip button
                Spacer(modifier = Modifier.height(8.dp))
                Button(
                    onClick = onSkip,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.Transparent,
                        contentColor = MaterialTheme.colorScheme.primary,
                    ),
                ) {
                    Text("Skip")
                }
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}

/**
 * Header showing workout completion summary.
 */
@Composable
private fun FeelingHeader(
    state: FeelingUiState,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
    ) {
        Text(
            text = "Workout Complete!",
            style = MaterialTheme.typography.titleLarge.copy(
                fontWeight = FontWeight.Bold,
            ),
            color = MaterialTheme.colorScheme.onSurface,
        )
        if (state.trainingSummary != null) {
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Total volume: ${formatVolume(state.trainingSummary.totalVolume)}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

/**
 * Slider section with label and value display.
 */
@Composable
private fun SliderSection(
    label: String,
    value: Int,
    valueRange: ClosedFloatingPointRange<Float>,
    leftLabel: String,
    rightLabel: String,
    onValueChange: (Float) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.titleSmall.copy(
                    fontWeight = FontWeight.SemiBold,
                ),
                color = MaterialTheme.colorScheme.onSurface,
            )
            Text(
                text = "$value",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                ),
                color = MaterialTheme.colorScheme.primary,
            )
        }
        Slider(
            value = value.toFloat(),
            onValueChange = onValueChange,
            valueRange = valueRange,
            steps = (valueRange.endInclusive.toInt() - valueRange.start.toInt() - 1),
            modifier = Modifier.fillMaxWidth(),
            colors = SliderDefaults.colors(
                activeTrackColor = MaterialTheme.colorScheme.primary,
                thumbColor = MaterialTheme.colorScheme.primary,
            ),
        )
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(
                text = leftLabel,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                text = rightLabel,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

/**
 * High fatigue warning banner.
 */
@Composable
private fun HighFatigueWarning(
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(WarningColor.copy(alpha = 0.15f))
            .padding(12.dp),
    ) {
        Text(
            text = "Consider reducing intensity next session",
            style = MaterialTheme.typography.bodyMedium.copy(
                fontWeight = FontWeight.Medium,
            ),
            color = WarningColor,
        )
    }
}

/**
 * Exercise note card with text input.
 */
@Composable
private fun ExerciseNoteCard(
    feeling: ExerciseFeelingUi,
    onNotesChange: (String) -> Unit,
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
                .padding(12.dp),
        ) {
            Text(
                text = feeling.exerciseName,
                style = MaterialTheme.typography.bodyMedium.copy(
                    fontWeight = FontWeight.SemiBold,
                ),
                color = MaterialTheme.colorScheme.onSurface,
            )
            Spacer(modifier = Modifier.height(8.dp))
            OutlinedTextField(
                value = feeling.notes ?: "",
                onValueChange = onNotesChange,
                modifier = Modifier.fillMaxWidth(),
                placeholder = {
                    Text(
                        text = "How did it feel?",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                },
                shape = RoundedCornerShape(8.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = Color.Transparent,
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                ),
            )
        }
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
