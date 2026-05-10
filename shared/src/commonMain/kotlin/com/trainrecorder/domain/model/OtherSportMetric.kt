package com.trainrecorder.domain.model

import kotlinx.datetime.Instant

data class OtherSportMetric(
    val id: String,
    val sportTypeId: String,
    val metricName: String,
    val metricKey: String,
    val inputType: MetricInputType,
    val isRequired: Boolean,
    val unit: String?,
    val createdAt: Instant,
    val updatedAt: Instant,
)
