package com.trainrecorder.domain.model

import kotlinx.datetime.Instant
import kotlinx.serialization.Serializable

@Serializable
data class TrainingDayExercise(
    val id: String,
    val trainingDayId: String,
    val exerciseId: String,
    val orderIndex: Int,
    val exerciseMode: ExerciseMode,
    val targetSets: Int,
    val targetReps: Int,
    val startWeight: Double?,
    val note: String?,
    val restSeconds: Int,
    val weightIncrement: Double,
    val createdAt: Instant,
    val updatedAt: Instant,
)
