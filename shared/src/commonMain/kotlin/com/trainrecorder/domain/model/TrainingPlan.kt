package com.trainrecorder.domain.model

import kotlinx.datetime.Instant

data class TrainingPlan(
    val id: String,
    val displayName: String,
    val planMode: PlanMode,
    val cycleLength: Int?,
    val scheduleMode: ScheduleDayType,
    val intervalDays: Int?,
    val isActive: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant,
)
