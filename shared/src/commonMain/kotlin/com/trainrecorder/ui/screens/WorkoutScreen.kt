package com.trainrecorder.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
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
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.trainrecorder.domain.model.ExerciseStatus
import com.trainrecorder.viewmodel.ExerciseSetUi
import com.trainrecorder.viewmodel.WorkoutEvent
import com.trainrecorder.viewmodel.WorkoutExerciseUi
import com.trainrecorder.viewmodel.WorkoutUiState
import com.trainrecorder.viewmodel.WorkoutViewModel
import kotlin.math.roundToInt

/**
 * The Workout Execution screen (UF-2, push page, hides tab bar).
 *
 * Displays an exercise card list with the current exercise expanded,
 * weight input with suggested value pre-filled, reps input, and a
 * "Complete Set" button. A timer panel slides up after each set
 * completion. Supports swipe-to-skip, long-press-to-reorder, and
 * progress indicator in the nav bar.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkoutScreen(
    viewModel: WorkoutViewModel,
    onNavigateBack: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val state by viewModel.state.collectAsState()
    var showExitDialog by remember { mutableStateOf(false) }
    var skipExerciseId by remember { mutableStateOf<String?>(null) }
    var expandedIndex by remember { mutableStateOf(state.currentExerciseIndex) }
    var reorderActive by remember { mutableStateOf(false) }

    // Track expanded index based on current exercise changes
    if (state.currentExerciseIndex != expandedIndex && !reorderActive) {
        expandedIndex = state.currentExerciseIndex
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        // Top bar with progress and back button
        WorkoutTopBar(
            progress = state.progress.fraction,
            onBackClick = {
                if (state.progress.completedExercises > 0 || hasCompletedSets(state.exercises)) {
                    showExitDialog = true
                } else {
                    onNavigateBack()
                }
            },
        )

        if (!state.isLoaded) {
            LoadingState()
        } else if (state.error != null && state.exercises.isEmpty()) {
            ErrorState(
                error = state.error ?: "Unknown error",
                onRetry = { onNavigateBack() },
            )
        } else {
            // Exercise card list
            Box(modifier = Modifier.weight(1f)) {
                ExerciseCardList(
                    exercises = state.exercises,
                    expandedIndex = expandedIndex,
                    onExpand = { index -> expandedIndex = index },
                    onRecordSet = { exerciseId, weight, reps ->
                        viewModel.onEvent(WorkoutEvent.RecordSet(exerciseId, weight, reps))
                    },
                    onUpdateWeight = { exerciseId, weight ->
                        viewModel.onEvent(WorkoutEvent.UpdateWeight(exerciseId, weight))
                    },
                    onSwipeSkip = { exerciseId -> skipExerciseId = exerciseId },
                    onReorder = { from, to ->
                        reorderActive = true
                        viewModel.onEvent(WorkoutEvent.ReorderExercise(from, to))
                        reorderActive = false
                    },
                    onLongPress = { index -> expandedIndex = index },
                )

                // Skip confirmation dialog
                skipExerciseId?.let { exerciseId ->
                    val exercise = state.exercises.find { it.exerciseId == exerciseId }
                    if (exercise != null) {
                        SkipExerciseDialog(
                            exerciseName = exercise.exerciseName,
                            onConfirm = {
                                viewModel.onEvent(WorkoutEvent.SkipExercise(exerciseId))
                                skipExerciseId = null
                            },
                            onDismiss = { skipExerciseId = null },
                        )
                    }
                }
            }

            // Timer panel (slides up)
            state.timerState?.let { timerState ->
                TimerPanel(
                    timerState = timerState,
                    onSkipTimer = { viewModel.onEvent(WorkoutEvent.SkipTimer) },
                    onAdjustTimer = { delta ->
                        viewModel.onEvent(WorkoutEvent.AdjustTimer(delta))
                    },
                )
            }

            // Bottom action buttons
            WorkoutBottomActions(
                state = state,
                onCompleteWorkout = { viewModel.onEvent(WorkoutEvent.CompleteWorkout) },
                onPartialComplete = { viewModel.onEvent(WorkoutEvent.PartialComplete) },
            )
        }
    }

    // Exit confirmation dialog
    if (showExitDialog) {
        ExitConfirmationDialog(
            dialogState = buildExitDialogState(state.exercises, state.progress),
            onContinue = { showExitDialog = false },
            onExit = {
                showExitDialog = false
                viewModel.onEvent(WorkoutEvent.PartialComplete)
                onNavigateBack()
            },
        )
    }
}

/**
 * Top bar with progress indicator and back button.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun WorkoutTopBar(
    progress: Float,
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxWidth()) {
        TopAppBar(
            title = {
                Text(
                    text = "Workout",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.SemiBold,
                    ),
                )
            },
            navigationIcon = {
                TextButton(onClick = onBackClick) {
                    Text(
                        text = "< Back",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.primary,
                    )
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = MaterialTheme.colorScheme.background,
            ),
        )
        // Progress bar
        LinearProgressIndicator(
            progress = { progress },
            modifier = Modifier
                .fillMaxWidth()
                .height(3.dp)
                .padding(horizontal = 16.dp),
            color = MaterialTheme.colorScheme.primary,
            trackColor = MaterialTheme.colorScheme.surfaceVariant,
        )
    }
}

/**
 * List of exercise cards with expand/collapse.
 */
@Composable
private fun ExerciseCardList(
    exercises: List<WorkoutExerciseUi>,
    expandedIndex: Int,
    onExpand: (Int) -> Unit,
    onRecordSet: (exerciseId: String, weight: Double, reps: Int) -> Unit,
    onUpdateWeight: (exerciseId: String, weight: Double) -> Unit,
    onSwipeSkip: (exerciseId: String) -> Unit,
    onReorder: (fromIndex: Int, toIndex: Int) -> Unit,
    onLongPress: (index: Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val listState = rememberLazyListState()

    LazyColumn(
        state = listState,
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        item { Spacer(modifier = Modifier.height(8.dp)) }

        itemsIndexed(
            items = exercises,
            key = { _, exercise -> exercise.exerciseId },
        ) { index, exercise ->
            val isExpanded = index == expandedIndex
            val isCompleted = exercise.exerciseStatus == ExerciseStatus.COMPLETED
            val isSkipped = exercise.exerciseStatus == ExerciseStatus.SKIPPED

            ExerciseCard(
                exercise = exercise,
                isExpanded = isExpanded,
                isCompleted = isCompleted,
                isSkipped = isSkipped,
                onClick = { onExpand(index) },
                onRecordSet = { weight, reps -> onRecordSet(exercise.exerciseId, weight, reps) },
                onUpdateWeight = { weight -> onUpdateWeight(exercise.exerciseId, weight) },
                onSwipeSkip = { onSwipeSkip(exercise.exerciseId) },
                onLongPress = { onLongPress(index) },
                onReorderUp = { if (index > 0) onReorder(index, index - 1) },
                onReorderDown = { if (index < exercises.size - 1) onReorder(index, index + 1) },
            )
        }

        item { Spacer(modifier = Modifier.height(8.dp)) }
    }
}

/**
 * Single exercise card with expand/collapse animation.
 */
@Composable
private fun ExerciseCard(
    exercise: WorkoutExerciseUi,
    isExpanded: Boolean,
    isCompleted: Boolean,
    isSkipped: Boolean,
    onClick: () -> Unit,
    onRecordSet: (weight: Double, reps: Int) -> Unit,
    onUpdateWeight: (weight: Double) -> Unit,
    onSwipeSkip: () -> Unit,
    onLongPress: () -> Unit,
    onReorderUp: () -> Unit,
    onReorderDown: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var swipeOffset by remember { mutableStateOf(0f) }
    val swipeThreshold = 150f

    val cardModifier = modifier
        .fillMaxWidth()
        .pointerInput(Unit) {
            detectHorizontalDragGestures(
                onDragEnd = {
                    if (swipeOffset < -swipeThreshold && !isCompleted) {
                        onSwipeSkip()
                    }
                    swipeOffset = 0f
                },
                onDragCancel = { swipeOffset = 0f },
            ) { _, dragAmount ->
                if (!isCompleted) {
                    swipeOffset = (swipeOffset + dragAmount).coerceIn(-300f, 0f)
                }
            }
        }
        .pointerInput(Unit) {
            detectTapGestures(
                onTap = { onClick() },
                onLongPress = { onLongPress() },
            )
        }
        .offset { IntOffset(swipeOffset.roundToInt(), 0) }
        .graphicsLayer {
            alpha = if (swipeOffset < 0) 1f + (swipeOffset / 600f) else 1f
        }

    val cardColors = CardDefaults.cardColors(
        containerColor = when {
            isSkipped -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
            isExpanded -> MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)
            else -> MaterialTheme.colorScheme.surface
        },
    )

    Card(
        modifier = cardModifier,
        shape = RoundedCornerShape(12.dp),
        colors = cardColors,
        elevation = CardDefaults.cardElevation(
            defaultElevation = if (isExpanded) 4.dp else 1.dp,
        ),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
        ) {
            // Exercise header row
            ExerciseHeader(
                exercise = exercise,
                isExpanded = isExpanded,
                isCompleted = isCompleted,
                isSkipped = isSkipped,
                onReorderUp = onReorderUp,
                onReorderDown = onReorderDown,
            )

            // Expanded content
            AnimatedVisibility(
                visible = isExpanded && !isCompleted && !isSkipped,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut(),
            ) {
                ExerciseExpandedContent(
                    exercise = exercise,
                    onRecordSet = onRecordSet,
                    onUpdateWeight = onUpdateWeight,
                )
            }

            // Completed summary
            if (isCompleted) {
                CompletedSummary(exercise = exercise)
            }

            // Skipped indicator
            if (isSkipped) {
                Text(
                    text = "Skipped",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp),
                )
            }
        }
    }
}

/**
 * Exercise header with name, status badge, and reorder handles.
 */
@Composable
private fun ExerciseHeader(
    exercise: WorkoutExerciseUi,
    isExpanded: Boolean,
    isCompleted: Boolean,
    isSkipped: Boolean,
    onReorderUp: () -> Unit,
    onReorderDown: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Reorder handles (left)
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier
                .width(24.dp)
                .pointerInput(Unit) {
                    detectDragGestures { change, dragAmount ->
                        change.consume()
                        if (dragAmount.y < -5f) onReorderUp()
                        if (dragAmount.y > 5f) onReorderDown()
                    }
                },
        ) {
            Text(
                text = "^",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                text = "=",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                text = "v",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }

        // Exercise name
        Text(
            text = exercise.exerciseName.ifEmpty { "Exercise" },
            style = MaterialTheme.typography.bodyLarge.copy(
                fontWeight = if (isExpanded) FontWeight.SemiBold else FontWeight.Normal,
            ),
            color = when {
                isSkipped -> MaterialTheme.colorScheme.onSurfaceVariant
                else -> MaterialTheme.colorScheme.onSurface
            },
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f),
        )

        Spacer(modifier = Modifier.width(8.dp))

        // Status badge
        when {
            isCompleted -> StatusBadge(
                text = "Done",
                color = SuccessColor,
            )
            isSkipped -> StatusBadge(
                text = "Skip",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            isExpanded -> {
                // Set progress
                val completed = exercise.sets.count { it.isCompleted }
                Text(
                    text = formatSetLabel(completed + 1, exercise.targetSets),
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
        }
    }
}

/**
 * Small status badge.
 */
@Composable
private fun StatusBadge(
    text: String,
    color: Color,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .background(color.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp),
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall.copy(
                fontWeight = FontWeight.SemiBold,
            ),
            color = color,
        )
    }
}

/**
 * Expanded content showing sets, weight input, reps input, and complete button.
 */
@Composable
private fun ExerciseExpandedContent(
    exercise: WorkoutExerciseUi,
    onRecordSet: (weight: Double, reps: Int) -> Unit,
    onUpdateWeight: (weight: Double) -> Unit,
    modifier: Modifier = Modifier,
) {
    val nextSet = findNextIncompleteSet(exercise)
    var weightText by remember(exercise.exerciseId, exercise.suggestedWeight) {
        mutableStateOf(
            exercise.suggestedWeight?.toString() ?: "",
        )
    }
    var repsText by remember(exercise.exerciseId) {
        mutableStateOf(exercise.targetReps.toString())
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(top = 12.dp),
    ) {
        // Set list (completed sets)
        exercise.sets.forEachIndexed { index, set ->
            if (set.isCompleted) {
                CompletedSetRow(set = set, index = index + 1)
            }
        }

        if (nextSet != null) {
            Spacer(modifier = Modifier.height(12.dp))

            // Weight input
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "Weight:",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.width(64.dp),
                )
                OutlinedTextField(
                    value = weightText,
                    onValueChange = { value ->
                        weightText = value
                        value.toDoubleOrNull()?.let { onUpdateWeight(it) }
                    },
                    modifier = Modifier.weight(1f),
                    placeholder = {
                        Text(
                            exercise.suggestedWeight?.toString() ?: "0",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Decimal,
                        imeAction = ImeAction.Next,
                    ),
                    shape = RoundedCornerShape(8.dp),
                    textStyle = MaterialTheme.typography.bodyMedium.copy(
                        textAlign = TextAlign.Center,
                    ),
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "kg",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Reps input
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "Reps:",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.width(64.dp),
                )
                OutlinedTextField(
                    value = repsText,
                    onValueChange = { value ->
                        repsText = value.filter { it.isDigit() }
                    },
                    modifier = Modifier.weight(1f),
                    placeholder = {
                        Text(
                            exercise.targetReps.toString(),
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Number,
                        imeAction = ImeAction.Done,
                    ),
                    shape = RoundedCornerShape(8.dp),
                    textStyle = MaterialTheme.typography.bodyMedium.copy(
                        textAlign = TextAlign.Center,
                    ),
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Complete Set button
            Button(
                onClick = {
                    val weight = weightText.toDoubleOrNull() ?: exercise.suggestedWeight ?: 0.0
                    val reps = repsText.toIntOrNull() ?: exercise.targetReps
                    onRecordSet(weight, reps)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                ),
            ) {
                Text(
                    text = "Complete ${formatSetLabel(nextSet.setIndex + 1, exercise.targetSets)}",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.SemiBold,
                    ),
                )
            }
        } else {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "All sets completed",
                style = MaterialTheme.typography.bodyMedium,
                color = SuccessColor,
                fontWeight = FontWeight.Medium,
            )
        }
    }
}

/**
 * Row showing a completed set.
 */
@Composable
private fun CompletedSetRow(
    set: ExerciseSetUi,
    index: Int,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(
            text = "Set $index",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            text = "${set.actualWeight?.formatWeight() ?: "-"} kg x ${set.actualReps ?: "-"}",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurface,
            fontWeight = FontWeight.Medium,
        )
        Text(
            text = "v",
            style = MaterialTheme.typography.labelSmall,
            color = SuccessColor,
        )
    }
}

/**
 * Summary of completed exercise showing set results.
 */
@Composable
private fun CompletedSummary(
    exercise: WorkoutExerciseUi,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.padding(top = 8.dp)) {
        exercise.sets.filter { it.isCompleted }.forEachIndexed { index, set ->
            CompletedSetRow(set = set, index = index + 1)
        }
    }
}

/**
 * Timer panel that slides up from the bottom.
 */
@Composable
private fun TimerPanel(
    timerState: com.trainrecorder.viewmodel.TimerDisplayState,
    onSkipTimer: () -> Unit,
    onAdjustTimer: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val panelState = TimerPanelState(
        remainingSeconds = timerState.remainingSeconds,
        totalDuration = timerState.totalDuration,
        isExpired = timerState.isExpired,
        isVisible = true,
    )

    val progressColor by animateColorAsState(
        targetValue = if (panelState.isExpired) MaterialTheme.colorScheme.error
        else MaterialTheme.colorScheme.primary,
        label = "timerProgressColor",
    )

    AnimatedVisibility(
        visible = panelState.isVisible,
        enter = slideInVertically(initialOffsetY = { it }) + fadeIn(),
        exit = slideOutVertically(targetOffsetY = { it }) + fadeOut(),
        modifier = modifier,
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.8f),
            ),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(
                    text = "Rest Timer",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Timer display
                Text(
                    text = panelState.displayText,
                    style = MaterialTheme.typography.displaySmall.copy(
                        fontWeight = FontWeight.Bold,
                    ),
                    color = if (panelState.isExpired) MaterialTheme.colorScheme.error
                    else MaterialTheme.colorScheme.onSurface,
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Progress bar
                LinearProgressIndicator(
                    progress = { panelState.progress },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(4.dp),
                    color = progressColor,
                    trackColor = MaterialTheme.colorScheme.outlineVariant,
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Timer controls
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    FilledTonalButton(
                        onClick = { onAdjustTimer(-30) },
                        shape = RoundedCornerShape(8.dp),
                    ) {
                        Text("-30s")
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Button(
                        onClick = onSkipTimer,
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary,
                        ),
                    ) {
                        Text("Skip Rest")
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    FilledTonalButton(
                        onClick = { onAdjustTimer(30) },
                        shape = RoundedCornerShape(8.dp),
                    ) {
                        Text("+30s")
                    }
                }
            }
        }
    }
}

/**
 * Bottom action buttons (Complete Workout / Save & Exit).
 */
@Composable
private fun WorkoutBottomActions(
    state: WorkoutUiState,
    onCompleteWorkout: () -> Unit,
    onPartialComplete: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val allDone = state.exercises.isNotEmpty() &&
        state.exercises.all {
            it.exerciseStatus == ExerciseStatus.COMPLETED ||
                it.exerciseStatus == ExerciseStatus.SKIPPED
        }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        // Save & Exit (partial complete)
        if (!allDone) {
            androidx.compose.material3.OutlinedButton(
                onClick = onPartialComplete,
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp),
                shape = RoundedCornerShape(12.dp),
                enabled = !state.isSaving,
            ) {
                Text(
                    text = "Save & Exit",
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
        }

        // Complete Workout
        Button(
            onClick = onCompleteWorkout,
            modifier = Modifier
                .weight(1f)
                .height(48.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = if (allDone) SuccessColor else MaterialTheme.colorScheme.primary,
            ),
            enabled = !state.isSaving,
        ) {
            if (state.isSaving) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp,
                )
            } else {
                Text(
                    text = if (allDone) "Complete Workout" else "Finish",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.SemiBold,
                    ),
                )
            }
        }
    }
}

/**
 * Exit confirmation dialog showing workout progress.
 */
@Composable
private fun ExitConfirmationDialog(
    dialogState: ExitDialogState,
    onContinue: () -> Unit,
    onExit: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onContinue,
        title = {
            Text(
                text = "Exit Workout?",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.SemiBold,
                ),
            )
        },
        text = {
            Column {
                Text(
                    text = "You have completed ${dialogState.completedExercises} of ${dialogState.totalExercises} exercises" +
                        " and ${dialogState.completedSets} of ${dialogState.totalSets} sets.",
                    style = MaterialTheme.typography.bodyMedium,
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Your progress will be saved.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        },
        confirmButton = {
            TextButton(onClick = onExit) {
                Text("Save & Exit", color = MaterialTheme.colorScheme.error)
            }
        },
        dismissButton = {
            TextButton(onClick = onContinue) {
                Text("Continue Workout")
            }
        },
    )
}

/**
 * Skip exercise confirmation dialog.
 */
@Composable
private fun SkipExerciseDialog(
    exerciseName: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Skip Exercise?",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.SemiBold,
                ),
            )
        },
        text = {
            Text(
                text = "Skip \"$exerciseName\"? You cannot undo this action.",
                style = MaterialTheme.typography.bodyMedium,
            )
        },
        confirmButton = {
            TextButton(onClick = onConfirm) {
                Text("Skip", color = MaterialTheme.colorScheme.error)
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
 * Loading state placeholder.
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

/**
 * Error state with retry.
 */
@Composable
private fun ErrorState(
    error: String,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = error,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.error,
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = onRetry) {
                Text("Go Back")
            }
        }
    }
}

/**
 * Helper to check if any sets have been completed across all exercises.
 */
private fun hasCompletedSets(exercises: List<WorkoutExerciseUi>): Boolean {
    return exercises.any { ex -> ex.sets.any { it.isCompleted } }
}

/**
 * Format a double weight value for display (remove unnecessary decimals).
 */
private fun Double.formatWeight(): String {
    return if (this == this.toLong().toDouble()) {
        this.toLong().toString()
    } else {
        this.toString()
    }
}

/**
 * Success green color for completed state markers.
 */
private val SuccessColor = Color(0xFF30D158)
