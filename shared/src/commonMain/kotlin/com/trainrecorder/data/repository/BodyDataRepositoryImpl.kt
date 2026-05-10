package com.trainrecorder.data.repository

import app.cash.sqldelight.coroutines.asFlow
import app.cash.sqldelight.coroutines.mapToList
import app.cash.sqldelight.coroutines.mapToOneOrNull
import com.trainrecorder.db.TrainRecorderDatabase
import com.trainrecorder.domain.mapper.toDb
import com.trainrecorder.domain.mapper.toDomain
import com.trainrecorder.domain.model.BodyMeasurement
import com.trainrecorder.domain.model.DomainError
import com.trainrecorder.domain.repository.BodyDataRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.datetime.LocalDate

/**
 * SQLDelight-backed implementation of BodyDataRepository.
 * Provides CRUD operations and date-range queries for body measurements.
 */
class BodyDataRepositoryImpl(
    private val database: TrainRecorderDatabase,
) : BodyDataRepository {

    private val queries = database.trainRecorderQueries

    override fun getAll(): Flow<List<BodyMeasurement>> =
        queries.selectAllBodyMeasurementsOrdered().asFlow().mapToList(Dispatchers.IO).map { list ->
            list.map { it.toDomain() }
        }

    override fun getByDateRange(start: LocalDate, end: LocalDate): Flow<List<BodyMeasurement>> =
        queries.selectBodyMeasurementsByDateRange(start.toString(), end.toString())
            .asFlow().mapToList(Dispatchers.IO).map { list ->
                list.map { it.toDomain() }
            }

    override fun getLatest(): Flow<BodyMeasurement?> =
        queries.selectLatestBodyMeasurement().asFlow().mapToOneOrNull(Dispatchers.IO).map { it?.toDomain() }

    override suspend fun create(record: BodyMeasurement): Result<String> = runCatching {
        validate(record)
        val db = record.toDb()
        queries.insertBodyMeasurement(
            id = db.id,
            record_date = db.record_date,
            body_weight = db.body_weight,
            chest = db.chest,
            waist = db.waist,
            arm = db.arm,
            thigh = db.thigh,
            notes = db.notes,
            created_at = db.created_at,
            updated_at = db.updated_at,
        )
        db.id
    }

    override suspend fun update(record: BodyMeasurement): Result<Unit> = runCatching {
        validate(record)
        val existing = queries.selectBodyMeasurementById(record.id).executeAsOneOrNull()
            ?: throw DomainError.BodyMeasurementNotFoundError(record.id)
        val db = record.toDb()
        queries.updateBodyMeasurement(
            record_date = db.record_date,
            body_weight = db.body_weight,
            chest = db.chest,
            waist = db.waist,
            arm = db.arm,
            thigh = db.thigh,
            notes = db.notes,
            updated_at = db.updated_at,
            id = db.id,
        )
    }

    override suspend fun delete(id: String): Result<Unit> = runCatching {
        val existing = queries.selectBodyMeasurementById(id).executeAsOneOrNull()
            ?: throw DomainError.BodyMeasurementNotFoundError(id)
        queries.deleteBodyMeasurementById(id)
    }

    private fun validate(record: BodyMeasurement) {
        if (record.bodyWeight != null && record.bodyWeight <= 0) {
            throw DomainError.ValidationError("bodyWeight", "must be > 0")
        }
        if (record.chest != null && record.chest <= 0) {
            throw DomainError.ValidationError("chest", "must be > 0")
        }
        if (record.waist != null && record.waist <= 0) {
            throw DomainError.ValidationError("waist", "must be > 0")
        }
        if (record.arm != null && record.arm <= 0) {
            throw DomainError.ValidationError("arm", "must be > 0")
        }
        if (record.thigh != null && record.thigh <= 0) {
            throw DomainError.ValidationError("thigh", "must be > 0")
        }
    }
}
