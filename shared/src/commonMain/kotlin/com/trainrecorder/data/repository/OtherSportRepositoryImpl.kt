package com.trainrecorder.data.repository

import app.cash.sqldelight.coroutines.asFlow
import app.cash.sqldelight.coroutines.mapToList
import com.trainrecorder.db.TrainRecorderDatabase
import com.trainrecorder.domain.mapper.toDb
import com.trainrecorder.domain.mapper.toDomain
import com.trainrecorder.domain.model.DomainError
import com.trainrecorder.domain.model.OtherSportMetricValue
import com.trainrecorder.domain.model.OtherSportRecord
import com.trainrecorder.domain.model.OtherSportType
import com.trainrecorder.domain.repository.OtherSportRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.datetime.LocalDate

/**
 * SQLDelight-backed implementation of OtherSportRepository.
 * Provides sport type CRUD with metric configuration, and record creation with metric values.
 */
class OtherSportRepositoryImpl(
    private val database: TrainRecorderDatabase,
) : OtherSportRepository {

    private val queries = database.trainRecorderQueries

    // ============================================================
    // Sport Types
    // ============================================================

    override fun getSportTypes(): Flow<List<OtherSportType>> =
        queries.selectAllSportTypes().asFlow().mapToList(Dispatchers.IO).map { list ->
            list.map { it.toDomain() }
        }

    override suspend fun createSportType(
        type: OtherSportType,
        metrics: List<com.trainrecorder.domain.model.OtherSportMetric>,
    ): Result<String> = runCatching {
        val typeDb = type.toDb()
        queries.transaction {
            try {
                queries.insertSportType(
                    id = typeDb.id,
                    display_name = typeDb.display_name,
                    is_custom = typeDb.is_custom,
                    created_at = typeDb.created_at,
                    updated_at = typeDb.updated_at,
                )
            } catch (e: Exception) {
                val msg = e.message ?: ""
                if (msg.contains("UNIQUE", ignoreCase = true)) {
                    throw DomainError.DuplicateSportTypeNameError(type.displayName)
                }
                throw e
            }

            for (metric in metrics) {
                val metricDb = metric.toDb()
                queries.insertSportMetric(
                    id = metricDb.id,
                    sport_type_id = metricDb.sport_type_id,
                    metric_name = metricDb.metric_name,
                    metric_key = metricDb.metric_key,
                    input_type = metricDb.input_type,
                    is_required = metricDb.is_required,
                    unit = metricDb.unit,
                    created_at = metricDb.created_at,
                    updated_at = metricDb.updated_at,
                )
            }
        }
        type.id
    }

    // ============================================================
    // Sport Records
    // ============================================================

    override fun getRecordsByDateRange(start: LocalDate, end: LocalDate): Flow<List<OtherSportRecord>> =
        queries.selectSportRecordsByDateRange(start.toString(), end.toString())
            .asFlow().mapToList(Dispatchers.IO).map { list ->
                list.map { it.toDomain() }
            }

    override suspend fun createRecord(
        record: OtherSportRecord,
        metricValues: List<OtherSportMetricValue>,
    ): Result<String> = runCatching {
        val recordDb = record.toDb()
        queries.transaction {
            queries.insertSportRecord(
                id = recordDb.id,
                sport_type_id = recordDb.sport_type_id,
                record_date = recordDb.record_date,
                notes = recordDb.notes,
                created_at = recordDb.created_at,
                updated_at = recordDb.updated_at,
            )

            for (mv in metricValues) {
                val mvDb = mv.toDb()
                queries.insertSportMetricValue(
                    id = mvDb.id,
                    sport_record_id = mvDb.sport_record_id,
                    metric_id = mvDb.metric_id,
                    metric_value = mvDb.metric_value,
                    created_at = mvDb.created_at,
                    updated_at = mvDb.updated_at,
                )
            }
        }
        record.id
    }

    override suspend fun deleteRecord(id: String): Result<Unit> = runCatching {
        val existing = queries.selectSportRecordById(id).executeAsOneOrNull()
            ?: throw DomainError.OtherSportRecordNotFoundError(id)
        queries.transaction {
            queries.deleteMetricValuesByRecordId(id)
            queries.deleteSportRecordById(id)
        }
    }
}
