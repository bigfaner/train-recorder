package com.trainrecorder.data.repository

import com.trainrecorder.createTestDatabase
import com.trainrecorder.db.TrainRecorderDatabase
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue
import kotlin.time.Duration.Companion.milliseconds
import kotlin.time.Duration.Companion.seconds

/**
 * Fake clock for controlling time in tests.
 */
class FakeClock(private var currentTime: Instant) : TimerClock {
    override fun now(): Instant = currentTime

    fun advanceSeconds(seconds: Int) {
        currentTime = currentTime + seconds.seconds
    }

    fun advanceMillis(millis: Long) {
        currentTime = currentTime + millis.milliseconds
    }
}

/**
 * Fake notification helper that records calls.
 */
class FakeNotificationHelper : TimerNotificationHelper {
    val countdownCalls = mutableListOf<Pair<Int, Int>>() // (remaining, total)
    var alertCallCount = 0
    var cancelCallCount = 0
    var startBackgroundCallCount = 0
    var stopBackgroundCallCount = 0

    override fun showCountdownNotification(remainingSeconds: Int, totalDurationSeconds: Int) {
        countdownCalls.add(remainingSeconds to totalDurationSeconds)
    }

    override fun showAlertNotification() {
        alertCallCount++
    }

    override fun cancelNotification() {
        cancelCallCount++
    }

    override fun startBackgroundExecution() {
        startBackgroundCallCount++
    }

    override fun stopBackgroundExecution() {
        stopBackgroundCallCount++
    }
}

class TimerServiceImplTest {

    private val testStartTime = Instant.parse("2026-01-15T10:30:00Z")

    private fun createService(
        clock: FakeClock = FakeClock(testStartTime),
    ): Triple<TimerServiceImpl, FakeClock, FakeNotificationHelper> {
        val db = createTestDatabase()
        val notificationHelper = FakeNotificationHelper()
        val service = TimerServiceImpl(db, notificationHelper, clock)
        return Triple(service, clock, notificationHelper)
    }

    /**
     * Create a service and its underlying DB for direct DB manipulation in tests.
     */
    private fun createServiceWithDb(
        clock: FakeClock = FakeClock(testStartTime),
    ): ServiceWithDb {
        val db = createTestDatabase()
        val notificationHelper = FakeNotificationHelper()
        val service = TimerServiceImpl(db, notificationHelper, clock)
        return ServiceWithDb(service, clock, notificationHelper, db)
    }

    data class ServiceWithDb(
        val service: TimerServiceImpl,
        val clock: FakeClock,
        val helper: FakeNotificationHelper,
        val db: TrainRecorderDatabase,
    )

    // ============================================================
    // Start Timer
    // ============================================================

    @Test
    fun testStartTimer_persistsStateToDb() = runTest {
        val env = createServiceWithDb()
        val (service, _, _, db) = env

        service.startTimer("session-1", 180)

        val state = service.timerState.value
        assertNotNull(state)
        assertEquals("session-1", state.workoutSessionId)
        assertEquals(180, state.totalDurationSeconds)
        assertTrue(state.isRunning)
        assertEquals(testStartTime, state.startTimestamp)

        // Verify in DB directly
        val dbState = db.trainRecorderQueries.selectTimerStateBySessionId("session-1").executeAsOneOrNull()
        assertNotNull(dbState)
        assertEquals(180L, dbState.total_duration_seconds)
    }

    @Test
    fun testStartTimer_setsInitialRemainingSeconds() = runTest {
        val (service, _, _) = createService()

        service.startTimer("session-1", 120)

        assertEquals(120, service.remainingSeconds.value)
    }

    @Test
    fun testStartTimer_startsBackgroundExecution() = runTest {
        val (service, _, helper) = createService()

        service.startTimer("session-1", 90)

        assertEquals(1, helper.startBackgroundCallCount)
    }

    @Test
    fun testStartTimer_cancelsPreviousTimer() = runTest {
        val env = createServiceWithDb()
        val (service, _, helper, db) = env

        service.startTimer("session-1", 90)
        service.startTimer("session-2", 120)

        val state = service.timerState.value
        assertNotNull(state)
        assertEquals("session-2", state.workoutSessionId)
        assertEquals(120, state.totalDurationSeconds)
        // Starting new timer uses internal cancel (no notification calls)
        assertEquals(0, helper.cancelCallCount)
        assertEquals(0, helper.stopBackgroundCallCount)
        assertEquals(2, helper.startBackgroundCallCount)

        // Old timer should be removed from DB
        val oldTimer = db.trainRecorderQueries.selectTimerStateBySessionId("session-1").executeAsOneOrNull()
        assertNull(oldTimer)
    }

    // ============================================================
    // Cancel Timer
    // ============================================================

    @Test
    fun testCancelTimer_clearsState() = runTest {
        val (service, _, _) = createService()

        service.startTimer("session-1", 180)
        service.cancelTimer()

        assertNull(service.timerState.value)
        assertNull(service.remainingSeconds.value)
    }

    @Test
    fun testCancelTimer_stopsBackgroundExecution() = runTest {
        val (service, _, helper) = createService()

        service.startTimer("session-1", 180)
        service.cancelTimer()

        assertEquals(1, helper.stopBackgroundCallCount)
        assertEquals(1, helper.cancelCallCount)
    }

    @Test
    fun testCancelTimer_whenNoTimerIsRunning_isNoop() = runTest {
        val (service, _, helper) = createService()

        service.cancelTimer()

        assertNull(service.timerState.value)
        assertEquals(0, helper.stopBackgroundCallCount)
        assertEquals(0, helper.cancelCallCount)
    }

    @Test
    fun testCancelTimer_deletesFromDb() = runTest {
        val env = createServiceWithDb()
        val (service, _, _, db) = env

        service.startTimer("session-1", 180)
        assertNotNull(db.trainRecorderQueries.selectAllTimerStates().executeAsList().firstOrNull())

        service.cancelTimer()
        assertNull(db.trainRecorderQueries.selectAllTimerStates().executeAsList().firstOrNull())
    }

    // ============================================================
    // Timestamp-based Calculation
    // ============================================================

    @Test
    fun testCalculateRemainingSeconds_atStart() {
        val (service, clock, _) = createService()

        val state = com.trainrecorder.domain.model.TimerState(
            id = "test",
            workoutSessionId = "session-1",
            startTimestamp = testStartTime,
            totalDurationSeconds = 180,
            isRunning = true,
            updatedAt = testStartTime,
        )

        val remaining = service.calculateRemainingSeconds(state)
        assertEquals(180, remaining)
    }

    @Test
    fun testCalculateRemainingSeconds_after60Seconds() {
        val (service, clock, _) = createService()

        val state = com.trainrecorder.domain.model.TimerState(
            id = "test",
            workoutSessionId = "session-1",
            startTimestamp = testStartTime,
            totalDurationSeconds = 180,
            isRunning = true,
            updatedAt = testStartTime,
        )

        clock.advanceSeconds(60)
        val remaining = service.calculateRemainingSeconds(state)
        assertEquals(120, remaining)
    }

    @Test
    fun testCalculateRemainingSeconds_expired() {
        val (service, clock, _) = createService()

        val state = com.trainrecorder.domain.model.TimerState(
            id = "test",
            workoutSessionId = "session-1",
            startTimestamp = testStartTime,
            totalDurationSeconds = 60,
            isRunning = true,
            updatedAt = testStartTime,
        )

        clock.advanceSeconds(90)
        val remaining = service.calculateRemainingSeconds(state)
        assertEquals(0, remaining)
    }

    @Test
    fun testCalculateRemainingSeconds_exactlyAtExpiry() {
        val (service, clock, _) = createService()

        val state = com.trainrecorder.domain.model.TimerState(
            id = "test",
            workoutSessionId = "session-1",
            startTimestamp = testStartTime,
            totalDurationSeconds = 120,
            isRunning = true,
            updatedAt = testStartTime,
        )

        clock.advanceSeconds(120)
        val remaining = service.calculateRemainingSeconds(state)
        assertEquals(0, remaining)
    }

    @Test
    fun testCalculateRemainingSeconds_oneSecondBeforeExpiry() {
        val (service, clock, _) = createService()

        val state = com.trainrecorder.domain.model.TimerState(
            id = "test",
            workoutSessionId = "session-1",
            startTimestamp = testStartTime,
            totalDurationSeconds = 120,
            isRunning = true,
            updatedAt = testStartTime,
        )

        clock.advanceSeconds(119)
        val remaining = service.calculateRemainingSeconds(state)
        assertEquals(1, remaining)
    }

    @Test
    fun testCalculateRemainingSeconds_doesNotGoNegative() {
        val (service, clock, _) = createService()

        val state = com.trainrecorder.domain.model.TimerState(
            id = "test",
            workoutSessionId = "session-1",
            startTimestamp = testStartTime,
            totalDurationSeconds = 10,
            isRunning = true,
            updatedAt = testStartTime,
        )

        clock.advanceSeconds(1000)
        val remaining = service.calculateRemainingSeconds(state)
        assertEquals(0, remaining)
    }

    // ============================================================
    // Resume from Persisted State
    // ============================================================

    @Test
    fun testResumeFromPersistedState_noPersistedTimer() = runTest {
        val (service, _, _) = createService()

        service.resumeFromPersistedState()

        assertNull(service.timerState.value)
        assertNull(service.remainingSeconds.value)
    }

    @Test
    fun testResumeFromPersistedState_timerStillRunning() = runTest {
        val env = createServiceWithDb()
        val (service, clock, helper, db) = env

        // Insert a running timer directly into DB (simulating app restart scenario)
        // Use a start time 30 seconds ago, duration 180s => 150s remaining
        val startTime = testStartTime - 30.seconds
        db.trainRecorderQueries.insertTimerState(
            id = "timer-1",
            workout_session_id = "session-1",
            start_timestamp = startTime.toString(),
            total_duration_seconds = 180L,
            is_running = 1L,
            updated_at = startTime.toString(),
        )

        // Resume should pick up the persisted timer
        service.resumeFromPersistedState()

        val state = service.timerState.value
        assertNotNull(state)
        assertEquals("session-1", state.workoutSessionId)
        assertEquals(150, service.remainingSeconds.value)
        assertTrue(state.isRunning)
    }

    @Test
    fun testResumeFromPersistedState_timerExpiredWhileAway() = runTest {
        val env = createServiceWithDb()
        val (service, clock, helper, db) = env

        // Insert a running timer that has already expired
        // Started 120 seconds ago with 60 second duration => expired
        val startTime = testStartTime - 120.seconds
        db.trainRecorderQueries.insertTimerState(
            id = "timer-expired",
            workout_session_id = "session-1",
            start_timestamp = startTime.toString(),
            total_duration_seconds = 60L,
            is_running = 1L,
            updated_at = startTime.toString(),
        )

        service.resumeFromPersistedState()

        val state = service.timerState.value
        assertNotNull(state)
        assertFalse(state.isRunning)
        assertEquals(0, service.remainingSeconds.value)
        assertEquals(1, helper.alertCallCount)
    }

    @Test
    fun testResumeFromPersistedState_startsBackgroundExecutionWhenRunning() = runTest {
        val env = createServiceWithDb()
        val (service, _, helper, db) = env

        // Insert a still-running timer
        val startTime = testStartTime - 10.seconds
        db.trainRecorderQueries.insertTimerState(
            id = "timer-1",
            workout_session_id = "session-1",
            start_timestamp = startTime.toString(),
            total_duration_seconds = 180L,
            is_running = 1L,
            updated_at = startTime.toString(),
        )

        service.resumeFromPersistedState()
        assertEquals(1, helper.startBackgroundCallCount)
    }

    @Test
    fun testResumeFromPersistedState_exactlyAtExpiry() = runTest {
        val env = createServiceWithDb()
        val (service, clock, helper, db) = env

        // Insert a timer that expires exactly now
        val startTime = testStartTime - 120.seconds
        db.trainRecorderQueries.insertTimerState(
            id = "timer-exact",
            workout_session_id = "session-1",
            start_timestamp = startTime.toString(),
            total_duration_seconds = 120L,
            is_running = 1L,
            updated_at = startTime.toString(),
        )

        service.resumeFromPersistedState()

        val state = service.timerState.value
        assertNotNull(state)
        assertFalse(state.isRunning)
        assertEquals(0, service.remainingSeconds.value)
        assertEquals(1, helper.alertCallCount)
    }

    @Test
    fun testResumeFromPersistedState_stoppedTimerIsCleanedUp() = runTest {
        val env = createServiceWithDb()
        val (service, _, _, db) = env

        // Insert an expired timer
        val startTime = testStartTime - 200.seconds
        db.trainRecorderQueries.insertTimerState(
            id = "timer-old",
            workout_session_id = "session-1",
            start_timestamp = startTime.toString(),
            total_duration_seconds = 60L,
            is_running = 1L,
            updated_at = startTime.toString(),
        )

        service.resumeFromPersistedState()

        // DB should be updated to is_running = 0
        val dbState = db.trainRecorderQueries.selectTimerStateBySessionId("session-1").executeAsOneOrNull()
        assertNotNull(dbState)
        assertEquals(0L, dbState.is_running)
    }

    // ============================================================
    // Multiple Timers
    // ============================================================

    @Test
    fun testStartingNewTimer_replacesPrevious() = runTest {
        val env = createServiceWithDb()
        val (service, _, helper, db) = env

        service.startTimer("session-1", 180)
        service.startTimer("session-2", 120)

        val secondState = service.timerState.value
        assertNotNull(secondState)
        assertEquals("session-2", secondState.workoutSessionId)
        assertEquals(120, secondState.totalDurationSeconds)
    }

    @Test
    fun testStartingNewTimer_startsBackgroundForEach() = runTest {
        val (service, _, helper) = createService()

        service.startTimer("session-1", 180)
        assertEquals(1, helper.startBackgroundCallCount)

        service.startTimer("session-2", 120)
        assertEquals(2, helper.startBackgroundCallCount)
    }

    // ============================================================
    // Edge Cases
    // ============================================================

    @Test
    fun testStartTimerWithZeroDuration() = runTest {
        val (service, _, _) = createService()

        service.startTimer("session-1", 0)

        val state = service.timerState.value
        assertNotNull(state)
        assertEquals(0, state.totalDurationSeconds)
        assertEquals(0, service.remainingSeconds.value)
    }

    @Test
    fun testStartTimerWithVeryLargeDuration() = runTest {
        val (service, _, _) = createService()

        service.startTimer("session-1", 3600)

        val state = service.timerState.value
        assertNotNull(state)
        assertEquals(3600, state.totalDurationSeconds)
        assertEquals(3600, service.remainingSeconds.value)
    }

    @Test
    fun testCancelTimerOnWorkoutExit() = runTest {
        val (service, _, _) = createService()

        // Start timer, simulate workout exit
        service.startTimer("session-1", 180)
        assertNotNull(service.timerState.value)

        // Cancel on workout exit
        service.cancelTimer()
        assertNull(service.timerState.value)
        assertNull(service.remainingSeconds.value)
    }

    @Test
    fun testTimerState_flowEmitsUpdates() = runTest {
        val (service, _, _) = createService()

        // Initially null
        assertNull(service.timerState.value)

        // After start
        service.startTimer("session-1", 90)
        assertNotNull(service.timerState.value)

        // After cancel
        service.cancelTimer()
        assertNull(service.timerState.value)
    }

    @Test
    fun testRemainingSeconds_flowEmitsUpdates() = runTest {
        val (service, _, _) = createService()

        // Initially null
        assertNull(service.remainingSeconds.value)

        // After start
        service.startTimer("session-1", 45)
        assertEquals(45, service.remainingSeconds.value)

        // After cancel
        service.cancelTimer()
        assertNull(service.remainingSeconds.value)
    }

    @Test
    fun testCancelTimerTwice_isIdempotent() = runTest {
        val (service, _, helper) = createService()

        service.startTimer("session-1", 180)
        service.cancelTimer()
        service.cancelTimer()

        assertNull(service.timerState.value)
        // Only the first cancel should trigger notification cleanup
        assertEquals(1, helper.stopBackgroundCallCount)
        assertEquals(1, helper.cancelCallCount)
    }

    @Test
    fun testTimerServiceImplementsTimerServiceInterface() {
        val (service, _, _) = createService()
        assertTrue(service is com.trainrecorder.domain.repository.TimerService)
    }
}
