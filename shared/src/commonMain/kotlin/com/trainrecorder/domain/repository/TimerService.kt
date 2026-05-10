package com.trainrecorder.domain.repository

import com.trainrecorder.domain.model.TimerState
import kotlinx.coroutines.flow.StateFlow

/**
 * Timer service for managing rest period timers between sets.
 * Platform-specific implementations handle background execution.
 */
interface TimerService {
    val remainingSeconds: StateFlow<Int?>
    val timerState: StateFlow<TimerState?>

    suspend fun startTimer(sessionId: String, durationSeconds: Int)
    suspend fun cancelTimer()
    suspend fun resumeFromPersistedState()
}
