package com.trainrecorder.domain.repository

import com.trainrecorder.domain.model.BodyMeasurement
import kotlinx.coroutines.flow.Flow
import kotlinx.datetime.LocalDate

/**
 * Repository for body measurement CRUD and historical queries.
 */
interface BodyDataRepository {
    fun getAll(): Flow<List<BodyMeasurement>>
    fun getByDateRange(start: LocalDate, end: LocalDate): Flow<List<BodyMeasurement>>
    fun getLatest(): Flow<BodyMeasurement?>
    suspend fun create(record: BodyMeasurement): Result<String>
    suspend fun update(record: BodyMeasurement): Result<Unit>
    suspend fun delete(id: String): Result<Unit>
}
