package com.trainrecorder.domain.repository

import com.trainrecorder.domain.model.PersonalRecord
import kotlinx.coroutines.flow.Flow

/**
 * Repository for personal record tracking and recalculation.
 */
interface PersonalRecordRepository {
    fun getRecord(exerciseId: String): Flow<PersonalRecord?>
    fun getAllRecords(): Flow<List<PersonalRecord>>
    suspend fun updateAfterWorkout(sessionId: String): Result<Unit>
    suspend fun recalculate(exerciseId: String): Result<Unit>
    suspend fun recalculateAll(): Result<Unit>
}
