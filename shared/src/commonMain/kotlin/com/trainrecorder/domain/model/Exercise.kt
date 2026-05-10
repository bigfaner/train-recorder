package com.trainrecorder.domain.model

import kotlinx.datetime.Instant

data class Exercise(
    val id: String,
    val displayName: String,
    val category: ExerciseCategory,
    val weightIncrement: Double,
    val defaultRest: Int,
    val isCustom: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant,
)
