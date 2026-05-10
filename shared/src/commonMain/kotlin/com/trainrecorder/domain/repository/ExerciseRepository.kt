package com.trainrecorder.domain.repository

import com.trainrecorder.domain.model.Exercise
import com.trainrecorder.domain.model.ExerciseCategory
import kotlinx.coroutines.flow.Flow

/**
 * Repository for exercise CRUD operations and queries.
 */
interface ExerciseRepository {
    fun getAll(): Flow<List<Exercise>>
    fun getByCategory(category: ExerciseCategory): Flow<List<Exercise>>
    fun getById(id: String): Flow<Exercise?>
    fun search(query: String): Flow<List<Exercise>>
    suspend fun create(exercise: Exercise): Result<String>
    suspend fun update(exercise: Exercise): Result<Unit>
    suspend fun delete(id: String): Result<Unit>
    suspend fun seedDefaultExercises(): Result<Unit>
}
