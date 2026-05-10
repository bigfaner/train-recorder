package com.trainrecorder.domain.model

import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate

data class PersonalRecord(
    val id: String,
    val exerciseId: String,
    val maxWeight: Double,
    val maxVolume: Double,
    val maxWeightDate: LocalDate,
    val maxVolumeDate: LocalDate,
    val maxWeightSessionId: String,
    val maxVolumeSessionId: String,
    val createdAt: Instant,
    val updatedAt: Instant,
)
