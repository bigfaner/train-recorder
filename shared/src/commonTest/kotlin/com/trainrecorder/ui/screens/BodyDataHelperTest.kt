package com.trainrecorder.ui.screens

import com.trainrecorder.domain.model.BodyMeasurement
import com.trainrecorder.viewmodel.BodyMetric
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class BodyDataHelperTest {

    // --- Body Data Form Validation Tests ---

    @Test
    fun `validateBodyDataForm returns error when weight is null`() {
        val result = validateBodyDataForm(null)
        assertFalse(result.isValid)
        assertEquals("Weight is required", result.weightError)
    }

    @Test
    fun `validateBodyDataForm returns error when weight is blank`() {
        val result = validateBodyDataForm("")
        assertFalse(result.isValid)
        assertEquals("Weight is required", result.weightError)
    }

    @Test
    fun `validateBodyDataForm returns error when weight is not a number`() {
        val result = validateBodyDataForm("abc")
        assertFalse(result.isValid)
        assertEquals("Invalid weight value", result.weightError)
    }

    @Test
    fun `validateBodyDataForm returns error when weight is zero`() {
        val result = validateBodyDataForm("0")
        assertFalse(result.isValid)
        assertEquals("Weight must be positive", result.weightError)
    }

    @Test
    fun `validateBodyDataForm returns error when weight is negative`() {
        val result = validateBodyDataForm("-5.0")
        assertFalse(result.isValid)
        assertEquals("Weight must be positive", result.weightError)
    }

    @Test
    fun `validateBodyDataForm passes for valid weight`() {
        val result = validateBodyDataForm("75.5")
        assertTrue(result.isValid)
        assertNull(result.weightError)
    }

    @Test
    fun `validateBodyDataForm passes for integer weight`() {
        val result = validateBodyDataForm("75")
        assertTrue(result.isValid)
    }

    // --- Weight Trend Tests ---

    @Test
    fun `computeWeightTrend returns null for empty list`() {
        assertNull(computeWeightTrend(emptyList()))
    }

    @Test
    fun `computeWeightTrend returns null for single measurement`() {
        val measurements = listOf(
            makeMeasurement(LocalDate(2026, 5, 1), 75.0),
        )
        assertNull(computeWeightTrend(measurements))
    }

    @Test
    fun `computeWeightTrend returns decreasing for weight loss`() {
        val measurements = listOf(
            makeMeasurement(LocalDate(2026, 5, 1), 76.0),
            makeMeasurement(LocalDate(2026, 5, 5), 75.5),
        )
        val result = computeWeightTrend(measurements)
        assertNotNull(result)
        assertEquals(0.5, result.first)
        assertTrue(result.second) // isDecreasing
    }

    @Test
    fun `computeWeightTrend returns increasing for weight gain`() {
        val measurements = listOf(
            makeMeasurement(LocalDate(2026, 5, 1), 75.0),
            makeMeasurement(LocalDate(2026, 5, 5), 75.5),
        )
        val result = computeWeightTrend(measurements)
        assertNotNull(result)
        assertEquals(0.5, result.first)
        assertFalse(result.second) // not decreasing
    }

    @Test
    fun `computeWeightTrend returns null when latest has no weight`() {
        val measurements = listOf(
            makeMeasurement(LocalDate(2026, 5, 1), 75.0),
            makeMeasurement(LocalDate(2026, 5, 5), null),
        )
        assertNull(computeWeightTrend(measurements))
    }

    // --- Measurement Value Formatting Tests ---

    @Test
    fun `formatMeasurementValue formats value with unit`() {
        assertEquals("75.5 kg", formatMeasurementValue(75.5, "kg"))
    }

    @Test
    fun `formatMeasurementValue returns placeholder for null`() {
        assertEquals("-- cm", formatMeasurementValue(null, "cm"))
    }

    // --- Metric Label Tests ---

    @Test
    fun `getMetricLabel returns correct labels`() {
        assertEquals("Weight", getMetricLabel(BodyMetric.WEIGHT))
        assertEquals("Chest", getMetricLabel(BodyMetric.CHEST))
        assertEquals("Waist", getMetricLabel(BodyMetric.WAIST))
        assertEquals("Arm", getMetricLabel(BodyMetric.ARM))
        assertEquals("Thigh", getMetricLabel(BodyMetric.THIGH))
    }

    // --- Metric Unit Tests ---

    @Test
    fun `getMetricUnit returns correct units`() {
        assertEquals("kg", getMetricUnit(BodyMetric.WEIGHT))
        assertEquals("cm", getMetricUnit(BodyMetric.CHEST))
        assertEquals("cm", getMetricUnit(BodyMetric.WAIST))
        assertEquals("cm", getMetricUnit(BodyMetric.ARM))
        assertEquals("cm", getMetricUnit(BodyMetric.THIGH))
    }

    // --- Body Data Tab Tests ---

    @Test
    fun `getBodyDataTabs returns trend and history tabs`() {
        val tabs = getBodyDataTabs()
        assertEquals(2, tabs.size)
        assertEquals(BodyDataTab.TREND, tabs[0])
        assertEquals(BodyDataTab.HISTORY, tabs[1])
    }

    // --- Helper ---

    private fun makeMeasurement(
        date: LocalDate,
        weight: Double?,
    ): BodyMeasurement = BodyMeasurement(
        id = "",
        recordDate = date,
        bodyWeight = weight,
        chest = null,
        waist = null,
        arm = null,
        thigh = null,
        notes = null,
        createdAt = Clock.System.now(),
        updatedAt = Clock.System.now(),
    )
}
