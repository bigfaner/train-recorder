package com.trainrecorder.domain.model

import kotlinx.datetime.Instant

data class OtherSportMetricValue(
    val id: String,
    val sportRecordId: String,
    val metricId: String,
    val metricValue: String,
    val createdAt: Instant,
    val updatedAt: Instant,
)
