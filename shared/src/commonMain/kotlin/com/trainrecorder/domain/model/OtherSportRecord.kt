package com.trainrecorder.domain.model

import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate

data class OtherSportRecord(
    val id: String,
    val sportTypeId: String,
    val recordDate: LocalDate,
    val notes: String?,
    val createdAt: Instant,
    val updatedAt: Instant,
)
