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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp

/**
 * The Onboarding screen shown on first launch.
 *
 * Displays a 4-step flow:
 * 1. Welcome screen
 * 2. Plan template selection (PPL / Upper-Lower / Full Body)
 * 3. Exercise pre-fill preview
 * 4. Completion with "Start Training" button
 */
@Composable
fun OnboardingScreen(
    onComplete: () -> Unit = {},
    onSelectTemplate: (PlanTemplate) -> Unit = {},
    modifier: Modifier = Modifier,
) {
    var currentStep by remember { mutableIntStateOf(0) }
    var selectedTemplate by remember { mutableStateOf<PlanTemplate?>(null) }
    val stepTitles = remember { getOnboardingStepTitles() }
    val totalSteps = stepTitles.size

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        // Progress indicator
        LinearProgressIndicator(
            progress = { (currentStep + 1).toFloat() / totalSteps },
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
        )

        // Step content
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            contentAlignment = Alignment.Center,
        ) {
            when (currentStep) {
                0 -> WelcomeStep()
                1 -> TemplateSelectionStep(
                    selectedTemplate = selectedTemplate,
                    onSelectTemplate = { selectedTemplate = it },
                )
                2 -> ExercisePreviewStep(
                    template = selectedTemplate,
                )
                3 -> CompletionStep()
            }
        }

        // Navigation buttons
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            if (currentStep > 0) {
                OutlinedButton(
                    onClick = { currentStep-- },
                    modifier = Modifier.weight(1f),
                ) {
                    Text("Back")
                }
            }

            Button(
                onClick = {
                    if (currentStep < totalSteps - 1) {
                        currentStep++
                    } else {
                        selectedTemplate?.let { onSelectTemplate(it) }
                        onComplete()
                    }
                },
                modifier = Modifier.weight(1f),
                colors = if (currentStep == totalSteps - 1) {
                    ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary,
                    )
                } else {
                    ButtonDefaults.buttonColors()
                },
            ) {
                Text(
                    when (currentStep) {
                        0 -> "Get Started"
                        totalSteps - 1 -> "Start Training"
                        else -> "Next"
                    }
                )
            }
        }

        // Skip button
        if (currentStep < totalSteps - 1) {
            androidx.compose.material3.TextButton(
                onClick = onComplete,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
            ) {
                Text(
                    "Skip",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

/**
 * Step 1: Welcome screen with app description.
 */
@Composable
private fun WelcomeStep(
    modifier: Modifier = Modifier,
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        modifier = modifier
            .fillMaxWidth()
            .padding(32.dp),
    ) {
        Text(
            text = "Welcome to Train Recorder",
            style = MaterialTheme.typography.headlineMedium,
            textAlign = TextAlign.Center,
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Track your workouts, manage training plans, and monitor your progress with progressive overload.",
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Feature highlights
        listOf(
            "Progressive overload tracking",
            "Training plan templates",
            "Workout history and analytics",
        ).forEach { feature ->
            Text(
                text = "- $feature",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(vertical = 2.dp),
            )
        }
    }
}

/**
 * Step 2: Plan template selection.
 */
@Composable
private fun TemplateSelectionStep(
    selectedTemplate: PlanTemplate?,
    onSelectTemplate: (PlanTemplate) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp),
    ) {
        Text(
            text = "Choose a Training Plan",
            style = MaterialTheme.typography.titleLarge.copy(
                fontWeight = FontWeight.SemiBold,
            ),
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "You can customize or change it later",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        Spacer(modifier = Modifier.height(16.dp))

        PLAN_TEMPLATES.forEach { template ->
            val isSelected = selectedTemplate == template
            TemplateCard(
                template = template,
                isSelected = isSelected,
                onClick = { onSelectTemplate(template) },
                modifier = Modifier.padding(bottom = 8.dp),
            )
        }
    }
}

/**
 * A selectable card for a plan template.
 */
@Composable
private fun TemplateCard(
    template: PlanTemplate,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val borderColor = if (isSelected) {
        MaterialTheme.colorScheme.primary
    } else {
        MaterialTheme.colorScheme.outlineVariant
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(
                width = if (isSelected) 2.dp else 1.dp,
                color = borderColor,
                shape = RoundedCornerShape(12.dp),
            )
            .clickable(onClick = onClick)
            .padding(16.dp),
    ) {
        Text(
            text = template.displayName,
            style = MaterialTheme.typography.titleMedium.copy(
                fontWeight = FontWeight.SemiBold,
            ),
        )
        Text(
            text = template.description,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = template.days.joinToString(" / ") { it.displayName },
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.primary,
        )
    }
}

/**
 * Step 3: Exercise preview for the selected template.
 */
@Composable
private fun ExercisePreviewStep(
    template: PlanTemplate?,
    modifier: Modifier = Modifier,
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp),
    ) {
        Text(
            text = "Pre-filled Exercises",
            style = MaterialTheme.typography.titleLarge.copy(
                fontWeight = FontWeight.SemiBold,
            ),
        )

        Spacer(modifier = Modifier.height(16.dp))

        if (template == null) {
            Text(
                text = "No template selected. You can add exercises later.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        } else {
            template.days.forEach { day ->
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp),
                ) {
                    Text(
                        text = day.displayName,
                        style = MaterialTheme.typography.titleSmall.copy(
                            fontWeight = FontWeight.SemiBold,
                        ),
                        color = MaterialTheme.colorScheme.primary,
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    day.exerciseCategories.forEach { category ->
                        Text(
                            text = "- ${category.value.replace("_", " ").replaceFirstChar { it.uppercase() }}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
        }
    }
}

/**
 * Step 4: Completion screen.
 */
@Composable
private fun CompletionStep(
    modifier: Modifier = Modifier,
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        modifier = modifier
            .fillMaxWidth()
            .padding(32.dp),
    ) {
        Text(
            text = "You're All Set!",
            style = MaterialTheme.typography.headlineMedium,
            textAlign = TextAlign.Center,
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Your training plan is ready. Start your first workout from the calendar.",
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

