package com.trainrecorder.domain.model

import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlinx.serialization.Serializable

@Serializable
data class BodyMeasurement(
    val id: String,
    val recordDate: LocalDate,
    val bodyWeight: Double?,
    val chest: Double?,
    val waist: Double?,
    val arm: Double?,
    val thigh: Double?,
    val notes: String?,
    val createdAt: Instant,
    val updatedAt: Instant,
)
