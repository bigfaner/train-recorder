package com.trainrecorder.ui.screens

import com.trainrecorder.domain.model.MetricInputType
import com.trainrecorder.domain.model.OtherSportMetric
import kotlinx.datetime.Clock
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class OtherSportHelperTest {

    // --- Resolve Metric Fields Tests ---

    @Test
    fun `resolveMetricFields returns empty list for empty input`() {
        val fields = resolveMetricFields(emptyList())
        assertTrue(fields.isEmpty())
    }

    @Test
    fun `resolveMetricFields maps metrics to fields correctly`() {
        val metrics = listOf(
            makeMetric("m1", "Distance", "distance", MetricInputType.NUMBER, true, "m"),
            makeMetric("m2", "Notes", "notes", MetricInputType.TEXT, false, null),
        )
        val fields = resolveMetricFields(metrics)
        assertEquals(2, fields.size)
        assertEquals("m1", fields[0].metricId)
        assertEquals("Distance", fields[0].label)
        assertEquals("m", fields[0].unit)
        assertEquals(MetricInputType.NUMBER, fields[0].inputType)
        assertTrue(fields[0].isRequired)
        assertEquals("m2", fields[1].metricId)
        assertFalse(fields[1].isRequired)
    }

    @Test
    fun `resolveMetricFields preserves all metric properties`() {
        val metrics = listOf(
            makeMetric("m1", "Laps", "laps", MetricInputType.NUMBER, true, "laps"),
        )
        val fields = resolveMetricFields(metrics)
        assertEquals("Laps", fields[0].label)
        assertEquals("laps", fields[0].unit)
    }

    // --- Validate Metric Value Tests ---

    @Test
    fun `validateMetricValue returns null for valid number`() {
        val field = MetricField("m1", "Distance", "m", MetricInputType.NUMBER, true)
        assertNull(validateMetricValue("1500", field))
    }

    @Test
    fun `validateMetricValue returns null for valid decimal number`() {
        val field = MetricField("m1", "Distance", "km", MetricInputType.NUMBER, true)
        assertNull(validateMetricValue("5.5", field))
    }

    @Test
    fun `validateMetricValue returns error for non-numeric required field`() {
        val field = MetricField("m1", "Distance", "m", MetricInputType.NUMBER, true)
        val error = validateMetricValue("abc", field)
        assertNotNull(error)
        assertEquals("Distance must be a number", error)
    }

    @Test
    fun `validateMetricValue returns error for blank required field`() {
        val field = MetricField("m1", "Distance", "m", MetricInputType.NUMBER, true)
        val error = validateMetricValue("", field)
        assertEquals("Distance is required", error)
    }

    @Test
    fun `validateMetricValue returns null for blank optional field`() {
        val field = MetricField("m1", "Notes", null, MetricInputType.TEXT, false)
        assertNull(validateMetricValue("", field))
    }

    @Test
    fun `validateMetricValue returns null for null optional field`() {
        val field = MetricField("m1", "Notes", null, MetricInputType.TEXT, false)
        assertNull(validateMetricValue(null, field))
    }

    @Test
    fun `validateMetricValue returns null for null required field`() {
        val field = MetricField("m1", "Distance", "m", MetricInputType.NUMBER, true)
        val error = validateMetricValue(null, field)
        assertEquals("Distance is required", error)
    }

    @Test
    fun `validateMetricValue returns null for any text input`() {
        val field = MetricField("m1", "Notes", null, MetricInputType.TEXT, true)
        assertNull(validateMetricValue("Any text", field))
    }

    // --- Validate All Metrics Tests ---

    @Test
    fun `validateAllMetrics returns empty errors for valid values`() {
        val fields = listOf(
            MetricField("m1", "Distance", "m", MetricInputType.NUMBER, true),
            MetricField("m2", "Notes", null, MetricInputType.TEXT, false),
        )
        val values = mapOf("m1" to "1500", "m2" to "Felt good")
        val errors = validateAllMetrics(values, fields)
        assertTrue(errors.isEmpty())
    }

    @Test
    fun `validateAllMetrics reports errors for missing required fields`() {
        val fields = listOf(
            MetricField("m1", "Distance", "m", MetricInputType.NUMBER, true),
            MetricField("m2", "Time", "min", MetricInputType.NUMBER, true),
        )
        val values = mapOf("m1" to "1500")
        val errors = validateAllMetrics(values, fields)
        assertEquals(1, errors.size)
        assertTrue(errors.containsKey("m2"))
    }

    @Test
    fun `validateAllMetrics reports multiple errors`() {
        val fields = listOf(
            MetricField("m1", "Distance", "m", MetricInputType.NUMBER, true),
            MetricField("m2", "Time", "min", MetricInputType.NUMBER, true),
        )
        val values = mapOf("m1" to "abc", "m2" to "")
        val errors = validateAllMetrics(values, fields)
        assertEquals(2, errors.size)
    }

    // --- Sport Type Grid Columns Tests ---

    @Test
    fun `SPORT_TYPE_GRID_COLUMNS is 3`() {
        assertEquals(3, SPORT_TYPE_GRID_COLUMNS)
    }

    // --- Preset Metric Options Tests ---

    @Test
    fun `PRESET_METRIC_OPTIONS has 5 options`() {
        assertEquals(5, PRESET_METRIC_OPTIONS.size)
    }

    @Test
    fun `PRESET_METRIC_OPTIONS includes duration`() {
        val duration = PRESET_METRIC_OPTIONS.find { it.key == "duration" }
        assertNotNull(duration)
        assertEquals("Duration", duration!!.displayName)
        assertEquals("min", duration.unit)
    }

    @Test
    fun `PRESET_METRIC_OPTIONS includes distance`() {
        val distance = PRESET_METRIC_OPTIONS.find { it.key == "distance" }
        assertNotNull(distance)
        assertEquals("Distance", distance!!.displayName)
        assertEquals("km", distance.unit)
    }

    // --- Helper ---

    private fun makeMetric(
        id: String,
        name: String,
        key: String,
        inputType: MetricInputType,
        required: Boolean,
        unit: String?,
    ): OtherSportMetric = OtherSportMetric(
        id = id,
        sportTypeId = "st1",
        metricName = name,
        metricKey = key,
        inputType = inputType,
        isRequired = required,
        unit = unit,
        createdAt = Clock.System.now(),
        updatedAt = Clock.System.now(),
    )
}
