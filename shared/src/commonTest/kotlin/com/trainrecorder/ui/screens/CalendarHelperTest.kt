package com.trainrecorder.ui.screens

import com.trainrecorder.domain.model.TrainingType
import com.trainrecorder.domain.model.WorkoutSession
import com.trainrecorder.domain.model.WorkoutStatus
import com.trainrecorder.domain.usecase.DayType
import com.trainrecorder.domain.usecase.ScheduleDay
import kotlinx.datetime.Clock
import kotlinx.datetime.DatePeriod
import kotlinx.datetime.LocalDate
import kotlinx.datetime.minus
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class CalendarHelperTest {

    // --- Calendar Grid Tests ---

    @Test
    fun `computeCalendarGrid returns correct number of rows for May 2026`() {
        // May 2026 starts on Friday (offset from Sun = 5), 31 days -> 5+31=36 cells -> 6 rows
        val rows = computeCalendarGrid(2026, 5, emptyList())
        assertEquals(6, rows.size)
        // Each row has 7 cells
        rows.forEach { row -> assertEquals(7, row.size) }
    }

    @Test
    fun `computeCalendarGrid starts on Sunday for May 2026`() {
        // May 1, 2026 is a Friday. Grid should start on Sunday Apr 26.
        val rows = computeCalendarGrid(2026, 5, emptyList())
        val firstCell = rows.first().first()
        assertEquals(LocalDate(2026, 4, 26), firstCell.date)
        assertFalse(firstCell.isCurrentMonth)
    }

    @Test
    fun `computeCalendarGrid marks isCurrentMonth correctly`() {
        val rows = computeCalendarGrid(2026, 5, emptyList())
        // First row: Apr 26-30 (not current month), May 1-2 (current month)
        val firstRow = rows[0]
        assertFalse(firstRow[0].isCurrentMonth) // Apr 26
        assertFalse(firstRow[4].isCurrentMonth) // Apr 30
        assertTrue(firstRow[5].isCurrentMonth)  // May 1
        assertTrue(firstRow[6].isCurrentMonth)  // May 2
    }

    @Test
    fun `computeCalendarGrid maps schedule days to cells`() {
        val scheduleDays = listOf(
            ScheduleDay(
                date = LocalDate(2026, 5, 1),
                type = DayType.TRAINING,
                trainingDay = null,
                workoutSession = null,
                otherSportRecord = null,
                isSkipped = false,
                isToday = false,
            ),
        )

        val rows = computeCalendarGrid(2026, 5, scheduleDays)
        // May 1 is row 0, index 5
        val may1 = rows[0][5]
        assertNotNull(may1.scheduleDay)
        assertEquals(DayType.TRAINING, may1.scheduleDay!!.type)
    }

    @Test
    fun `computeCalendarGrid handles February non-leap year`() {
        // Feb 2025 starts on Saturday (index 6), 28 days -> 5 rows
        val rows = computeCalendarGrid(2025, 2, emptyList())
        assertEquals(5, rows.size)
    }

    @Test
    fun `computeCalendarGrid handles February leap year`() {
        // Feb 2024 starts on Thursday (index 4), 29 days -> 5 rows
        val rows = computeCalendarGrid(2024, 2, emptyList())
        assertEquals(5, rows.size)
    }

    @Test
    fun `computeCalendarGrid handles month starting on Sunday`() {
        // June 2026 starts on Monday, not Sunday. Let's find a month starting on Sunday.
        // March 2026 starts on Sunday (dayOfWeek = SUNDAY)
        val rows = computeCalendarGrid(2026, 3, emptyList())
        val firstCell = rows.first().first()
        // March 1 2026 is a Sunday
        assertEquals(LocalDate(2026, 3, 1), firstCell.date)
        assertTrue(firstCell.isCurrentMonth)
    }

    @Test
    fun `computeCalendarGrid produces 6 rows when month starts on Saturday with 31 days`() {
        // Need a month with 31 days starting on Saturday
        // August 2026: starts on Saturday, 31 days -> should be 6 rows
        val rows = computeCalendarGrid(2026, 8, emptyList())
        // Aug 1, 2026 is Saturday (dayOfWeek = SATURDAY)
        // Grid starts on Sunday Jul 26, rows needed = ceil((6 + 31)/7) = ceil(37/7) = 6
        assertEquals(6, rows.size)
    }

    // --- Training Type Color Tests ---

    @Test
    fun `TrainingTypeColor maps push to blue`() {
        assertEquals(TrainingTypeColor.PUSH, TrainingTypeColor.fromTrainingType(TrainingType.PUSH))
    }

    @Test
    fun `TrainingTypeColor maps pull to green`() {
        assertEquals(TrainingTypeColor.PULL, TrainingTypeColor.fromTrainingType(TrainingType.PULL))
    }

    @Test
    fun `TrainingTypeColor maps legs to orange`() {
        assertEquals(TrainingTypeColor.LEGS, TrainingTypeColor.fromTrainingType(TrainingType.LEGS))
    }

    @Test
    fun `TrainingTypeColor maps other to purple`() {
        assertEquals(TrainingTypeColor.OTHER, TrainingTypeColor.fromTrainingType(TrainingType.OTHER))
    }

    @Test
    fun `TrainingTypeColor maps custom to purple`() {
        assertEquals(TrainingTypeColor.OTHER, TrainingTypeColor.fromTrainingType(TrainingType.CUSTOM))
    }

    // --- Day Status Tests ---

    @Test
    fun `getDayStatus returns empty for null day`() {
        assertEquals("empty", getDayStatus(null))
    }

    @Test
    fun `getDayStatus returns skipped for skipped day`() {
        val day = makeScheduleDay(isSkipped = true)
        assertEquals("skipped", getDayStatus(day))
    }

    @Test
    fun `getDayStatus returns completed for completed session`() {
        val day = makeScheduleDay(
            workoutStatus = WorkoutStatus.COMPLETED,
        )
        assertEquals("completed", getDayStatus(day))
    }

    @Test
    fun `getDayStatus returns completed for completed_partial session`() {
        val day = makeScheduleDay(
            workoutStatus = WorkoutStatus.COMPLETED_PARTIAL,
        )
        assertEquals("completed", getDayStatus(day))
    }

    @Test
    fun `getDayStatus returns planned for in-progress session`() {
        val day = makeScheduleDay(
            workoutStatus = WorkoutStatus.IN_PROGRESS,
        )
        assertEquals("planned", getDayStatus(day))
    }

    @Test
    fun `getDayStatus returns rest for rest day`() {
        val day = makeScheduleDay(
            dayType = DayType.REST,
            workoutStatus = null,
        )
        assertEquals("rest", getDayStatus(day))
    }

    @Test
    fun `getDayStatus returns planned for training day without session`() {
        val day = makeScheduleDay(
            dayType = DayType.TRAINING,
            workoutStatus = null,
        )
        assertEquals("planned", getDayStatus(day))
    }

    // --- Training Bar Tests ---

    @Test
    fun `hasTrainingBar returns false for null day`() {
        assertFalse(hasTrainingBar(null))
    }

    @Test
    fun `hasTrainingBar returns true for training day`() {
        val day = makeScheduleDay(dayType = DayType.TRAINING)
        assertTrue(hasTrainingBar(day))
    }

    @Test
    fun `hasTrainingBar returns true for skipped day`() {
        val day = makeScheduleDay(isSkipped = true)
        assertTrue(hasTrainingBar(day))
    }

    @Test
    fun `hasTrainingBar returns false for rest day`() {
        val day = makeScheduleDay(dayType = DayType.REST, workoutStatus = null)
        assertFalse(hasTrainingBar(day))
    }

    // --- Training Color Tests ---

    @Test
    fun `getTrainingColor returns REST for null day`() {
        assertEquals(TrainingTypeColor.REST, getTrainingColor(null))
    }

    @Test
    fun `getTrainingColor returns REST for skipped day`() {
        val day = makeScheduleDay(isSkipped = true)
        assertEquals(TrainingTypeColor.REST, getTrainingColor(day))
    }

    @Test
    fun `getTrainingColor returns PUSH for push training day`() {
        val day = makeScheduleDay(trainingType = TrainingType.PUSH)
        assertEquals(TrainingTypeColor.PUSH, getTrainingColor(day))
    }

    @Test
    fun `getTrainingColor returns PULL for pull training day`() {
        val day = makeScheduleDay(trainingType = TrainingType.PULL)
        assertEquals(TrainingTypeColor.PULL, getTrainingColor(day))
    }

    @Test
    fun `getTrainingColor returns LEGS for legs training day`() {
        val day = makeScheduleDay(trainingType = TrainingType.LEGS)
        assertEquals(TrainingTypeColor.LEGS, getTrainingColor(day))
    }

    // --- Filter Chips Tests ---

    @Test
    fun `getFilterChips returns empty for empty schedule`() {
        val chips = getFilterChips(emptyList(), null)
        assertTrue(chips.isEmpty())
    }

    @Test
    fun `getFilterChips returns unique training types`() {
        val scheduleDays = listOf(
            makeScheduleDay(trainingType = TrainingType.PUSH),
            makeScheduleDay(trainingType = TrainingType.PUSH),
            makeScheduleDay(trainingType = TrainingType.PULL),
        )
        val chips = getFilterChips(scheduleDays, null)
        assertEquals(2, chips.size)
        assertEquals(TrainingType.PUSH, chips[0].trainingType)
        assertEquals(TrainingType.PULL, chips[1].trainingType)
    }

    @Test
    fun `getFilterChips marks selected type`() {
        val scheduleDays = listOf(
            makeScheduleDay(trainingType = TrainingType.PUSH),
            makeScheduleDay(trainingType = TrainingType.PULL),
        )
        val chips = getFilterChips(scheduleDays, TrainingType.PUSH)
        assertTrue(chips[0].isSelected)
        assertFalse(chips[1].isSelected)
    }

    // --- Filter By Training Type Tests ---

    @Test
    fun `filterByTrainingType returns all when no filter`() {
        val days = listOf(
            makeScheduleDay(trainingType = TrainingType.PUSH),
            makeScheduleDay(trainingType = TrainingType.PULL),
        )
        val result = filterByTrainingType(days, null)
        assertEquals(2, result.size)
    }

    @Test
    fun `filterByTrainingType filters to matching type`() {
        val days = listOf(
            makeScheduleDay(trainingType = TrainingType.PUSH),
            makeScheduleDay(trainingType = TrainingType.PULL),
            makeScheduleDay(trainingType = TrainingType.LEGS),
        )
        val result = filterByTrainingType(days, TrainingType.PUSH)
        assertEquals(1, result.size)
        assertEquals(TrainingType.PUSH, result[0].trainingDay!!.dayType)
    }

    @Test
    fun `filterByTrainingType returns empty when no match`() {
        val days = listOf(
            makeScheduleDay(trainingType = TrainingType.PUSH),
        )
        val result = filterByTrainingType(days, TrainingType.LEGS)
        assertTrue(result.isEmpty())
    }

    // --- Format Month Year Tests ---

    @Test
    fun `formatMonthYear formats correctly`() {
        assertEquals("May 2026", formatMonthYear(2026, 5))
        assertEquals("January 2025", formatMonthYear(2025, 1))
        assertEquals("December 2024", formatMonthYear(2024, 12))
    }

    // --- Day of Week Headers Tests ---

    @Test
    fun `DAY_OF_WEEK_HEADERS has 7 entries starting with Sunday`() {
        assertEquals(7, DAY_OF_WEEK_HEADERS.size)
        assertEquals("Sun", DAY_OF_WEEK_HEADERS[0])
        assertEquals("Sat", DAY_OF_WEEK_HEADERS[6])
    }

    // --- Integration Tests ---

    @Test
    fun `computeCalendarGrid with schedule days shows correct status per cell`() {
        val scheduleDays = listOf(
            makeScheduleDay(
                date = LocalDate(2026, 5, 5),
                trainingType = TrainingType.PUSH,
                workoutStatus = WorkoutStatus.COMPLETED,
            ),
            makeScheduleDay(
                date = LocalDate(2026, 5, 7),
                trainingType = TrainingType.PULL,
                workoutStatus = null,
                isSkipped = true,
            ),
            makeScheduleDay(
                date = LocalDate(2026, 5, 9),
                trainingType = TrainingType.LEGS,
                workoutStatus = null,
            ),
        )

        val rows = computeCalendarGrid(2026, 5, scheduleDays)

        // May 5 completed
        val may5 = rows.flatten().find { it.date == LocalDate(2026, 5, 5) }
        assertNotNull(may5)
        assertEquals("completed", getDayStatus(may5!!.scheduleDay))

        // May 7 skipped
        val may7 = rows.flatten().find { it.date == LocalDate(2026, 5, 7) }
        assertNotNull(may7)
        assertEquals("skipped", getDayStatus(may7!!.scheduleDay))

        // May 9 planned
        val may9 = rows.flatten().find { it.date == LocalDate(2026, 5, 9) }
        assertNotNull(may9)
        assertEquals("planned", getDayStatus(may9!!.scheduleDay))
    }

    @Test
    fun `computeCalendarGrid all cells have correct month flag`() {
        val rows = computeCalendarGrid(2026, 5, emptyList())
        val allCells = rows.flatten()

        // All cells from May 1-31 should be currentMonth=true
        val mayCells = allCells.filter { it.date.monthNumber == 5 && it.date.year == 2026 }
        mayCells.forEach { cell ->
            assertTrue(cell.isCurrentMonth, "Cell ${cell.date} should be currentMonth")
        }
        assertEquals(31, mayCells.size)

        // Cells outside May should not be currentMonth
        val outsideCells = allCells.filter { !(it.date.monthNumber == 5 && it.date.year == 2026) }
        outsideCells.forEach { cell ->
            assertFalse(cell.isCurrentMonth, "Cell ${cell.date} should NOT be currentMonth")
        }
    }

    @Test
    fun `filter and chip integration`() {
        val scheduleDays = listOf(
            makeScheduleDay(date = LocalDate(2026, 5, 1), trainingType = TrainingType.PUSH),
            makeScheduleDay(date = LocalDate(2026, 5, 2), trainingType = TrainingType.PULL),
            makeScheduleDay(date = LocalDate(2026, 5, 3), trainingType = TrainingType.LEGS),
            makeScheduleDay(date = LocalDate(2026, 5, 4), trainingType = TrainingType.PUSH),
        )

        // Filter to PUSH only
        val filtered = filterByTrainingType(scheduleDays, TrainingType.PUSH)
        assertEquals(2, filtered.size)
        filtered.forEach { day ->
            assertEquals(TrainingType.PUSH, day.trainingDay!!.dayType)
        }

        // Chips should show all 3 types
        val chips = getFilterChips(scheduleDays, TrainingType.PUSH)
        assertEquals(3, chips.size)
        assertTrue(chips.any { it.trainingType == TrainingType.PUSH && it.isSelected })
        assertTrue(chips.any { it.trainingType == TrainingType.PULL && !it.isSelected })
        assertTrue(chips.any { it.trainingType == TrainingType.LEGS && !it.isSelected })
    }

    // --- Helpers ---

    private fun makeScheduleDay(
        date: LocalDate = LocalDate(2026, 5, 11),
        dayType: DayType = DayType.TRAINING,
        trainingType: TrainingType = TrainingType.PUSH,
        workoutStatus: WorkoutStatus? = WorkoutStatus.COMPLETED,
        isSkipped: Boolean = false,
    ): ScheduleDay {
        val session = if (workoutStatus != null) {
            WorkoutSession(
                id = "s1",
                planId = "p1",
                trainingDayId = "d1",
                recordDate = date,
                trainingType = trainingType,
                workoutStatus = workoutStatus,
                startedAt = Clock.System.now(),
                endedAt = null,
                isBackfill = false,
                createdAt = Clock.System.now(),
                updatedAt = Clock.System.now(),
            )
        } else {
            null
        }

        val trainingDay = if (dayType == DayType.TRAINING) {
            com.trainrecorder.domain.model.TrainingDay(
                id = "d1",
                planId = "p1",
                displayName = "Push Day",
                dayType = trainingType,
                orderIndex = 0,
                createdAt = Clock.System.now(),
                updatedAt = Clock.System.now(),
            )
        } else {
            null
        }

        return ScheduleDay(
            date = date,
            type = dayType,
            trainingDay = trainingDay,
            workoutSession = session,
            otherSportRecord = null,
            isSkipped = isSkipped,
            isToday = false,
        )
    }
}
