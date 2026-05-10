package com.trainrecorder.domain.repository

import com.trainrecorder.domain.model.TrainingDay
import com.trainrecorder.domain.model.TrainingDayExercise
import com.trainrecorder.domain.model.TrainingPlan
import kotlinx.coroutines.flow.Flow

/**
 * Composite type: a training day with its configured exercises.
 */
data class TrainingDayWithExercises(
    val day: TrainingDay,
    val exercises: List<TrainingDayExercise>,
)

/**
 * Composite type: a plan with all its days and their exercises.
 */
data class PlanWithDays(
    val plan: TrainingPlan,
    val days: List<TrainingDayWithExercises>,
)

/**
 * Repository for training plan CRUD and lifecycle management.
 */
interface TrainingPlanRepository {
    fun getActivePlan(): Flow<TrainingPlan?>
    fun getAllPlans(): Flow<List<TrainingPlan>>
    fun getPlanWithDays(planId: String): Flow<PlanWithDays?>
    suspend fun createPlan(plan: TrainingPlan, days: List<TrainingDayWithExercises>): Result<String>
    suspend fun updatePlan(plan: TrainingPlan, days: List<TrainingDayWithExercises>): Result<Unit>
    suspend fun activatePlan(planId: String): Result<Unit>
    suspend fun deletePlan(planId: String): Result<Unit>
}
