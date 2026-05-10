package com.trainrecorder.data.repository

import com.trainrecorder.db.TrainRecorderDatabase
import com.trainrecorder.domain.mapper.toDomain
import com.trainrecorder.domain.model.TimerState
import com.trainrecorder.domain.repository.TimerService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlin.math.max
import kotlin.time.Duration.Companion.seconds
import kotlin.uuid.ExperimentalUuidApi
import kotlin.uuid.Uuid

/**
 * Platform-agnostic timer notification interface.
 * Platform implementations (Android/iOS) provide notification and background execution support.
 */
interface TimerNotificationHelper {
    /**
     * Show or update a countdown notification.
     * @param remainingSeconds remaining seconds in the countdown
     * @param totalDurationSeconds total duration of the timer
     */
    fun showCountdownNotification(remainingSeconds: Int, totalDurationSeconds: Int)

    /**
     * Show an alert notification when the timer expires.
     */
    fun showAlertNotification()

    /**
     * Cancel any active timer notifications.
     */
    fun cancelNotification()

    /**
     * Start platform-specific background execution mode (e.g., ForegroundService on Android).
     */
    fun startBackgroundExecution()

    /**
     * Stop platform-specific background execution mode.
     */
    fun stopBackgroundExecution()
}

/**
 * Clock provider for testability. Wraps Clock.System in production.
 */
interface TimerClock {
    fun now(): Instant
}

/**
 * SQLDelight-backed implementation of TimerService.
 *
 * Timer is timestamp-based: `start_timestamp + total_duration_seconds` persisted in TimerState table.
 * On app resume, calculate `remaining = start + duration - now`. If `remaining <= 0`, trigger alert.
 *
 * Platform-specific background execution and notifications are delegated to [TimerNotificationHelper].
 *
 * @param coroutineScope optional scope for the countdown ticker. Defaults to [CoroutineScope](Dispatchers.IO).
 *     Inject a test scope for unit tests.
 */
class TimerServiceImpl(
    private val database: TrainRecorderDatabase,
    private val notificationHelper: TimerNotificationHelper,
    private val clock: TimerClock = object : TimerClock {
        override fun now(): Instant = Clock.System.now()
    },
    private val coroutineScope: CoroutineScope = CoroutineScope(Dispatchers.IO),
) : TimerService {

    private val queries = database.trainRecorderQueries

    private val _remainingSeconds = MutableStateFlow<Int?>(null)
    override val remainingSeconds: StateFlow<Int?> = _remainingSeconds.asStateFlow()

    private val _timerState = MutableStateFlow<TimerState?>(null)
    override val timerState: StateFlow<TimerState?> = _timerState.asStateFlow()

    private var tickerJob: Job? = null

    @OptIn(ExperimentalUuidApi::class)
    override suspend fun startTimer(sessionId: String, durationSeconds: Int) {
        // Cancel any existing timer first (silent -- does not call notification helper)
        cancelInternal()

        val now = clock.now()
        val id = Uid.random().toString()
        val nowStr = now.toString()

        // Persist timer state to DB
        queries.insertTimerState(
            id = id,
            workout_session_id = sessionId,
            start_timestamp = nowStr,
            total_duration_seconds = durationSeconds.toLong(),
            is_running = 1L,
            updated_at = nowStr,
        )

        val state = TimerState(
            id = id,
            workoutSessionId = sessionId,
            startTimestamp = now,
            totalDurationSeconds = durationSeconds,
            isRunning = true,
            updatedAt = now,
        )

        _timerState.value = state
        _remainingSeconds.value = durationSeconds

        // Start platform background execution (e.g., Android ForegroundService)
        notificationHelper.startBackgroundExecution()

        // Start countdown ticker
        startTicker(state)
    }

    override suspend fun cancelTimer() {
        val hadTimer = _timerState.value != null

        cancelInternal()

        // Only notify platform when there was an active timer
        if (hadTimer) {
            notificationHelper.stopBackgroundExecution()
            notificationHelper.cancelNotification()
        }
    }

    override suspend fun resumeFromPersistedState() {
        // Look for any running timer in DB
        val persistedState = queries.selectRunningTimerState().executeAsOneOrNull()

        if (persistedState == null) {
            // No persisted timer, clear state
            _timerState.value = null
            _remainingSeconds.value = null
            return
        }

        val state = persistedState.toDomain()
        val remaining = calculateRemainingSeconds(state)

        if (remaining <= 0) {
            // Timer expired while app was away -- trigger alert
            _timerState.value = state.copy(isRunning = false)
            _remainingSeconds.value = 0

            // Clean up persisted state
            queries.updateTimerStateRunning(
                is_running = 0L,
                updated_at = clock.now().toString(),
                id = state.id,
            )

            // Alert notification
            notificationHelper.showAlertNotification()
            notificationHelper.stopBackgroundExecution()
        } else {
            // Timer still running -- resume countdown
            _timerState.value = state
            _remainingSeconds.value = remaining

            notificationHelper.startBackgroundExecution()
            startTicker(state)
        }
    }

    /**
     * Calculate remaining seconds based on timestamp-based calculation.
     * `remaining = start_timestamp + total_duration_seconds - now`
     */
    internal fun calculateRemainingSeconds(state: TimerState): Int {
        val endTime = state.startTimestamp + state.totalDurationSeconds.seconds
        val now = clock.now()
        val remainingEpochSeconds = endTime.epochSeconds - now.epochSeconds
        return max(0, remainingEpochSeconds.toInt())
    }

    /**
     * Internal cancel: stops ticker and clears state without notifying platform.
     * Used when switching timers or when no timer was running.
     */
    private fun cancelInternal() {
        tickerJob?.cancel()
        tickerJob = null

        // Delete persisted state
        val currentState = _timerState.value
        if (currentState != null) {
            queries.deleteTimerStateById(currentState.id)
        }

        // Clear state
        _timerState.value = null
        _remainingSeconds.value = null
    }

    /**
     * Start a coroutine ticker that updates remaining seconds every second.
     * When timer expires, triggers alert notification.
     */
    private fun startTicker(state: TimerState) {
        tickerJob?.cancel()
        tickerJob = coroutineScope.launch {
            while (isActive) {
                val remaining = calculateRemainingSeconds(state)
                _remainingSeconds.value = remaining

                if (remaining <= 0) {
                    // Timer expired
                    _timerState.value = state.copy(isRunning = false)
                    queries.updateTimerStateRunning(
                        is_running = 0L,
                        updated_at = clock.now().toString(),
                        id = state.id,
                    )
                    notificationHelper.showAlertNotification()
                    notificationHelper.stopBackgroundExecution()
                    break
                }

                // Update notification with remaining time
                notificationHelper.showCountdownNotification(remaining, state.totalDurationSeconds)
                delay(TICK_INTERVAL_MS)
            }
        }
    }

    companion object {
        /** Ticker interval in milliseconds. */
        const val TICK_INTERVAL_MS = 1000L
    }
}

/**
 * UUID generation utility. Provides platform-agnostic unique ID generation.
 */
internal object Uid {
    @OptIn(ExperimentalUuidApi::class)
    fun random(): String = Uuid.random().toString()
}
