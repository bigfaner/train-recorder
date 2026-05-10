package com.trainrecorder.data.repository

import app.cash.sqldelight.coroutines.asFlow
import app.cash.sqldelight.coroutines.mapToList
import app.cash.sqldelight.coroutines.mapToOneOrNull
import com.trainrecorder.db.TrainRecorderDatabase
import com.trainrecorder.domain.mapper.toDb
import com.trainrecorder.domain.mapper.toDomain
import com.trainrecorder.domain.model.DomainError
import com.trainrecorder.domain.model.ExerciseSet
import com.trainrecorder.domain.model.ExerciseStatus
import com.trainrecorder.domain.model.WorkoutStatus
import com.trainrecorder.domain.repository.ExerciseSetInput
import com.trainrecorder.domain.repository.WorkoutExerciseInput
import com.trainrecorder.domain.repository.WorkoutExerciseWithSets
import com.trainrecorder.domain.repository.WorkoutRepository
import com.trainrecorder.domain.repository.WorkoutSessionDetail
import com.trainrecorder.domain.model.WorkoutSession
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDate

/**
 * SQLDelight-backed implementation of WorkoutRepository.
 * All cascade deletes are application-level — no SQL foreign keys.
 */
class WorkoutRepositoryImpl(
    private val database: TrainRecorderDatabase,
) : WorkoutRepository {

    private val queries = database.trainRecorderQueries

    override fun getSessionsByDateRange(
        startDate: LocalDate,
        endDate: LocalDate,
    ): Flow<List<WorkoutSession>> =
        queries.selectSessionsByDateRange(startDate.toString(), endDate.toString())
            .asFlow().mapToList(Dispatchers.IO).map { list ->
                list.map { it.toDomain() }
            }

    override fun getSessionWithDetails(sessionId: String): Flow<WorkoutSessionDetail?> =
        queries.selectSessionById(sessionId).asFlow().mapToOneOrNull(Dispatchers.IO).map { sessionRow ->
            if (sessionRow == null) return@map null
            val session = sessionRow.toDomain()
            val exercises = loadExercisesWithSets(sessionId)
            WorkoutSessionDetail(session, exercises)
        }

    override suspend fun createSession(
        session: WorkoutSession,
        exercises: List<WorkoutExerciseInput>,
    ): Result<String> = runCatching {
        validateSession(session)

        queries.transaction {
            val sessionDb = session.toDb()
            queries.insertSession(
                id = sessionDb.id,
                plan_id = sessionDb.plan_id,
                training_day_id = sessionDb.training_day_id,
                record_date = sessionDb.record_date,
                training_type = sessionDb.training_type,
                workout_status = sessionDb.workout_status,
                started_at = sessionDb.started_at,
                ended_at = sessionDb.ended_at,
                is_backfill = sessionDb.is_backfill,
                created_at = sessionDb.created_at,
                updated_at = sessionDb.updated_at,
            )

            for (input in exercises) {
                val now = Clock.System.now().toString()
                val exerciseId = generateId()
                queries.insertWorkoutExercise(
                    id = exerciseId,
                    workout_session_id = session.id,
                    exercise_id = input.exerciseId,
                    order_index = input.orderIndex.toLong(),
                    note = input.note,
                    suggested_weight = input.suggestedWeight,
                    is_custom_weight = if (input.isCustomWeight) 1L else 0L,
                    target_sets = input.targetSets.toLong(),
                    target_reps = input.targetReps.toLong(),
                    exercise_mode = input.exerciseMode.value,
                    exercise_status = ExerciseStatus.PENDING.value,
                    created_at = now,
                    updated_at = now,
                )
            }
        }
        session.id
    }

    override suspend fun updateSessionStatus(
        sessionId: String,
        status: WorkoutStatus,
    ): Result<Unit> = runCatching {
        val existing = queries.selectSessionById(sessionId).executeAsOneOrNull()
            ?: throw DomainError.SessionNotFoundError(sessionId)

        // Cannot modify a completed session
        if (isSessionLocked(existing.workout_status)) {
            throw DomainError.SessionLockedError(sessionId)
        }

        val now = Clock.System.now().toString()
        val endedAt = if (status == WorkoutStatus.COMPLETED || status == WorkoutStatus.COMPLETED_PARTIAL) {
            now
        } else {
            existing.ended_at
        }
        queries.updateSessionStatus(status.value, endedAt, now, sessionId)
    }

    override suspend fun recordSet(
        workoutExerciseId: String,
        set: ExerciseSetInput,
    ): Result<ExerciseSet> = runCatching {
        // Validate
        if (set.actualWeight <= 0) throw DomainError.InvalidWeightError(set.actualWeight)
        if (set.actualReps != null && set.actualReps < 0) throw DomainError.InvalidRepsError(set.actualReps)

        val exerciseRow = queries.selectWorkoutExerciseById(workoutExerciseId).executeAsOneOrNull()
            ?: throw DomainError.WorkoutExerciseNotFoundError(workoutExerciseId)

        // Check session is not locked
        val sessionRow = queries.selectSessionById(exerciseRow.workout_session_id).executeAsOneOrNull()
            ?: throw DomainError.SessionNotFoundError(exerciseRow.workout_session_id)
        if (isSessionLocked(sessionRow.workout_status)) {
            throw DomainError.SessionLockedError(sessionRow.id)
        }

        val now = Clock.System.now().toString()
        val setId = generateId()
        val isCompleted = set.actualReps != null && set.actualReps >= 0

        queries.insertExerciseSet(
            id = setId,
            workout_exercise_id = workoutExerciseId,
            set_index = set.setIndex.toLong(),
            target_weight = set.targetWeight,
            actual_weight = set.actualWeight,
            target_reps = set.targetReps.toLong(),
            actual_reps = set.actualReps?.toLong(),
            is_completed = if (isCompleted) 1L else 0L,
            rest_started_at = null,
            rest_duration = null,
            created_at = now,
            updated_at = now,
        )

        // Update exercise status to in_progress if it was pending
        if (exerciseRow.exercise_status == ExerciseStatus.PENDING.value) {
            queries.updateWorkoutExerciseStatus(
                exercise_status = ExerciseStatus.IN_PROGRESS.value,
                updated_at = now,
                id = workoutExerciseId,
            )
        }

        queries.selectSetById(setId).executeAsOne().toDomain()
    }

    override suspend fun updateExerciseStatus(
        workoutExerciseId: String,
        status: ExerciseStatus,
    ): Result<Unit> = runCatching {
        val exerciseRow = queries.selectWorkoutExerciseById(workoutExerciseId).executeAsOneOrNull()
            ?: throw DomainError.WorkoutExerciseNotFoundError(workoutExerciseId)

        // Check session is not locked
        val sessionRow = queries.selectSessionById(exerciseRow.workout_session_id).executeAsOneOrNull()
            ?: throw DomainError.SessionNotFoundError(exerciseRow.workout_session_id)
        if (isSessionLocked(sessionRow.workout_status)) {
            throw DomainError.SessionLockedError(sessionRow.id)
        }

        val now = Clock.System.now().toString()
        queries.updateWorkoutExerciseStatus(status.value, now, workoutExerciseId)
    }

    override suspend fun completeSession(sessionId: String): Result<Unit> = runCatching {
        val existing = queries.selectSessionById(sessionId).executeAsOneOrNull()
            ?: throw DomainError.SessionNotFoundError(sessionId)
        if (isSessionLocked(existing.workout_status)) {
            throw DomainError.SessionLockedError(sessionId)
        }
        val now = Clock.System.now().toString()
        queries.updateSessionStatus(WorkoutStatus.COMPLETED.value, now, now, sessionId)
    }

    override suspend fun partialCompleteSession(sessionId: String): Result<Unit> = runCatching {
        val existing = queries.selectSessionById(sessionId).executeAsOneOrNull()
            ?: throw DomainError.SessionNotFoundError(sessionId)
        if (isSessionLocked(existing.workout_status)) {
            throw DomainError.SessionLockedError(sessionId)
        }
        val now = Clock.System.now().toString()
        queries.updateSessionStatus(WorkoutStatus.COMPLETED_PARTIAL.value, now, now, sessionId)
    }

    override suspend fun deleteSession(sessionId: String): Result<Unit> = runCatching {
        val existing = queries.selectSessionById(sessionId).executeAsOneOrNull()
            ?: throw DomainError.SessionNotFoundError(sessionId)

        // Application-level cascade: sets -> exercises -> session
        queries.transaction {
            queries.deleteSetsBySessionId(sessionId)
            queries.deleteWorkoutExercisesBySessionId(sessionId)
            queries.deleteSessionById(sessionId)
        }
    }

    override suspend fun backfillSession(
        session: WorkoutSession,
        exercises: List<WorkoutExerciseWithSets>,
    ): Result<String> = runCatching {
        // Ensure the session is marked as backfill
        val backfillSession = session.copy(isBackfill = true)

        queries.transaction {
            val sessionDb = backfillSession.toDb()
            queries.insertSession(
                id = sessionDb.id,
                plan_id = sessionDb.plan_id,
                training_day_id = sessionDb.training_day_id,
                record_date = sessionDb.record_date,
                training_type = sessionDb.training_type,
                workout_status = sessionDb.workout_status,
                started_at = sessionDb.started_at,
                ended_at = sessionDb.ended_at,
                is_backfill = sessionDb.is_backfill,
                created_at = sessionDb.created_at,
                updated_at = sessionDb.updated_at,
            )

            for (exerciseWithSets in exercises) {
                val we = exerciseWithSets.workoutExercise.toDb()
                queries.insertWorkoutExercise(
                    id = we.id,
                    workout_session_id = we.workout_session_id,
                    exercise_id = we.exercise_id,
                    order_index = we.order_index,
                    note = we.note,
                    suggested_weight = we.suggested_weight,
                    is_custom_weight = we.is_custom_weight,
                    target_sets = we.target_sets,
                    target_reps = we.target_reps,
                    exercise_mode = we.exercise_mode,
                    exercise_status = we.exercise_status,
                    created_at = we.created_at,
                    updated_at = we.updated_at,
                )

                for (set in exerciseWithSets.sets) {
                    val setDb = set.toDb()
                    queries.insertExerciseSet(
                        id = setDb.id,
                        workout_exercise_id = setDb.workout_exercise_id,
                        set_index = setDb.set_index,
                        target_weight = setDb.target_weight,
                        actual_weight = setDb.actual_weight,
                        target_reps = setDb.target_reps,
                        actual_reps = setDb.actual_reps,
                        is_completed = setDb.is_completed,
                        rest_started_at = setDb.rest_started_at,
                        rest_duration = setDb.rest_duration,
                        created_at = setDb.created_at,
                        updated_at = setDb.updated_at,
                    )
                }
            }
        }
        backfillSession.id
    }

    // ============================================================
    // Helpers
    // ============================================================

    private fun isSessionLocked(status: String): Boolean =
        status == WorkoutStatus.COMPLETED.value || status == WorkoutStatus.COMPLETED_PARTIAL.value

    private fun validateSession(session: WorkoutSession) {
        // Basic validation — weight and reps are validated at set level
    }

    private fun loadExercisesWithSets(sessionId: String): List<WorkoutExerciseWithSets> {
        val exerciseRows = queries.selectWorkoutExercisesBySessionId(sessionId).executeAsList()
        return exerciseRows.map { exRow ->
            val exercise = exRow.toDomain()
            val setRows = queries.selectSetsByWorkoutExerciseId(exercise.id).executeAsList()
            val sets = setRows.map { it.toDomain() }
            WorkoutExerciseWithSets(exercise, sets)
        }
    }

    companion object {
        private var idCounter = 0L
        private fun generateId(): String = "id-${java.util.UUID.randomUUID()}"
    }
}
