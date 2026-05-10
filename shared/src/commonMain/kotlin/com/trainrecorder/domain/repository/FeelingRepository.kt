package com.trainrecorder.domain.repository

import com.trainrecorder.domain.model.WorkoutFeeling
import kotlinx.coroutines.flow.Flow

/**
 * Input type for exercise-specific feeling notes within a workout.
 */
data class ExerciseFeelingInput(
    val exerciseId: String,
    val notes: String?,
)

/**
 * Repository for workout and exercise feeling CRUD.
 */
interface FeelingRepository {
    suspend fun saveFeeling(
        sessionId: String,
        fatigue: Int,
        satisfaction: Int,
        notes: String?,
        exerciseNotes: List<ExerciseFeelingInput>,
    ): Result<Unit>

    suspend fun updateFeeling(
        feelingId: String,
        fatigue: Int,
        satisfaction: Int,
        notes: String?,
    ): Result<Unit>

    fun getFeelingForSession(sessionId: String): Flow<WorkoutFeeling?>
}
