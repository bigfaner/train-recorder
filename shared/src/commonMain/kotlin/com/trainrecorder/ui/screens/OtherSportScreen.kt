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
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.trainrecorder.domain.model.OtherSportType
import com.trainrecorder.viewmodel.OtherSportEvent
import com.trainrecorder.viewmodel.OtherSportUiState
import com.trainrecorder.viewmodel.OtherSportViewModel

private val SportTypeColor = Color(0xFFAF52DE)

/**
 * The Other Sport screen (UF-7, push from calendar).
 *
 * Displays a sport type grid, dynamic metric input fields based
 * on the selected sport type, and notes input.
 */
@Composable
fun OtherSportScreen(
    viewModel: OtherSportViewModel,
    onSaveComplete: () -> Unit = {},
    onCreateCustomSport: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val state by viewModel.state.collectAsState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        // Header
        OtherSportHeader()

        if (!state.isLoaded) {
            LoadingState()
            return
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
        ) {
            // Sport type grid
            Text(
                text = "Select Sport Type",
                style = MaterialTheme.typography.titleSmall.copy(
                    fontWeight = FontWeight.SemiBold,
                ),
                color = MaterialTheme.colorScheme.onSurface,
            )
            Spacer(modifier = Modifier.height(8.dp))

            LazyVerticalGrid(
                columns = GridCells.Fixed(SPORT_TYPE_GRID_COLUMNS),
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                items(state.sportTypes) { sportType ->
                    SportTypeCard(
                        sportType = sportType,
                        isSelected = state.selectedType?.id == sportType.id,
                        onClick = { viewModel.onEvent(OtherSportEvent.SelectSportType(sportType.id)) },
                    )
                }
                // Custom sport button
                item {
                    CustomSportCard(onClick = onCreateCustomSport)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Dynamic metric inputs
            if (state.selectedType != null) {
                val fields = resolveMetricFields(state.metrics)
                DynamicMetricInputs(
                    fields = fields,
                    values = state.metricValues,
                    onValueChange = { metricId, value ->
                        viewModel.onEvent(OtherSportEvent.SetMetricValue(metricId, value))
                    },
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Notes
                OutlinedTextField(
                    value = state.notes,
                    onValueChange = { viewModel.onEvent(OtherSportEvent.SetNotes(it)) },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = {
                        Text("Notes...", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    },
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        unfocusedBorderColor = Color.Transparent,
                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                    ),
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Save button
                Button(
                    onClick = { viewModel.onEvent(OtherSportEvent.Save(state.date)) },
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

                // Error display
                if (state.error != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = state.error!!,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error,
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

/**
 * Header row.
 */
@Composable
private fun OtherSportHeader(
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = "Record Other Sport",
            style = MaterialTheme.typography.titleLarge.copy(
                fontWeight = FontWeight.SemiBold,
            ),
            color = MaterialTheme.colorScheme.onSurface,
        )
    }
}

/**
 * A sport type card in the selection grid.
 */
@Composable
private fun SportTypeCard(
    sportType: OtherSportType,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val backgroundColor = if (isSelected) {
        SportTypeColor.copy(alpha = 0.15f)
    } else {
        MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
    }
    val textColor = if (isSelected) {
        SportTypeColor
    } else {
        MaterialTheme.colorScheme.onSurface
    }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = backgroundColor),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = sportType.displayName,
                style = MaterialTheme.typography.bodyMedium.copy(
                    fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                ),
                color = textColor,
                textAlign = TextAlign.Center,
            )
        }
    }
}

/**
 * Custom sport type card with "+" button.
 */
@Composable
private fun CustomSportCard(
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
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f),
        ),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = "+ Custom",
                style = MaterialTheme.typography.bodyMedium.copy(
                    fontWeight = FontWeight.Medium,
                ),
                color = MaterialTheme.colorScheme.primary,
                textAlign = TextAlign.Center,
            )
        }
    }
}

/**
 * Dynamic metric input fields rendered based on the selected sport type's metrics.
 */
@Composable
private fun DynamicMetricInputs(
    fields: List<MetricField>,
    values: Map<String, String>,
    onValueChange: (metricId: String, value: String) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxWidth()) {
        fields.forEach { field ->
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = if (field.unit != null) "${field.label} (${field.unit})" else field.label,
                style = MaterialTheme.typography.bodySmall.copy(
                    fontWeight = FontWeight.Medium,
                ),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(modifier = Modifier.height(4.dp))
            OutlinedTextField(
                value = values[field.metricId] ?: "",
                onValueChange = { onValueChange(field.metricId, it) },
                modifier = Modifier.fillMaxWidth(),
                placeholder = {
                    val placeholderText = when (field.inputType) {
                        com.trainrecorder.domain.model.MetricInputType.NUMBER -> "0"
                        com.trainrecorder.domain.model.MetricInputType.TEXT -> "Enter ${field.label}"
                    }
                    Text(placeholderText, color = MaterialTheme.colorScheme.onSurfaceVariant)
                },
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = Color.Transparent,
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                ),
            )
            Spacer(modifier = Modifier.height(4.dp))
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
