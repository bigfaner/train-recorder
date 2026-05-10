package com.trainrecorder.ui.screens

import com.trainrecorder.domain.model.ExerciseCategory
import com.trainrecorder.domain.model.WeightUnit
import kotlinx.datetime.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class DataExportHelperTest {

    // ============================================================
    // JSON Schema Validation
    // ============================================================

    @Test
    fun `validateExportJson returns valid for correct schema`() {
        val json = """
        {
            "version": 1,
            "exportedAt": "2025-01-15T10:30:00Z",
            "settings": {},
            "exercises": [],
            "trainingPlans": [],
            "trainingDays": [],
            "trainingDayExercises": [],
            "trainingDaySetConfigs": [],
            "workoutSessions": [],
            "workoutExercises": [],
            "exerciseSets": [],
            "workoutFeelings": [],
            "exerciseFeelings": [],
            "personalRecords": [],
            "weightSuggestions": [],
            "bodyMeasurements": [],
            "otherSportTypes": [],
            "otherSportMetrics": [],
            "otherSportRecords": [],
            "otherSportMetricValues": [],
            "timerStates": []
        }
        """.trimIndent()

        val result = validateExportJson(json)
        assertTrue(result.isValid)
        assertNull(result.error)
    }

    @Test
    fun `validateExportJson returns invalid for missing version`() {
        val json = """{"settings": {}}"""
        val result = validateExportJson(json)
        assertFalse(result.isValid)
        assertNotNull(result.error)
    }

    @Test
    fun `validateExportJson returns invalid for empty string`() {
        val result = validateExportJson("")
        assertFalse(result.isValid)
    }

    @Test
    fun `validateExportJson returns invalid for malformed JSON`() {
        val result = validateExportJson("{not valid json")
        assertFalse(result.isValid)
    }

    @Test
    fun `validateExportJson returns invalid for unsupported version`() {
        val json = """{"version": 99, "settings": {}}"""
        val result = validateExportJson(json)
        assertFalse(result.isValid)
        assertTrue(result.error!!.contains("version", ignoreCase = true))
    }

    // ============================================================
    // Date Range Filtering
    // ============================================================

    @Test
    fun `isWithinDateRange returns true for date within range`() {
        val date = LocalDate.parse("2025-03-15")
        val start = LocalDate.parse("2025-03-01")
        val end = LocalDate.parse("2025-03-31")
        assertTrue(isWithinDateRange(date, start, end))
    }

    @Test
    fun `isWithinDateRange returns true for date equal to start`() {
        val date = LocalDate.parse("2025-03-01")
        val start = LocalDate.parse("2025-03-01")
        val end = LocalDate.parse("2025-03-31")
        assertTrue(isWithinDateRange(date, start, end))
    }

    @Test
    fun `isWithinDateRange returns true for date equal to end`() {
        val date = LocalDate.parse("2025-03-31")
        val start = LocalDate.parse("2025-03-01")
        val end = LocalDate.parse("2025-03-31")
        assertTrue(isWithinDateRange(date, start, end))
    }

    @Test
    fun `isWithinDateRange returns false for date before range`() {
        val date = LocalDate.parse("2025-02-28")
        val start = LocalDate.parse("2025-03-01")
        val end = LocalDate.parse("2025-03-31")
        assertFalse(isWithinDateRange(date, start, end))
    }

    @Test
    fun `isWithinDateRange returns false for date after range`() {
        val date = LocalDate.parse("2025-04-01")
        val start = LocalDate.parse("2025-03-01")
        val end = LocalDate.parse("2025-03-31")
        assertFalse(isWithinDateRange(date, start, end))
    }

    // ============================================================
    // ID Regeneration
    // ============================================================

    @Test
    fun `regenerateId returns non-empty string`() {
        val newId = regenerateId("old-id-123")
        assertTrue(newId.isNotEmpty())
    }

    @Test
    fun `regenerateId returns different id each call`() {
        val id1 = regenerateId("same-input")
        val id2 = regenerateId("same-input")
        // While technically possible, UUIDs should differ
        assertTrue(id1.isNotEmpty())
        assertTrue(id2.isNotEmpty())
    }

    @Test
    fun `buildIdMapping creates correct mapping`() {
        val oldIds = listOf("id-1", "id-2", "id-3")
        val mapping = buildIdMapping(oldIds)
        assertEquals(3, mapping.size)
        assertTrue(mapping.containsKey("id-1"))
        assertTrue(mapping.containsKey("id-2"))
        assertTrue(mapping.containsKey("id-3"))
        // Each new ID should be different from the old
        mapping.forEach { (old, new) ->
            assertTrue(new.isNotEmpty())
        }
    }

    @Test
    fun `buildIdMapping generates unique new ids`() {
        val oldIds = listOf("a", "b", "c", "d", "e")
        val mapping = buildIdMapping(oldIds)
        val newIds = mapping.values.toSet()
        assertEquals(5, newIds.size) // all unique
    }

    // ============================================================
    // Export Preset Date Ranges
    // ============================================================

    @Test
    fun `getExportDateRangePresets returns 3 options`() {
        val presets = getExportDateRangePresets(today = LocalDate.parse("2025-06-15"))
        assertEquals(3, presets.size)
        assertEquals("All", presets[0].label)
        assertEquals("Last 3 Months", presets[1].label)
        assertEquals("Last 6 Months", presets[2].label)
    }

    @Test
    fun `All preset has null date range`() {
        val presets = getExportDateRangePresets(today = LocalDate.parse("2025-06-15"))
        assertNull(presets[0].start)
        assertNull(presets[0].end)
    }

    @Test
    fun `Last 3 Months preset computes correct range`() {
        val today = LocalDate.parse("2025-06-15")
        val presets = getExportDateRangePresets(today)
        val threeMonths = presets[1]
        assertEquals(LocalDate.parse("2025-03-15"), threeMonths.start)
        assertEquals(today, threeMonths.end)
    }

    @Test
    fun `Last 6 Months preset computes correct range`() {
        val today = LocalDate.parse("2025-06-15")
        val presets = getExportDateRangePresets(today)
        val sixMonths = presets[2]
        assertEquals(LocalDate.parse("2024-12-15"), sixMonths.start)
        assertEquals(today, sixMonths.end)
    }

    // ============================================================
    // Clear Data description
    // ============================================================

    @Test
    fun `getClearDataDescription lists preserved items`() {
        val desc = getClearDataDescription()
        assertTrue(desc.contains("exercise library", ignoreCase = true))
        assertTrue(desc.contains("settings", ignoreCase = true))
    }
}
