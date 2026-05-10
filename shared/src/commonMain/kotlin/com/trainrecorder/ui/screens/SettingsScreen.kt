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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
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
import com.trainrecorder.domain.model.WeightUnit
import com.trainrecorder.viewmodel.SettingsEvent
import com.trainrecorder.viewmodel.SettingsUiState
import com.trainrecorder.viewmodel.SettingsViewModel

/**
 * The Settings screen (UF-10, Tab 5).
 *
 * Displays grouped settings list with unit toggle, export/import,
 * clear data confirmation, and navigation to exercise library.
 */
@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel,
    onNavigateToExerciseLibrary: () -> Unit = {},
    onExportData: () -> Unit = {},
    onImportData: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val state by viewModel.state.collectAsState()
    var showClearDataDialog by remember { mutableStateOf(false) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        // Header
        SettingsHeader()

        if (!state.isLoaded || state.settings == null) {
            LoadingState()
            return
        }

        val currentSettings = state.settings
        val settingsItems = getSettingsItems(currentSettings!!.weightUnit)

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            SETTINGS_SECTIONS.forEach { (section, sectionLabel) ->
                val sectionItems = settingsItems.filter { it.section == section }
                if (sectionItems.isEmpty()) return@forEach

                item(key = "section_${section.name}") {
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = sectionLabel,
                        style = MaterialTheme.typography.labelMedium.copy(
                            fontWeight = FontWeight.SemiBold,
                        ),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(bottom = 4.dp),
                    )
                }

                items(sectionItems, key = { it.key }) { item ->
                    SettingsItemRow(
                        item = item,
                        weightUnit = currentSettings.weightUnit,
                        onToggle = { newUnit ->
                            viewModel.onEvent(SettingsEvent.UpdateWeightUnit(newUnit))
                        },
                        onClick = {
                            handleSettingsItemClick(
                                item = item,
                                onNavigateToExerciseLibrary = onNavigateToExerciseLibrary,
                                onExportData = onExportData,
                                onImportData = onImportData,
                                onClearData = { showClearDataDialog = true },
                            )
                        },
                    )
                }
            }

            // Bottom padding
            item { Spacer(modifier = Modifier.height(32.dp)) }
        }
    }

    // Clear data confirmation dialog
    if (showClearDataDialog) {
        ClearDataDialog(
            onConfirm = {
                viewModel.onEvent(SettingsEvent.ClearAllData)
                showClearDataDialog = false
            },
            onDismiss = { showClearDataDialog = false },
        )
    }
}

/**
 * Header row.
 */
@Composable
private fun SettingsHeader(
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = "Settings",
            style = MaterialTheme.typography.titleLarge.copy(
                fontWeight = FontWeight.SemiBold,
            ),
            color = MaterialTheme.colorScheme.onSurface,
        )
    }
}

/**
 * A single settings item row with optional toggle.
 */
@Composable
private fun SettingsItemRow(
    item: SettingsItem,
    weightUnit: WeightUnit,
    onToggle: (WeightUnit) -> Unit,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(MaterialTheme.colorScheme.surface)
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = item.title,
                style = MaterialTheme.typography.bodyMedium.copy(
                    fontWeight = FontWeight.Medium,
                ),
                color = if (item.isDestructive) {
                    MaterialTheme.colorScheme.error
                } else {
                    MaterialTheme.colorScheme.onSurface
                },
            )
            if (item.subtitle != null) {
                Text(
                    text = item.subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }

        // Toggle for weight unit
        if (item.hasToggle && item.key == "weight_unit") {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = formatWeightUnitLabel(WeightUnit.KG),
                    style = MaterialTheme.typography.labelSmall,
                    color = if (weightUnit == WeightUnit.KG) {
                        MaterialTheme.colorScheme.primary
                    } else {
                        MaterialTheme.colorScheme.onSurfaceVariant
                    },
                )
                Switch(
                    checked = weightUnit == WeightUnit.LB,
                    onCheckedChange = { checked ->
                        onToggle(if (checked) WeightUnit.LB else WeightUnit.KG)
                    },
                    colors = SwitchDefaults.colors(
                        checkedTrackColor = MaterialTheme.colorScheme.primary,
                        checkedThumbColor = Color.White,
                    ),
                )
                Text(
                    text = formatWeightUnitLabel(WeightUnit.LB),
                    style = MaterialTheme.typography.labelSmall,
                    color = if (weightUnit == WeightUnit.LB) {
                        MaterialTheme.colorScheme.primary
                    } else {
                        MaterialTheme.colorScheme.onSurfaceVariant
                    },
                )
            }
        }
    }
}

/**
 * Handle click on a settings item.
 */
private fun handleSettingsItemClick(
    item: SettingsItem,
    onNavigateToExerciseLibrary: () -> Unit,
    onExportData: () -> Unit,
    onImportData: () -> Unit,
    onClearData: () -> Unit,
) {
    when (item.key) {
        "exercise_library" -> onNavigateToExerciseLibrary()
        "export_data" -> onExportData()
        "import_data" -> onImportData()
        "clear_data" -> onClearData()
    }
}

/**
 * Clear data confirmation dialog.
 */
@Composable
private fun ClearDataDialog(
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Clear All Data?",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.SemiBold,
                ),
            )
        },
        text = {
            Text(
                text = buildClearDataConfirmationMessage(),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.error,
                ),
            ) {
                Text("Clear Data")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        },
    )
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
