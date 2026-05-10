package com.trainrecorder.ui.screens

import com.trainrecorder.domain.model.WeightUnit
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class SettingsHelperTest {

    // --- Settings Items Tests ---

    @Test
    fun `getSettingsItems returns items for kg unit`() {
        val items = getSettingsItems(WeightUnit.KG)
        assertTrue(items.size >= 5)

        val weightUnitItem = items.find { it.key == "weight_unit" }
        assertEquals("Kilograms (kg)", weightUnitItem!!.subtitle)
    }

    @Test
    fun `getSettingsItems returns items for lb unit`() {
        val items = getSettingsItems(WeightUnit.LB)
        val weightUnitItem = items.find { it.key == "weight_unit" }
        assertEquals("Pounds (lb)", weightUnitItem!!.subtitle)
    }

    @Test
    fun `getSettingsItems contains exercise library item`() {
        val items = getSettingsItems(WeightUnit.KG)
        assertTrue(items.any { it.key == "exercise_library" })
    }

    @Test
    fun `getSettingsItems contains export and import items`() {
        val items = getSettingsItems(WeightUnit.KG)
        assertTrue(items.any { it.key == "export_data" })
        assertTrue(items.any { it.key == "import_data" })
    }

    @Test
    fun `getSettingsItems clear_data is destructive`() {
        val items = getSettingsItems(WeightUnit.KG)
        val clearItem = items.find { it.key == "clear_data" }
        assertTrue(clearItem!!.isDestructive)
    }

    @Test
    fun `getSettingsItems weight_unit has toggle`() {
        val items = getSettingsItems(WeightUnit.KG)
        val weightUnitItem = items.find { it.key == "weight_unit" }
        assertTrue(weightUnitItem!!.hasToggle)
    }

    // --- Settings Sections Tests ---

    @Test
    fun `SETTINGS_SECTIONS has 3 sections`() {
        assertEquals(3, SETTINGS_SECTIONS.size)
        assertEquals(SettingsSection.GENERAL, SETTINGS_SECTIONS[0].first)
        assertEquals(SettingsSection.DATA_MANAGEMENT, SETTINGS_SECTIONS[1].first)
        assertEquals(SettingsSection.ABOUT, SETTINGS_SECTIONS[2].first)
    }

    // --- Export Format Validation Tests ---

    @Test
    fun `isValidExportFormat returns true for json`() {
        assertTrue(isValidExportFormat("json"))
    }

    @Test
    fun `isValidExportFormat returns true for csv`() {
        assertTrue(isValidExportFormat("csv"))
    }

    @Test
    fun `isValidExportFormat returns false for null`() {
        assertFalse(isValidExportFormat(null))
    }

    @Test
    fun `isValidExportFormat returns false for invalid format`() {
        assertFalse(isValidExportFormat("xml"))
    }

    // --- Clear Data Confirmation Tests ---

    @Test
    fun `buildClearDataConfirmationMessage is non-empty`() {
        val message = buildClearDataConfirmationMessage()
        assertTrue(message.isNotBlank())
        assertTrue(message.contains("delete", ignoreCase = true))
    }

    // --- Weight Unit Label Tests ---

    @Test
    fun `formatWeightUnitLabel returns correct labels`() {
        assertEquals("kg", formatWeightUnitLabel(WeightUnit.KG))
        assertEquals("lb", formatWeightUnitLabel(WeightUnit.LB))
    }

    // --- Weight Conversion Tests ---

    @Test
    fun `convertWeight returns same value for same unit`() {
        assertEquals(75.0, convertWeight(75.0, WeightUnit.KG, WeightUnit.KG))
        assertEquals(165.0, convertWeight(165.0, WeightUnit.LB, WeightUnit.LB))
    }

    @Test
    fun `convertWeight converts kg to lb`() {
        val result = convertWeight(75.0, WeightUnit.KG, WeightUnit.LB)
        assertEquals(75.0 * 2.20462, result, 0.01)
    }

    @Test
    fun `convertWeight converts lb to kg`() {
        val result = convertWeight(165.0, WeightUnit.LB, WeightUnit.KG)
        assertEquals(165.0 / 2.20462, result, 0.01)
    }

    @Test
    fun `convertWeight round-trip preserves value`() {
        val original = 100.0
        val toLb = convertWeight(original, WeightUnit.KG, WeightUnit.LB)
        val backToKg = convertWeight(toLb, WeightUnit.LB, WeightUnit.KG)
        assertEquals(original, backToKg, 0.001)
    }
}
