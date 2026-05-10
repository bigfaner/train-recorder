package com.trainrecorder.domain.repository

import com.trainrecorder.domain.model.OtherSportMetric
import com.trainrecorder.domain.model.OtherSportMetricValue
import com.trainrecorder.domain.model.OtherSportRecord
import com.trainrecorder.domain.model.OtherSportType
import kotlinx.coroutines.flow.Flow
import kotlinx.datetime.LocalDate

/**
 * Repository for other sport types, metrics, records, and metric values.
 */
interface OtherSportRepository {
    // Sport types
    fun getSportTypes(): Flow<List<OtherSportType>>
    suspend fun createSportType(
        type: OtherSportType,
        metrics: List<OtherSportMetric>,
    ): Result<String>

    // Sport records
    fun getRecordsByDateRange(start: LocalDate, end: LocalDate): Flow<List<OtherSportRecord>>
    suspend fun createRecord(
        record: OtherSportRecord,
        metricValues: List<OtherSportMetricValue>,
    ): Result<String>

    suspend fun deleteRecord(id: String): Result<Unit>
}
