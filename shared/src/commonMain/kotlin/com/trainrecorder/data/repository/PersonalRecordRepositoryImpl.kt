package com.trainrecorder.data.repository

import app.cash.sqldelight.coroutines.asFlow
import app.cash.sqldelight.coroutines.mapToList
import app.cash.sqldelight.coroutines.mapToOneOrNull
import com.trainrecorder.db.TrainRecorderDatabase
import com.trainrecorder.domain.mapper.toDomain
import com.trainrecorder.domain.model.PersonalRecord
import com.trainrecorder.domain.repository.PersonalRecordRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDate

/**
 * SQLDelight-backed implementation of PersonalRecordRepository.
 * Tracks max weight and max volume per exercise, auto-updates after workout completion,
 * and recalculates when a workout session is deleted.
 */
class PersonalRecordRepositoryImpl(
    private val database: TrainRecorderDatabase,
) : PersonalRecordRepository {

    private val queries = database.trainRecorderQueries

    override fun getRecord(exerciseId: String): Flow<PersonalRecord?> =
        queries.selectPersonalRecordByExerciseId(exerciseId)
            .asFlow().mapToOneOrNull(Dispatchers.IO).map { it?.toDomain() }

    override fun getAllRecords(): Flow<List<PersonalRecord>> =
        queries.selectAllPersonalRecordsOrdered().asFlow().mapToList(Dispatchers.IO).map { list ->
            list.map { it.toDomain() }
        }

    override suspend fun updateAfterWorkout(sessionId: String): Result<Unit> = runCatching {
        // Get all exercises in this session
        val sessionExercises = queries.selectWorkoutExercisesBySessionId(sessionId).executeAsList()
        val exerciseIds = sessionExercises.map { it.exercise_id }.distinct()

        for (exerciseId in exerciseIds) {
            recalculateForExercise(exerciseId)
        }
    }

    override suspend fun recalculate(exerciseId: String): Result<Unit> = runCatching {
        recalculateForExercise(exerciseId)
    }

    override suspend fun recalculateAll(): Result<Unit> = runCatching {
        // Get all exercises that have completed sets
        val exerciseIds = queries.selectExercisesWithCompletedSets().executeAsList()

        for (exerciseId in exerciseIds) {
            recalculateForExercise(exerciseId)
        }
    }

    /**
     * Recalculate PR for a single exercise:
     * 1. Find the max weight across all completed sets for this exercise
     * 2. Find the max volume (sum of weight*reps per session) for this exercise
     * 3. Insert or update the personal_record row
     */
    private fun recalculateForExercise(exerciseId: String) {
        val maxWeightRow = queries.selectMaxWeightForExercise(exerciseId).executeAsOneOrNull()
        val maxVolumeRow = queries.selectMaxVolumeForExercise(exerciseId).executeAsOneOrNull()

        // If no completed sets exist, remove the PR
        if (maxWeightRow == null && maxVolumeRow == null) {
            queries.deletePersonalRecordByExerciseId(exerciseId)
            return
        }

        val now = Clock.System.now().toString()
        val today = Clock.System.now().toString() // Using full timestamp as date
        val existing = queries.selectPersonalRecordByExerciseId(exerciseId).executeAsOneOrNull()

        val maxWeight = maxWeightRow?.actual_weight ?: 0.0
        val maxWeightDate = maxWeightRow?.record_date ?: today
        val maxWeightSessionId = maxWeightRow?.id ?: ""

        val maxVolume = maxVolumeRow?.SUM ?: 0.0
        val maxVolumeDate = maxVolumeRow?.record_date ?: today
        val maxVolumeSessionId = maxVolumeRow?.id ?: ""

        if (existing != null) {
            queries.updatePersonalRecord(
                max_weight = maxWeight,
                max_volume = maxVolume,
                max_weight_date = maxWeightDate,
                max_volume_date = maxVolumeDate,
                max_weight_session_id = maxWeightSessionId,
                max_volume_session_id = maxVolumeSessionId,
                updated_at = now,
                id = existing.id,
            )
        } else {
            val id = generateId()
            queries.insertPersonalRecord(
                id = id,
                exercise_id = exerciseId,
                max_weight = maxWeight,
                max_volume = maxVolume,
                max_weight_date = maxWeightDate,
                max_volume_date = maxVolumeDate,
                max_weight_session_id = maxWeightSessionId,
                max_volume_session_id = maxVolumeSessionId,
                created_at = now,
                updated_at = now,
            )
        }
    }

    companion object {
        private fun generateId(): String = "id-${java.util.UUID.randomUUID()}"
    }
}
