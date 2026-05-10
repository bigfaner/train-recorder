package com.trainrecorder.domain.model

import kotlinx.datetime.Instant

data class WorkoutFeeling(
    val id: String,
    val workoutSessionId: String,
    val fatigueLevel: Int,
    val satisfactionLevel: Int,
    val notes: String?,
    val createdAt: Instant,
    val updatedAt: Instant,
)
