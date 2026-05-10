package com.trainrecorder.domain.model

import kotlinx.datetime.Instant
import kotlinx.serialization.Serializable

@Serializable
data class ExerciseFeeling(
    val id: String,
    val workoutFeelingId: String,
    val exerciseId: String,
    val notes: String?,
    val createdAt: Instant,
    val updatedAt: Instant,
)
