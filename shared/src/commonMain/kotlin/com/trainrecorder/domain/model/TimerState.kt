package com.trainrecorder.domain.model

import kotlinx.datetime.Instant

data class TimerState(
    val id: String,
    val workoutSessionId: String,
    val startTimestamp: Instant,
    val totalDurationSeconds: Int,
    val isRunning: Boolean,
    val updatedAt: Instant,
)
