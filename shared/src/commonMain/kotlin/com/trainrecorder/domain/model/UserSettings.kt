package com.trainrecorder.domain.model

import kotlinx.datetime.Instant

data class UserSettings(
    val id: String,
    val weightUnit: WeightUnit,
    val defaultRestSeconds: Int,
    val trainingReminderEnabled: Boolean,
    val vibrationEnabled: Boolean,
    val soundEnabled: Boolean,
    val onboardingCompleted: Boolean,
    val updatedAt: Instant,
)
