package com.trainrecorder.domain.model

import kotlinx.datetime.Instant

data class OtherSportType(
    val id: String,
    val displayName: String,
    val isCustom: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant,
)
