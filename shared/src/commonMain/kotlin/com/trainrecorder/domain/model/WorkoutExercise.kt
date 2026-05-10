package com.trainrecorder.domain.model

import kotlinx.datetime.Instant

data class WorkoutExercise(
    val id: String,
    val workoutSessionId: String,
    val exerciseId: String,
    val orderIndex: Int,
    val note: String?,
    val suggestedWeight: Double?,
    val isCustomWeight: Boolean,
    val targetSets: Int,
    val targetReps: Int,
    val exerciseMode: ExerciseMode,
    val exerciseStatus: ExerciseStatus,
    val createdAt: Instant,
    val updatedAt: Instant,
)
