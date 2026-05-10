package com.trainrecorder.domain.model

import kotlinx.datetime.Instant
import kotlinx.serialization.Serializable

@Serializable
data class ExerciseSet(
    val id: String,
    val workoutExerciseId: String,
    val setIndex: Int,
    val targetWeight: Double,
    val actualWeight: Double,
    val targetReps: Int,
    val actualReps: Int?,
    val isCompleted: Boolean,
    val restStartedAt: Instant?,
    val restDuration: Int?,
    val createdAt: Instant,
    val updatedAt: Instant,
)
