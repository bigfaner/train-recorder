package com.trainrecorder.data.repository

import app.cash.sqldelight.coroutines.asFlow
import app.cash.sqldelight.coroutines.mapToList
import app.cash.sqldelight.coroutines.mapToOneOrNull
import com.trainrecorder.db.TrainRecorderDatabase
import com.trainrecorder.domain.mapper.toDb
import com.trainrecorder.domain.mapper.toDomain
import com.trainrecorder.domain.model.DomainError
import com.trainrecorder.domain.model.TrainingDayExercise
import com.trainrecorder.domain.model.TrainingDaySetConfig
import com.trainrecorder.domain.model.TrainingPlan
import com.trainrecorder.domain.repository.PlanWithDays
import com.trainrecorder.domain.repository.TrainingDayWithExercises
import com.trainrecorder.domain.repository.TrainingPlanRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.datetime.Clock

/**
 * SQLDelight-backed implementation of TrainingPlanRepository.
 * All nested operations (days, exercises, set configs) use application-level cascade
 * within a single transaction — no SQL foreign keys.
 */
class TrainingPlanRepositoryImpl(
    private val database: TrainRecorderDatabase,
) : TrainingPlanRepository {

    private val queries = database.trainRecorderQueries

    override fun getActivePlan(): Flow<TrainingPlan?> =
        queries.selectActivePlan().asFlow().mapToOneOrNull(Dispatchers.IO).map { it?.toDomain() }

    override fun getAllPlans(): Flow<List<TrainingPlan>> =
        queries.selectAllPlans().asFlow().mapToList(Dispatchers.IO).map { list ->
            list.map { it.toDomain() }
        }

    override fun getPlanWithDays(planId: String): Flow<PlanWithDays?> =
        queries.selectPlanById(planId).asFlow().mapToOneOrNull(Dispatchers.IO).map { planRow ->
            if (planRow == null) return@map null
            val plan = planRow.toDomain()
            val days = loadDaysWithExercises(planId)
            PlanWithDays(plan, days)
        }

    override suspend fun createPlan(
        plan: TrainingPlan,
        days: List<TrainingDayWithExercises>,
    ): Result<String> = runCatching {
        queries.transaction {
            val planDb = plan.toDb()
            queries.insertPlan(
                id = planDb.id,
                display_name = planDb.display_name,
                plan_mode = planDb.plan_mode,
                cycle_length = planDb.cycle_length,
                schedule_mode = planDb.schedule_mode,
                interval_days = planDb.interval_days,
                is_active = planDb.is_active,
                created_at = planDb.created_at,
                updated_at = planDb.updated_at,
            )

            if (plan.isActive) {
                // Deactivate all other plans
                queries.deactivateAllPlans(Clock.System.now().toString())
                // Re-activate this plan
                queries.activatePlan(Clock.System.now().toString(), plan.id)
            }

            insertDaysAndExercises(days)
        }
        plan.id
    }

    override suspend fun updatePlan(
        plan: TrainingPlan,
        days: List<TrainingDayWithExercises>,
    ): Result<Unit> = runCatching {
        val existing = queries.selectPlanById(plan.id).executeAsOneOrNull()
            ?: throw DomainError.PlanNotFoundError(plan.id)

        queries.transaction {
            val planDb = plan.toDb()
            queries.updatePlan(
                display_name = planDb.display_name,
                plan_mode = planDb.plan_mode,
                cycle_length = planDb.cycle_length,
                schedule_mode = planDb.schedule_mode,
                interval_days = planDb.interval_days,
                updated_at = planDb.updated_at,
                id = planDb.id,
            )

            if (plan.isActive) {
                queries.deactivateAllPlans(Clock.System.now().toString())
                queries.activatePlan(Clock.System.now().toString(), plan.id)
            }

            // Delete old nested data (application-level cascade)
            // Order: set configs -> exercises -> days
            queries.deleteSetConfigsByDayExerciseId(plan.id)
            queries.deleteExercisesByPlanId(plan.id)
            queries.deleteDaysByPlanId(plan.id)

            // Re-insert new nested data
            insertDaysAndExercises(days)
        }
    }

    override suspend fun activatePlan(planId: String): Result<Unit> = runCatching {
        val existing = queries.selectPlanById(planId).executeAsOneOrNull()
            ?: throw DomainError.PlanNotFoundError(planId)

        queries.transaction {
            val now = Clock.System.now().toString()
            queries.deactivateAllPlans(now)
            queries.activatePlan(now, planId)
        }
    }

    override suspend fun deletePlan(planId: String): Result<Unit> = runCatching {
        val existing = queries.selectPlanById(planId).executeAsOneOrNull()
            ?: throw DomainError.PlanNotFoundError(planId)

        queries.transaction {
            // Application-level cascade: set configs -> exercises -> days -> plan
            queries.deleteSetConfigsByDayExerciseId(planId)
            queries.deleteExercisesByPlanId(planId)
            queries.deleteDaysByPlanId(planId)
            queries.deletePlanById(planId)
        }
    }

    /**
     * Inserts training days, their exercises, and set configs.
     * Must be called within an existing transaction.
     */
    private fun insertDaysAndExercises(days: List<TrainingDayWithExercises>) {
        for (dayWithExercises in days) {
            val day = dayWithExercises.day
            val dayDb = day.toDb()
            queries.insertDay(
                id = dayDb.id,
                plan_id = dayDb.plan_id,
                display_name = dayDb.display_name,
                day_type = dayDb.day_type,
                order_index = dayDb.order_index,
                created_at = dayDb.created_at,
                updated_at = dayDb.updated_at,
            )

            for (exercise in dayWithExercises.exercises) {
                insertExercise(exercise)
            }
        }
    }

    private fun insertExercise(exercise: TrainingDayExercise) {
        val exDb = exercise.toDb()
        queries.insertDayExercise(
            id = exDb.id,
            training_day_id = exDb.training_day_id,
            exercise_id = exDb.exercise_id,
            order_index = exDb.order_index,
            exercise_mode = exDb.exercise_mode,
            target_sets = exDb.target_sets,
            target_reps = exDb.target_reps,
            start_weight = exDb.start_weight,
            note = exDb.note,
            rest_seconds = exDb.rest_seconds,
            weight_increment = exDb.weight_increment,
            created_at = exDb.created_at,
            updated_at = exDb.updated_at,
        )
    }

    /**
     * Loads training days with their exercises for a given plan.
     * NOT inside a transaction — caller should handle if needed.
     */
    private fun loadDaysWithExercises(planId: String): List<TrainingDayWithExercises> {
        val dayRows = queries.selectDaysByPlanId(planId).executeAsList()
        return dayRows.map { dayRow ->
            val day = dayRow.toDomain()
            val exerciseRows = queries.selectExercisesByDayId(day.id).executeAsList()
            val exercises = exerciseRows.map { it.toDomain() }
            TrainingDayWithExercises(day, exercises)
        }
    }
}
