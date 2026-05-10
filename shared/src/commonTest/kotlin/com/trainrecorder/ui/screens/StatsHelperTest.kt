package com.trainrecorder.ui.screens

import com.trainrecorder.domain.model.PersonalRecord
import com.trainrecorder.domain.model.TrainingType
import com.trainrecorder.domain.model.WorkoutSession
import com.trainrecorder.domain.model.WorkoutStatus
import com.trainrecorder.viewmodel.EstimatedOneRM
import com.trainrecorder.viewmodel.WeeklyStats
import kotlinx.datetime.Clock
import kotlinx.datetime.DatePeriod
import kotlinx.datetime.LocalDate
import kotlinx.datetime.minus
import kotlinx.datetime.plus
import kotlinx.datetime.todayIn
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class StatsHelperTest {

    // --- computeHeroData Tests ---

    @Test
    fun `computeHeroData returns zeros for empty stats`() {
        val heroData = computeHeroData(emptyList())
        assertEquals(0.0, heroData.weeklyVolume)
        assertEquals(0.0, heroData.previousWeeklyVolume)
        assertEquals(0.0, heroData.changePercent)
        assertEquals(0, heroData.totalSessionsThisWeek)
    }

    @Test
    fun `computeHeroData uses most recent week`() {
        val stats = listOf(
            WeeklyStats(LocalDate(2026, 5, 4), 3, 6000.0, null, null),
            WeeklyStats(LocalDate(2026, 5, 11), 4, 8000.0, null, null),
        )
        val heroData = computeHeroData(stats)
        assertEquals(8000.0, heroData.weeklyVolume)
        assertEquals(4, heroData.totalSessionsThisWeek)
    }

    @Test
    fun `computeHeroData computes change percent correctly`() {
        val stats = listOf(
            WeeklyStats(LocalDate(2026, 5, 4), 3, 5000.0, null, null),
            WeeklyStats(LocalDate(2026, 5, 11), 3, 6000.0, null, null),
        )
        val heroData = computeHeroData(stats)
        assertEquals(20.0, heroData.changePercent)
    }

    @Test
    fun `computeHeroData handles zero previous volume`() {
        val stats = listOf(
            WeeklyStats(LocalDate(2026, 5, 11), 2, 3000.0, null, null),
        )
        val heroData = computeHeroData(stats)
        assertEquals(0.0, heroData.changePercent)
    }

    @Test
    fun `computeHeroData handles negative change`() {
        val stats = listOf(
            WeeklyStats(LocalDate(2026, 5, 4), 3, 8000.0, null, null),
            WeeklyStats(LocalDate(2026, 5, 11), 2, 4000.0, null, null),
        )
        val heroData = computeHeroData(stats)
        assertEquals(-50.0, heroData.changePercent)
    }

    // --- computeSummaryGrid Tests ---

    @Test
    fun `computeSummaryGrid returns 4 items`() {
        val grid = computeSummaryGrid(emptyList(), emptyList(), emptyList())
        assertEquals(4, grid.size)
    }

    @Test
    fun `computeSummaryGrid first item is sessions`() {
        val stats = listOf(
            WeeklyStats(LocalDate(2026, 5, 11), 3, 5000.0, null, null),
        )
        val grid = computeSummaryGrid(stats, emptyList(), emptyList())
        assertEquals("Sessions", grid[0].label)
        assertEquals("3", grid[0].value)
        assertEquals("this week", grid[0].subtitle)
    }

    @Test
    fun `computeSummaryGrid second item is volume`() {
        val stats = listOf(
            WeeklyStats(LocalDate(2026, 5, 11), 3, 5000.0, null, null),
        )
        val grid = computeSummaryGrid(stats, emptyList(), emptyList())
        assertEquals("Volume", grid[1].label)
        assertEquals("5000 kg", grid[1].value)
    }

    @Test
    fun `computeSummaryGrid third item is PR count`() {
        val prs = listOf(
            makePR("e1"),
            makePR("e2"),
        )
        val grid = computeSummaryGrid(emptyList(), prs, emptyList())
        assertEquals("PRs", grid[2].label)
        assertEquals("2", grid[2].value)
    }

    @Test
    fun `computeSummaryGrid fourth item is best 1RM`() {
        val oneRMs = listOf(
            EstimatedOneRM("e1", "Bench Press", 100.0, LocalDate(2026, 5, 11)),
            EstimatedOneRM("e2", "Squat", 150.0, LocalDate(2026, 5, 10)),
        )
        val grid = computeSummaryGrid(emptyList(), emptyList(), oneRMs)
        assertEquals("Best 1RM", grid[3].label)
        assertEquals("150.0 kg", grid[3].value)
        assertEquals("Squat", grid[3].subtitle)
    }

    @Test
    fun `computeSummaryGrid handles empty data gracefully`() {
        val grid = computeSummaryGrid(emptyList(), emptyList(), emptyList())
        assertEquals("0", grid[0].value)
        assertEquals("0 kg", grid[1].value)
        assertEquals("0", grid[2].value)
        assertEquals("--", grid[3].value)
    }

    // --- computeWeeklyVolumeChart Tests ---

    @Test
    fun `computeWeeklyVolumeChart returns empty for no stats`() {
        val chart = computeWeeklyVolumeChart(emptyList())
        assertTrue(chart.isEmpty())
    }

    @Test
    fun `computeWeeklyVolumeChart takes last 8 weeks`() {
        val stats = (0..11).map { i ->
            WeeklyStats(
                weekStart = LocalDate(2026, 1, 5).plus(kotlinx.datetime.DatePeriod(days = i * 7)),
                totalSessions = 3,
                totalVolume = (i + 1) * 1000.0,
                avgFatigue = null,
                avgSatisfaction = null,
            )
        }
        val chart = computeWeeklyVolumeChart(stats)
        assertEquals(8, chart.size)
        // Last 8 weeks, values should be 5000..12000
        assertEquals(5000.0, chart.first().value)
        assertEquals(12000.0, chart.last().value)
    }

    @Test
    fun `computeWeeklyVolumeChart returns all if fewer than 8`() {
        val stats = listOf(
            WeeklyStats(LocalDate(2026, 5, 4), 3, 5000.0, null, null),
            WeeklyStats(LocalDate(2026, 5, 11), 4, 6000.0, null, null),
        )
        val chart = computeWeeklyVolumeChart(stats)
        assertEquals(2, chart.size)
    }

    @Test
    fun `computeWeeklyVolumeChart sorts by date ascending`() {
        val stats = listOf(
            WeeklyStats(LocalDate(2026, 5, 11), 4, 6000.0, null, null),
            WeeklyStats(LocalDate(2026, 5, 4), 3, 5000.0, null, null),
        )
        val chart = computeWeeklyVolumeChart(stats)
        assertEquals(LocalDate(2026, 5, 4), chart[0].date)
        assertEquals(LocalDate(2026, 5, 11), chart[1].date)
    }

    // --- computePRList Tests ---

    @Test
    fun `computePRList returns empty for no data`() {
        val list = computePRList(emptyList())
        assertTrue(list.isEmpty())
    }

    @Test
    fun `computePRList sorts by estimated 1RM descending`() {
        val oneRMs = listOf(
            EstimatedOneRM("e1", "Bench", 100.0, LocalDate(2026, 5, 11)),
            EstimatedOneRM("e2", "Squat", 150.0, LocalDate(2026, 5, 10)),
            EstimatedOneRM("e3", "Deadlift", 180.0, LocalDate(2026, 5, 9)),
        )
        val list = computePRList(oneRMs)
        assertEquals(3, list.size)
        assertEquals("Deadlift", list[0].exerciseName)
        assertEquals(180.0, list[0].estimatedOneRM)
        assertEquals("Squat", list[1].exerciseName)
        assertEquals("Bench", list[2].exerciseName)
    }

    // --- computeHeatmapCells Tests ---

    @Test
    fun `computeHeatmapCells returns 28 cells`() {
        val today = LocalDate(2026, 5, 11)
        val cells = computeHeatmapCells(emptyList(), today)
        assertEquals(28, cells.size)
    }

    @Test
    fun `computeHeatmapCells spans 28 days ending on today`() {
        val today = LocalDate(2026, 5, 11)
        val cells = computeHeatmapCells(emptyList(), today)
        assertEquals(today.minus(kotlinx.datetime.DatePeriod(days = 27)), cells.first().date)
        assertEquals(today, cells.last().date)
    }

    @Test
    fun `computeHeatmapCells maps session count to intensity`() {
        val today = LocalDate(2026, 5, 11)
        val sessions = listOf(
            makeSession(date = today, status = WorkoutStatus.COMPLETED),
            makeSession(date = today, status = WorkoutStatus.COMPLETED),
            makeSession(date = today, status = WorkoutStatus.COMPLETED),
        )
        val cells = computeHeatmapCells(sessions, today)
        val todayCell = cells.last()
        assertEquals(3, todayCell.intensity)
    }

    @Test
    fun `computeHeatmapCells returns 0 intensity for no sessions`() {
        val today = LocalDate(2026, 5, 11)
        val cells = computeHeatmapCells(emptyList(), today)
        cells.forEach { cell ->
            assertEquals(0, cell.intensity)
        }
    }

    @Test
    fun `computeHeatmapCells intensity scale is correct`() {
        val today = LocalDate(2026, 5, 11)
        val date1 = today.minus(kotlinx.datetime.DatePeriod(days = 3))

        // 1 session = intensity 1
        val sessions1 = listOf(makeSession(date = date1, status = WorkoutStatus.COMPLETED))
        val cells1 = computeHeatmapCells(sessions1, today)
        val cell1 = cells1.find { it.date == date1 }
        assertNotNull(cell1)
        assertEquals(1, cell1.intensity)

        // 2 sessions = intensity 2
        val sessions2 = listOf(
            makeSession(date = date1, status = WorkoutStatus.COMPLETED),
            makeSession(date = date1, status = WorkoutStatus.COMPLETED),
        )
        val cells2 = computeHeatmapCells(sessions2, today)
        val cell2 = cells2.find { it.date == date1 }
        assertNotNull(cell2)
        assertEquals(2, cell2.intensity)

        // 4 sessions = intensity 4
        val sessions4 = (1..4).map { makeSession(date = date1, status = WorkoutStatus.COMPLETED) }
        val cells4 = computeHeatmapCells(sessions4, today)
        val cell4 = cells4.find { it.date == date1 }
        assertNotNull(cell4)
        assertEquals(4, cell4.intensity)
    }

    @Test
    fun `computeHeatmapCells filters out IN_PROGRESS sessions`() {
        val today = LocalDate(2026, 5, 11)
        val sessions = listOf(
            makeSession(date = today, status = WorkoutStatus.IN_PROGRESS),
            makeSession(date = today, status = WorkoutStatus.COMPLETED),
        )
        val cells = computeHeatmapCells(sessions, today)
        val todayCell = cells.last()
        assertEquals(1, todayCell.intensity)
    }

    @Test
    fun `computeHeatmapCells only counts sessions within 28 day range`() {
        val today = LocalDate(2026, 5, 11)
        val oldDate = today.minus(kotlinx.datetime.DatePeriod(days = 30))
        val sessions = listOf(
            makeSession(date = oldDate, status = WorkoutStatus.COMPLETED),
            makeSession(date = today, status = WorkoutStatus.COMPLETED),
        )
        val cells = computeHeatmapCells(sessions, today)
        // oldDate (30 days ago) is outside the 28-day range, so no cell exists for it
        val oldCell = cells.find { it.date == oldDate }
        assertEquals(null, oldCell) // Outside range, no cell at all

        val todayCell = cells.last()
        assertEquals(1, todayCell.intensity)
    }

    // --- formatChangePercent Tests ---

    @Test
    fun `formatChangePercent formats positive with plus`() {
        assertEquals("+20%", formatChangePercent(20.0))
    }

    @Test
    fun `formatChangePercent formats negative with sign`() {
        assertEquals("-15%", formatChangePercent(-15.0))
    }

    @Test
    fun `formatChangePercent formats zero`() {
        assertEquals("0%", formatChangePercent(0.0))
    }

    @Test
    fun `formatChangePercent rounds to integer`() {
        assertEquals("+33%", formatChangePercent(33.3))
    }

    // --- Helpers ---

    private fun makePR(
        exerciseId: String,
        maxWeight: Double = 100.0,
    ): PersonalRecord {
        return PersonalRecord(
            id = "pr_$exerciseId",
            exerciseId = exerciseId,
            maxWeight = maxWeight,
            maxVolume = 5000.0,
            maxWeightDate = LocalDate(2026, 5, 11),
            maxVolumeDate = LocalDate(2026, 5, 11),
            maxWeightSessionId = "s1",
            maxVolumeSessionId = "s1",
            createdAt = Clock.System.now(),
            updatedAt = Clock.System.now(),
        )
    }

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
