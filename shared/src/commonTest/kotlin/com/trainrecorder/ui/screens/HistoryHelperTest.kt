package com.trainrecorder.ui.screens

import com.trainrecorder.domain.model.PersonalRecord
import com.trainrecorder.domain.model.TrainingType
import com.trainrecorder.domain.model.WorkoutSession
import com.trainrecorder.domain.model.WorkoutStatus
import com.trainrecorder.viewmodel.HistoryTab
import com.trainrecorder.viewmodel.ProgressDataPoint
import com.trainrecorder.viewmodel.VolumeDataPoint
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class HistoryHelperTest {

    // --- computeSessionSummaries Tests ---

    @Test
    fun `computeSessionSummaries filters out IN_PROGRESS sessions`() {
        val sessions = listOf(
            makeSession(id = "1", date = LocalDate(2026, 5, 1), status = WorkoutStatus.COMPLETED),
            makeSession(id = "2", date = LocalDate(2026, 5, 2), status = WorkoutStatus.IN_PROGRESS),
            makeSession(id = "3", date = LocalDate(2026, 5, 3), status = WorkoutStatus.COMPLETED_PARTIAL),
        )
        val summaries = computeSessionSummaries(sessions)
        assertEquals(2, summaries.size)
        assertEquals("3", summaries[0].sessionId) // sorted desc, May 3 first
        assertEquals("1", summaries[1].sessionId)
    }

    @Test
    fun `computeSessionSummaries sorts by date descending`() {
        val sessions = listOf(
            makeSession(id = "a", date = LocalDate(2026, 5, 1)),
            makeSession(id = "b", date = LocalDate(2026, 5, 10)),
            makeSession(id = "c", date = LocalDate(2026, 5, 5)),
        )
        val summaries = computeSessionSummaries(sessions)
        assertEquals(3, summaries.size)
        assertEquals(LocalDate(2026, 5, 10), summaries[0].date)
        assertEquals(LocalDate(2026, 5, 5), summaries[1].date)
        assertEquals(LocalDate(2026, 5, 1), summaries[2].date)
    }

    @Test
    fun `computeSessionSummaries maps fields correctly`() {
        val session = makeSession(
            id = "s1",
            date = LocalDate(2026, 5, 11),
            trainingType = TrainingType.PUSH,
        )
        val summaries = computeSessionSummaries(listOf(session))
        assertEquals(1, summaries.size)
        assertEquals("s1", summaries[0].sessionId)
        assertEquals(LocalDate(2026, 5, 11), summaries[0].date)
        assertEquals(TrainingType.PUSH, summaries[0].trainingType)
    }

    @Test
    fun `computeSessionSummaries returns empty for empty input`() {
        val summaries = computeSessionSummaries(emptyList())
        assertTrue(summaries.isEmpty())
    }

    // --- toLineChartData Tests ---

    @Test
    fun `toLineChartData maps progress data to chart data`() {
        val progressData = listOf(
            ProgressDataPoint(date = LocalDate(2026, 5, 1), weight = 80.0, isPR = false),
            ProgressDataPoint(date = LocalDate(2026, 5, 8), weight = 85.0, isPR = true),
            ProgressDataPoint(date = LocalDate(2026, 5, 15), weight = 82.5, isPR = false),
        )
        val chartData = toLineChartData(progressData)
        assertEquals(3, chartData.size)
        assertEquals(80.0, chartData[0].value)
        assertFalse(chartData[0].isPR)
        assertEquals(85.0, chartData[1].value)
        assertTrue(chartData[1].isPR)
        assertEquals(82.5, chartData[2].value)
    }

    @Test
    fun `toLineChartData preserves date order`() {
        val progressData = listOf(
            ProgressDataPoint(date = LocalDate(2026, 5, 1), weight = 80.0, isPR = false),
            ProgressDataPoint(date = LocalDate(2026, 5, 8), weight = 85.0, isPR = false),
        )
        val chartData = toLineChartData(progressData)
        assertEquals(LocalDate(2026, 5, 1), chartData[0].date)
        assertEquals(LocalDate(2026, 5, 8), chartData[1].date)
    }

    // --- toBarChartData Tests ---

    @Test
    fun `toBarChartData maps volume data to chart data`() {
        val volumeData = listOf(
            VolumeDataPoint(date = LocalDate(2026, 5, 1), volume = 5000.0),
            VolumeDataPoint(date = LocalDate(2026, 5, 8), volume = 6500.0),
        )
        val chartData = toBarChartData(volumeData)
        assertEquals(2, chartData.size)
        assertEquals(5000.0, chartData[0].value)
        assertEquals(6500.0, chartData[1].value)
    }

    // --- formatSessionDate Tests ---

    @Test
    fun `formatSessionDate formats correctly`() {
        assertEquals("May 11", formatSessionDate(LocalDate(2026, 5, 11)))
        assertEquals("January 1", formatSessionDate(LocalDate(2026, 1, 1)))
        assertEquals("December 25", formatSessionDate(LocalDate(2026, 12, 25)))
    }

    // --- formatChartDateRange Tests ---

    @Test
    fun `formatChartDateRange returns null for empty list`() {
        assertNull(formatChartDateRange(emptyList()))
    }

    @Test
    fun `formatChartDateRange returns first and last dates`() {
        val dates = listOf(
            LocalDate(2026, 5, 1),
            LocalDate(2026, 5, 8),
            LocalDate(2026, 5, 15),
        )
        val range = formatChartDateRange(dates)
        assertNotNull(range)
        assertEquals("May 1", range.first)
        assertEquals("May 15", range.second)
    }

    // --- formatSessionDuration Tests ---

    @Test
    fun `formatSessionDuration returns dash for null timestamps`() {
        assertEquals("--", formatSessionDuration(null, null))
        assertEquals("--", formatSessionDuration(Clock.System.now(), null))
        assertEquals("--", formatSessionDuration(null, Clock.System.now()))
    }

    @Test
    fun `formatSessionDuration formats minutes only`() {
        val start = Instant.fromEpochMilliseconds(0)
        val end = Instant.fromEpochMilliseconds(45 * 60 * 1000) // 45 min
        assertEquals("45m", formatSessionDuration(start, end))
    }

    @Test
    fun `formatSessionDuration formats hours and minutes`() {
        val start = Instant.fromEpochMilliseconds(0)
        val end = Instant.fromEpochMilliseconds(90 * 60 * 1000) // 1h 30m
        assertEquals("1h 30m", formatSessionDuration(start, end))
    }

    // --- formatVolume Tests ---

    @Test
    fun `formatVolume formats integer volume`() {
        assertEquals("5000 kg", formatVolume(5000.0))
    }

    @Test
    fun `formatVolume formats decimal volume`() {
        assertEquals("5000.5 kg", formatVolume(5000.5))
    }

    @Test
    fun `formatVolume uses custom unit`() {
        assertEquals("5000 lb", formatVolume(5000.0, "lb"))
    }

    // --- getHistoryTabs Tests ---

    @Test
    fun `getHistoryTabs returns all 4 tabs`() {
        val tabs = getHistoryTabs()
        assertEquals(4, tabs.size)
        assertEquals(HistoryTab.HISTORY, tabs[0])
        assertEquals(HistoryTab.PROGRESS, tabs[1])
        assertEquals(HistoryTab.VOLUME, tabs[2])
        assertEquals(HistoryTab.PR, tabs[3])
    }

    // --- trainingTypeLabel Tests ---

    @Test
    fun `trainingTypeLabel maps all training types`() {
        assertEquals("Push", trainingTypeLabel(TrainingType.PUSH))
        assertEquals("Pull", trainingTypeLabel(TrainingType.PULL))
        assertEquals("Legs", trainingTypeLabel(TrainingType.LEGS))
        assertEquals("Other", trainingTypeLabel(TrainingType.OTHER))
        assertEquals("Custom", trainingTypeLabel(TrainingType.CUSTOM))
    }

    // --- HISTORY_TAB_LABELS Tests ---

    @Test
    fun `HISTORY_TAB_LABELS has all 4 tabs`() {
        assertEquals(4, HISTORY_TAB_LABELS.size)
        assertEquals("History", HISTORY_TAB_LABELS[HistoryTab.HISTORY])
        assertEquals("Progress", HISTORY_TAB_LABELS[HistoryTab.PROGRESS])
        assertEquals("Volume", HISTORY_TAB_LABELS[HistoryTab.VOLUME])
        assertEquals("PR", HISTORY_TAB_LABELS[HistoryTab.PR])
    }

    // --- Helpers ---

    private fun makeSession(
        id: String = "s1",
        date: LocalDate = LocalDate(2026, 5, 11),
        trainingType: TrainingType = TrainingType.PUSH,
        status: WorkoutStatus = WorkoutStatus.COMPLETED,
    ): WorkoutSession {
        return WorkoutSession(
            id = id,
            planId = "p1",
            trainingDayId = "d1",
            recordDate = date,
            trainingType = trainingType,
            workoutStatus = status,
            startedAt = Clock.System.now(),
            endedAt = Clock.System.now(),
            isBackfill = false,
            createdAt = Clock.System.now(),
            updatedAt = Clock.System.now(),
        )
    }
}
