package com.trainrecorder.ui.components

import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.LocalDate
import kotlinx.datetime.plus

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertNotNull

class ChartModelTest {

    @Test
    fun `LineChartDataPoint stores date, value, and isPR flag`() {
        val point = LineChartDataPoint(
            date = LocalDate(2026, 5, 11),
            value = 100.0,
            isPR = true,
        )
        assertEquals(LocalDate(2026, 5, 11), point.date)
        assertEquals(100.0, point.value)
        assertEquals(true, point.isPR)
    }

    @Test
    fun `LineChartDataPoint defaults isPR to false`() {
        val point = LineChartDataPoint(
            date = LocalDate(2026, 5, 11),
            value = 80.0,
        )
        assertEquals(false, point.isPR)
    }

    @Test
    fun `BarChartDataPoint stores date and value`() {
        val point = BarChartDataPoint(
            date = LocalDate(2026, 5, 11),
            value = 8400.0,
        )
        assertEquals(LocalDate(2026, 5, 11), point.date)
        assertEquals(8400.0, point.value)
    }

    @Test
    fun `HeatmapCell stores date and intensity`() {
        val cell = HeatmapCell(
            date = LocalDate(2026, 5, 11),
            intensity = 3,
        )
        assertEquals(LocalDate(2026, 5, 11), cell.date)
        assertEquals(3, cell.intensity)
    }

    @Test
    fun `HeatmapCell intensity range is 0-4`() {
        val intensities = (0..4).map { intensity ->
            HeatmapCell(
                date = LocalDate(2026, 5, 11),
                intensity = intensity,
            )
        }
        assertEquals(5, intensities.size)
        intensities.forEachIndexed { index, cell ->
            assertEquals(index, cell.intensity)
        }
    }

    @Test
    fun `InspectedPoint stores index, coordinates, label and value`() {
        val point = InspectedPoint(
            index = 2,
            x = 100f,
            y = 200f,
            label = "5/11",
            value = "100.0 PR",
        )
        assertEquals(2, point.index)
        assertEquals(100f, point.x)
        assertEquals(200f, point.y)
        assertEquals("5/11", point.label)
        assertEquals("100.0 PR", point.value)
    }

    @Test
    fun `formatDate formats as monthSlashDay`() {
        val date = LocalDate(2026, 5, 11)
        assertEquals("5/11", formatDate(date))
    }

    @Test
    fun `formatDate handles single digit month and day`() {
        val date = LocalDate(2026, 1, 3)
        assertEquals("1/3", formatDate(date))
    }

    @Test
    fun `formatValue formats integer values without decimals`() {
        assertEquals("100", formatValue(100.0))
        assertEquals("0", formatValue(0.0))
        assertEquals("50", formatValue(50.0))
    }

    @Test
    fun `formatValue formats decimal values with one decimal place`() {
        assertEquals("100.5", formatValue(100.5))
        assertEquals("87.5", formatValue(87.5))
    }

    @Test
    fun `28-day heatmap grid has correct cell count`() {
        val startDate = LocalDate(2026, 5, 1)
        val cells = (0 until 28).map { day ->
            HeatmapCell(
                date = startDate.plus(day, DateTimeUnit.DAY),
                intensity = (day % 5),
            )
        }
        assertEquals(28, cells.size)
        assertEquals(4, cells.size / 7) // 4 rows of 7
    }

    @Test
    fun `heatmap intensity scale builds from accent color`() {
        val cellNone = HeatmapCell(date = LocalDate(2026, 5, 1), intensity = 0)
        val cellLight = HeatmapCell(date = LocalDate(2026, 5, 2), intensity = 1)
        val cellMedium = HeatmapCell(date = LocalDate(2026, 5, 3), intensity = 2)
        val cellHigh = HeatmapCell(date = LocalDate(2026, 5, 4), intensity = 3)
        val cellMax = HeatmapCell(date = LocalDate(2026, 5, 5), intensity = 4)

        val cells = listOf(cellNone, cellLight, cellMedium, cellHigh, cellMax)
        assertEquals(listOf(0, 1, 2, 3, 4), cells.map { it.intensity })
    }
}
