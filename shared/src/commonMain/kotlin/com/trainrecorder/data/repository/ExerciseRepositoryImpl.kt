package com.trainrecorder.data.repository

import app.cash.sqldelight.coroutines.asFlow
import app.cash.sqldelight.coroutines.mapToList
import app.cash.sqldelight.coroutines.mapToOneOrNull
import com.trainrecorder.db.TrainRecorderDatabase
import com.trainrecorder.domain.mapper.toDb
import com.trainrecorder.domain.mapper.toDomain
import com.trainrecorder.domain.model.DomainError
import com.trainrecorder.domain.model.Exercise
import com.trainrecorder.domain.model.ExerciseCategory
import com.trainrecorder.domain.repository.ExerciseRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

/**
 * SQLDelight-backed implementation of ExerciseRepository.
 */
class ExerciseRepositoryImpl(
    private val database: TrainRecorderDatabase,
) : ExerciseRepository {

    private val queries = database.trainRecorderQueries

    override fun getAll(): Flow<List<Exercise>> =
        queries.selectAllExercises().asFlow().mapToList(Dispatchers.IO).map { list ->
            list.map { it.toDomain() }
        }

    override fun getByCategory(category: ExerciseCategory): Flow<List<Exercise>> =
        queries.selectExercisesByCategory(category.value).asFlow().mapToList(Dispatchers.IO).map { list ->
            list.map { it.toDomain() }
        }

    override fun getById(id: String): Flow<Exercise?> =
        queries.selectExerciseById(id).asFlow().mapToOneOrNull(Dispatchers.IO).map { it?.toDomain() }

    override fun search(query: String): Flow<List<Exercise>> =
        queries.searchExercises(query).asFlow().mapToList(Dispatchers.IO).map { list ->
            list.map { it.toDomain() }
        }

    override suspend fun create(exercise: Exercise): Result<String> = runCatching {
        try {
            val db = exercise.toDb()
            queries.insertExercise(
                id = db.id,
                display_name = db.display_name,
                category = db.category,
                weight_increment = db.weight_increment,
                default_rest = db.default_rest,
                is_custom = db.is_custom,
                created_at = db.created_at,
                updated_at = db.updated_at,
            )
            db.id
        } catch (e: Exception) {
            throw mapException(e, exercise.displayName)
        }
    }

    override suspend fun update(exercise: Exercise): Result<Unit> = runCatching {
        val db = exercise.toDb()
        queries.updateExercise(
            display_name = db.display_name,
            category = db.category,
            weight_increment = db.weight_increment,
            default_rest = db.default_rest,
            is_custom = db.is_custom,
            updated_at = db.updated_at,
            id = db.id,
        )
        if (queries.selectExerciseById(db.id).executeAsOneOrNull() == null) {
            throw DomainError.ExerciseNotFoundError(db.id)
        }
    }

    override suspend fun delete(id: String): Result<Unit> = runCatching {
        // Check if exercise is referenced by any training plan
        val refCount = queries.countExerciseReferences(id).executeAsOne()
        if (refCount > 0) {
            throw DomainError.ExerciseInUseError(id)
        }
        queries.deleteExercise(id)
    }

    override suspend fun seedDefaultExercises(): Result<Unit> = runCatching {
        val now = kotlinx.datetime.Instant.fromEpochMilliseconds(0).toString()

        val defaults = listOf(
            // core (力量举核心)
            Triple("深蹲", ExerciseCategory.CORE, 5.0 to 180),
            Triple("卧推", ExerciseCategory.CORE, 2.5 to 180),
            Triple("硬拉", ExerciseCategory.CORE, 5.0 to 180),
            Triple("推举", ExerciseCategory.CORE, 2.5 to 180),

            // upper_push (上肢推)
            Triple("上斜卧推", ExerciseCategory.UPPER_PUSH, 2.5 to 120),
            Triple("哑铃卧推", ExerciseCategory.UPPER_PUSH, 2.5 to 90),
            Triple("双杠臂屈伸", ExerciseCategory.UPPER_PUSH, 2.5 to 120),

            // upper_pull (上肢拉)
            Triple("杠铃划船", ExerciseCategory.UPPER_PULL, 2.5 to 120),
            Triple("引体向上", ExerciseCategory.UPPER_PULL, 2.5 to 150),
            Triple("高位下拉", ExerciseCategory.UPPER_PULL, 2.5 to 90),
            Triple("哑铃划船", ExerciseCategory.UPPER_PULL, 2.5 to 90),

            // lower (下肢)
            Triple("前蹲", ExerciseCategory.LOWER, 2.5 to 150),
            Triple("腿举", ExerciseCategory.LOWER, 5.0 to 120),
            Triple("罗马尼亚硬拉", ExerciseCategory.LOWER, 2.5 to 120),
            Triple("腿弯举", ExerciseCategory.LOWER, 2.5 to 60),

            // abs_core (核心)
            Triple("卷腹", ExerciseCategory.ABS_CORE, 2.5 to 60),
            Triple("平板支撑", ExerciseCategory.ABS_CORE, 5.0 to 60),
            Triple("健腹轮", ExerciseCategory.ABS_CORE, 2.5 to 90),

            // shoulder (肩部)
            Triple("侧平举", ExerciseCategory.SHOULDER, 1.0 to 60),
            Triple("面拉", ExerciseCategory.SHOULDER, 1.0 to 60),
            Triple("推举哑铃", ExerciseCategory.SHOULDER, 2.5 to 90),
        )

        queries.transaction {
            defaults.forEach { (name, category, props) ->
                // INSERT OR IGNORE so repeated calls are idempotent
                queries.insertOrIgnoreExercise(
                    id = generateDefaultId(name),
                    display_name = name,
                    category = category.value,
                    weight_increment = props.first,
                    default_rest = props.second.toLong(),
                    is_custom = 0L,
                    created_at = now,
                    updated_at = now,
                )
            }
        }
    }

    private fun mapException(e: Exception, name: String): DomainError {
        val msg = e.message ?: ""
        return if (msg.contains("UNIQUE", ignoreCase = true)) {
            DomainError.DuplicateExerciseNameError(name)
        } else {
            DomainError.ExerciseNotFoundError(name)
        }
    }

    companion object {
        /**
         * Generates a stable deterministic ID for default exercises based on name.
         * This ensures seedDefaultExercises is idempotent with INSERT OR IGNORE.
         */
        private fun generateDefaultId(name: String): String {
            // Use a simple deterministic approach: "default-" + hex of name hash
            val hash = name.hashCode().toUInt()
            return "default-${hash.toString(16).padStart(8, '0')}"
        }
    }
}
