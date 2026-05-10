package com.trainrecorder.domain.model

import kotlinx.datetime.Instant
import kotlinx.serialization.Serializable

@Serializable
data class TrainingDay(
    val id: String,
    val planId: String,
    val displayName: String,
    val dayType: TrainingType,
    val orderIndex: Int,
    val createdAt: Instant,
    val updatedAt: Instant,
)
