package com.trainrecorder.data.repository

import app.cash.sqldelight.coroutines.asFlow
import app.cash.sqldelight.coroutines.mapToOneOrNull
import com.trainrecorder.db.TrainRecorderDatabase
import com.trainrecorder.domain.mapper.toDb
import com.trainrecorder.domain.mapper.toDomain
import com.trainrecorder.domain.model.DomainError
import com.trainrecorder.domain.model.WorkoutFeeling
import com.trainrecorder.domain.repository.ExerciseFeelingInput
import com.trainrecorder.domain.repository.FeelingRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.datetime.Clock

/**
 * SQLDelight-backed implementation of FeelingRepository.
 * Provides save/update for workout feelings and exercise-level notes.
 */
class FeelingRepositoryImpl(
    private val database: TrainRecorderDatabase,
) : FeelingRepository {

    private val queries = database.trainRecorderQueries

    override suspend fun saveFeeling(
        sessionId: String,
        fatigue: Int,
        satisfaction: Int,
        notes: String?,
        exerciseNotes: List<ExerciseFeelingInput>,
    ): Result<Unit> = runCatching {
        validateFatigueSatisfaction(fatigue, satisfaction)

        // Check if a feeling already exists for this session
        val existing = queries.selectFeelingBySessionId(sessionId).executeAsOneOrNull()
        if (existing != null) {
            throw DomainError.ValidationError("feeling", "Feeling already exists for session $sessionId")
        }

        val now = Clock.System.now().toString()
        val feelingId = generateId()

        queries.transaction {
            queries.insertWorkoutFeeling(
                id = feelingId,
                workout_session_id = sessionId,
                fatigue_level = fatigue.toLong(),
                satisfaction_level = satisfaction.toLong(),
                notes = notes,
                created_at = now,
                updated_at = now,
            )

            for (exerciseNote in exerciseNotes) {
                queries.insertExerciseFeeling(
                    id = generateId(),
                    workout_feeling_id = feelingId,
                    exercise_id = exerciseNote.exerciseId,
                    notes = exerciseNote.notes,
                    created_at = now,
                    updated_at = now,
                )
            }
        }
    }

    override suspend fun updateFeeling(
        feelingId: String,
        fatigue: Int,
        satisfaction: Int,
        notes: String?,
    ): Result<Unit> = runCatching {
        validateFatigueSatisfaction(fatigue, satisfaction)

        val existing = queries.selectFeelingById(feelingId).executeAsOneOrNull()
            ?: throw DomainError.FeelingNotFoundError(feelingId)

        val now = Clock.System.now().toString()
        queries.updateWorkoutFeeling(
            fatigue_level = fatigue.toLong(),
            satisfaction_level = satisfaction.toLong(),
            notes = notes,
            updated_at = now,
            id = feelingId,
        )
    }

    override fun getFeelingForSession(sessionId: String): Flow<WorkoutFeeling?> =
        queries.selectFeelingBySessionId(sessionId).asFlow().mapToOneOrNull(Dispatchers.IO).map { it?.toDomain() }

    private fun validateFatigueSatisfaction(fatigue: Int, satisfaction: Int) {
        if (fatigue < 1 || fatigue > 10) {
            throw DomainError.ValidationError("fatigue", "must be between 1 and 10")
        }
        if (satisfaction < 1 || satisfaction > 10) {
            throw DomainError.ValidationError("satisfaction", "must be between 1 and 10")
        }
    }

    companion object {
        private fun generateId(): String = "id-${java.util.UUID.randomUUID()}"
    }
}
