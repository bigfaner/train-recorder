package com.trainrecorder.domain.repository

import com.trainrecorder.domain.model.WeightSuggestion
import kotlinx.coroutines.flow.Flow
import kotlinx.datetime.LocalDate

/**
 * Repository for weight suggestion storage and recalculation.
 */
interface WeightSuggestionRepository {
    fun getSuggestion(exerciseId: String): Flow<WeightSuggestion?>
    suspend fun recalculate(exerciseId: String): Result<Unit>
    suspend fun recalculateChain(fromDate: LocalDate, exerciseId: String): Result<Unit>
}
