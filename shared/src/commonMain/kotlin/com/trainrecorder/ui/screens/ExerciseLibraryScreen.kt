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
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.trainrecorder.domain.model.Exercise
import com.trainrecorder.domain.model.ExerciseCategory
import com.trainrecorder.viewmodel.ExerciseLibraryEvent
import com.trainrecorder.viewmodel.ExerciseLibraryUiState
import com.trainrecorder.viewmodel.ExerciseLibraryViewModel

/**
 * The Exercise Library screen (UF-4, push from settings).
 *
 * Displays exercises grouped by category with search/filter,
 * category chips, exercise cards, and a create custom exercise button.
 */
@Composable
fun ExerciseLibraryScreen(
    viewModel: ExerciseLibraryViewModel,
    onExerciseClick: (exerciseId: String) -> Unit = {},
    onCreateExercise: () -> Unit = {},
    isSelectionMode: Boolean = false,
    onSelectionComplete: (Set<String>) -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val state by viewModel.state.collectAsState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        // Header
        ExerciseLibraryHeader(isSelectionMode = isSelectionMode)

        if (!state.isLoaded) {
            LoadingState()
            return
        }

        // Search bar
        SearchBar(
            query = state.searchQuery,
            onQueryChange = { viewModel.onEvent(ExerciseLibraryEvent.Search(it)) },
        )

        // Category filter chips
        CategoryFilterChips(
            selectedCategory = state.selectedCategory,
            onCategorySelected = { viewModel.onEvent(ExerciseLibraryEvent.FilterCategory(it)) },
        )

        // Exercise list grouped by category
        if (state.exercises.isEmpty()) {
            EmptyExerciseState(
                hasQuery = state.searchQuery.isNotBlank(),
            )
        } else {
            val grouped = groupByCategory(state.exercises)
            val orderedCategories = CATEGORY_DISPLAY_ORDER.filter { it in grouped }

            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                orderedCategories.forEach { category ->
                    val exercisesInCategory = grouped[category] ?: emptyList()
                    item(key = "header_${category.value}") {
                        CategoryHeader(category = category)
                    }
                    items(
                        items = exercisesInCategory,
                        key = { it.id },
                    ) { exercise ->
                        ExerciseCard(
                            exercise = exercise,
                            isSelected = exercise.id in state.selectedIds,
                            isSelectionMode = isSelectionMode,
                            onClick = {
                                if (isSelectionMode) {
                                    viewModel.onEvent(ExerciseLibraryEvent.ToggleSelection(exercise.id))
                                } else {
                                    onExerciseClick(exercise.id)
                                }
                            },
                        )
                    }
                }

                // Create custom exercise button
                item {
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(
                        onClick = onCreateExercise,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(44.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant,
                            contentColor = MaterialTheme.colorScheme.primary,
                        ),
                    ) {
                        Text(
                            text = "+ Custom Exercise",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                fontWeight = FontWeight.SemiBold,
                            ),
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }

        // Selection mode: Done button
        if (isSelectionMode && state.selectedIds.isNotEmpty()) {
            Button(
                onClick = { onSelectionComplete(state.selectedIds) },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
                    .height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                ),
            ) {
                Text(
                    text = "Done (${state.selectedIds.size} selected)",
                    style = MaterialTheme.typography.bodyLarge.copy(
                        fontWeight = FontWeight.SemiBold,
                    ),
                )
            }
        }
    }
}

/**
 * Header with title.
 */
@Composable
private fun ExerciseLibraryHeader(
    isSelectionMode: Boolean,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = if (isSelectionMode) "Select Exercises" else "Exercise Library",
            style = MaterialTheme.typography.titleLarge.copy(
                fontWeight = FontWeight.SemiBold,
            ),
            color = MaterialTheme.colorScheme.onSurface,
        )
    }
}

/**
 * Search bar for exercise filtering.
 */
@Composable
private fun SearchBar(
    query: String,
    onQueryChange: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    OutlinedTextField(
        value = query,
        onValueChange = onQueryChange,
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        placeholder = {
            Text("Search exercises...", color = MaterialTheme.colorScheme.onSurfaceVariant)
        },
        shape = RoundedCornerShape(12.dp),
        colors = OutlinedTextFieldDefaults.colors(
            unfocusedBorderColor = Color.Transparent,
            focusedBorderColor = MaterialTheme.colorScheme.primary,
        ),
    )
}

/**
 * Category filter chips row.
 */
@Composable
private fun CategoryFilterChips(
    selectedCategory: ExerciseCategory?,
    onCategorySelected: (ExerciseCategory?) -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        // "All" chip
        FilterChip(
            selected = selectedCategory == null,
            onClick = { onCategorySelected(null) },
            label = {
                Text(
                    text = "All",
                    style = MaterialTheme.typography.labelSmall,
                )
            },
            shape = RoundedCornerShape(50),
            border = null,
            colors = FilterChipDefaults.filterChipColors(
                selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer,
            ),
        )
        // Category chips
        CATEGORY_DISPLAY_ORDER.forEach { category ->
            FilterChip(
                selected = selectedCategory == category,
                onClick = { onCategorySelected(category) },
                label = {
                    Text(
                        text = getCategoryLabel(category),
                        style = MaterialTheme.typography.labelSmall,
                    )
                },
                shape = RoundedCornerShape(50),
                border = null,
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                    selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer,
                ),
            )
        }
    }
}

/**
 * Category header label.
 */
@Composable
private fun CategoryHeader(
    category: ExerciseCategory,
    modifier: Modifier = Modifier,
) {
    Text(
        text = getCategoryLabel(category),
        style = MaterialTheme.typography.titleSmall.copy(
            fontWeight = FontWeight.SemiBold,
        ),
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = modifier.padding(top = 8.dp, bottom = 4.dp),
    )
}

/**
 * Exercise card showing name, category, increment, and rest info.
 */
@Composable
private fun ExerciseCard(
    exercise: Exercise,
    isSelected: Boolean,
    isSelectionMode: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val backgroundColor = if (isSelected) {
        MaterialTheme.colorScheme.primaryContainer
    } else {
        MaterialTheme.colorScheme.surface
    }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = backgroundColor),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = exercise.displayName,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.SemiBold,
                    ),
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = getCategoryLabel(exercise.category),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            // Detail info
            Text(
                text = formatExerciseDetail(exercise),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            // Selection indicator
            if (isSelectionMode) {
                Spacer(modifier = Modifier.padding(horizontal = 4.dp))
                Text(
                    text = if (isSelected) "v" else "",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
        }
    }
}

/**
 * Empty state when no exercises match the filter.
 */
@Composable
private fun EmptyExerciseState(
    hasQuery: Boolean,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = if (hasQuery) "No exercises found" else "No exercises available",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.SemiBold,
                ),
                color = MaterialTheme.colorScheme.onSurface,
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = if (hasQuery) "Try a different search" else "Create a custom exercise to get started",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
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
