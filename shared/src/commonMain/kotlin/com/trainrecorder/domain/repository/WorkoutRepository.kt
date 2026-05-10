package com.trainrecorder.domain.repository

import com.trainrecorder.domain.model.ExerciseSet
import com.trainrecorder.domain.model.ExerciseStatus
import com.trainrecorder.domain.model.WorkoutExercise
import com.trainrecorder.domain.model.WorkoutSession
import com.trainrecorder.domain.model.WorkoutStatus
import kotlinx.coroutines.flow.Flow
import kotlinx.datetime.LocalDate

/**
 * Input type for creating a workout exercise within a session.
 */
data class WorkoutExerciseInput(
    val exerciseId: String,
    val orderIndex: Int,
    val note: String? = null,
    val suggestedWeight: Double? = null,
    val isCustomWeight: Boolean = false,
    val targetSets: Int,
    val targetReps: Int,
    val exerciseMode: com.trainrecorder.domain.model.ExerciseMode,
)

/**
 * Input type for recording a single exercise set.
 */
data class ExerciseSetInput(
    val setIndex: Int,
    val targetWeight: Double,
    val actualWeight: Double,
    val targetReps: Int,
    val actualReps: Int?,
)

/**
 * Composite type: a workout exercise with all its recorded sets.
 */
data class WorkoutExerciseWithSets(
    val workoutExercise: WorkoutExercise,
    val sets: List<ExerciseSet>,
)

/**
 * Composite type: full session detail with exercises and sets.
 */
data class WorkoutSessionDetail(
    val session: WorkoutSession,
    val exercises: List<WorkoutExerciseWithSets>,
)

/**
 * Repository for workout session lifecycle, exercise and set recording.
 */
interface WorkoutRepository {
    fun getSessionsByDateRange(startDate: LocalDate, endDate: LocalDate): Flow<List<WorkoutSession>>
    fun getSessionWithDetails(sessionId: String): Flow<WorkoutSessionDetail?>
    suspend fun createSession(
        session: WorkoutSession,
        exercises: List<WorkoutExerciseInput>,
    ): Result<String>

    suspend fun updateSessionStatus(sessionId: String, status: WorkoutStatus): Result<Unit>
    suspend fun recordSet(workoutExerciseId: String, set: ExerciseSetInput): Result<ExerciseSet>
    suspend fun updateExerciseStatus(
        workoutExerciseId: String,
        status: ExerciseStatus,
    ): Result<Unit>

    suspend fun completeSession(sessionId: String): Result<Unit>
    suspend fun partialCompleteSession(sessionId: String): Result<Unit>
    suspend fun deleteSession(sessionId: String): Result<Unit>
    suspend fun backfillSession(
        session: WorkoutSession,
        exercises: List<WorkoutExerciseWithSets>,
    ): Result<String>
}
