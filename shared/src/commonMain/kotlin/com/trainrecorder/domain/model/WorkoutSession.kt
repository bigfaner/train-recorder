package com.trainrecorder.domain.model

import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate

data class WorkoutSession(
    val id: String,
    val planId: String?,
    val trainingDayId: String?,
    val recordDate: LocalDate,
    val trainingType: TrainingType,
    val workoutStatus: WorkoutStatus,
    val startedAt: Instant?,
    val endedAt: Instant?,
    val isBackfill: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant,
)
