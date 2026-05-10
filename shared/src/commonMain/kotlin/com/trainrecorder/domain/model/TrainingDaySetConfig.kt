package com.trainrecorder.domain.model

data class TrainingDaySetConfig(
    val id: String,
    val dayExerciseId: String,
    val setIndex: Int,
    val targetReps: Int,
    val targetWeight: Double,
)
