package com.trainrecorder.domain.model

import kotlinx.datetime.Instant

data class WeightSuggestion(
    val id: String,
    val exerciseId: String,
    val suggestedWeight: Double?,
    val basedOnSessionId: String?,
    val consecutiveCompletions: Int,
    val consecutiveFailures: Int,
    val lastCalculatedAt: Instant,
    val createdAt: Instant,
    val updatedAt: Instant,
) {
    val hint: SuggestionHint
        get() = when {
            suggestedWeight == null -> SuggestionHint.FIRST_TIME
            consecutiveFailures >= 3 -> SuggestionHint.REDUCE_10PC
            consecutiveCompletions >= 3 -> SuggestionHint.GOOD_STATE
            else -> SuggestionHint.NONE
        }
}
