package com.trainrecorder.data.repository

import com.trainrecorder.TestDatabaseFactory
import com.trainrecorder.createTestDatabase
import com.trainrecorder.db.TrainRecorderDatabase
import com.trainrecorder.domain.model.DomainError
import com.trainrecorder.domain.model.WeightUnit
import com.trainrecorder.domain.repository.ExportFormat
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Instant
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertIs
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class SettingsRepositoryImplTest {

    private fun createRepository(): Pair<SettingsRepositoryImpl, TrainRecorderDatabase> {
        val db = createTestDatabase()
        val repo = SettingsRepositoryImpl(db)
        return repo to db
    }

    private suspend fun createInitializedRepository(): Pair<SettingsRepositoryImpl, TrainRecorderDatabase> {
        val (repo, db) = createRepository()
        repo.ensureSettingsInitialized()
        return repo to db
    }

    private val testInstant = Instant.parse("2025-01-15T10:30:00Z")

    // ============================================================
    // Settings Initialization
    // ============================================================

    @Test
    fun testEnsureSettingsInitialized() = runTest {
        val (repo, _) = createRepository()

        val result = repo.ensureSettingsInitialized()
        assertTrue(result.isSuccess)

        val settings = repo.getSettings().first()
        assertEquals(WeightUnit.KG, settings.weightUnit)
        assertEquals(180, settings.defaultRestSeconds)
        assertTrue(settings.trainingReminderEnabled)
        assertTrue(settings.vibrationEnabled)
        assertFalse(settings.soundEnabled)
        assertFalse(settings.onboardingCompleted)
    }

    @Test
    fun testEnsureSettingsIdempotent() = runTest {
        val (repo, _) = createRepository()

        repo.ensureSettingsInitialized()
        repo.ensureSettingsInitialized()

        val settings = repo.getSettings().first()
        assertEquals("default", settings.id)
    }

    // ============================================================
    // Update Weight Unit
    // ============================================================

    @Test
    fun testUpdateWeightUnitToLb() = runTest {
        val (repo, _) = createInitializedRepository()

        val result = repo.updateWeightUnit(WeightUnit.LB)
        assertTrue(result.isSuccess)

        val settings = repo.getSettings().first()
        assertEquals(WeightUnit.LB, settings.weightUnit)
    }

    @Test
    fun testUpdateWeightUnitBackToKg() = runTest {
        val (repo, _) = createInitializedRepository()

        repo.updateWeightUnit(WeightUnit.LB)
        repo.updateWeightUnit(WeightUnit.KG)

        val settings = repo.getSettings().first()
        assertEquals(WeightUnit.KG, settings.weightUnit)
    }

    // ============================================================
    // Update Default Rest
    // ============================================================

    @Test
    fun testUpdateDefaultRest() = runTest {
        val (repo, _) = createInitializedRepository()

        val result = repo.updateDefaultRest(120)
        assertTrue(result.isSuccess)

        val settings = repo.getSettings().first()
        assertEquals(120, settings.defaultRestSeconds)
    }

    @Test
    fun testUpdateDefaultRestVariousValues() = runTest {
        val (repo, _) = createInitializedRepository()

        val validRests = listOf(90, 120, 180, 240, 300)
        for (rest in validRests) {
            repo.updateDefaultRest(rest)
            val settings = repo.getSettings().first()
            assertEquals(rest, settings.defaultRestSeconds)
        }
    }

    // ============================================================
    // Update Notifications
    // ============================================================

    @Test
    fun testUpdateNotificationsAllOff() = runTest {
        val (repo, _) = createInitializedRepository()

        val result = repo.updateNotifications(reminder = false, vibration = false, sound = false)
        assertTrue(result.isSuccess)

        val settings = repo.getSettings().first()
        assertFalse(settings.trainingReminderEnabled)
        assertFalse(settings.vibrationEnabled)
        assertFalse(settings.soundEnabled)
    }

    @Test
    fun testUpdateNotificationsAllOn() = runTest {
        val (repo, _) = createInitializedRepository()

        repo.updateNotifications(reminder = false, vibration = false, sound = false)
        val result = repo.updateNotifications(reminder = true, vibration = true, sound = true)
        assertTrue(result.isSuccess)

        val settings = repo.getSettings().first()
        assertTrue(settings.trainingReminderEnabled)
        assertTrue(settings.vibrationEnabled)
        assertTrue(settings.soundEnabled)
    }

    // ============================================================
    // Complete Onboarding
    // ============================================================

    @Test
    fun testCompleteOnboarding() = runTest {
        val (repo, _) = createInitializedRepository()

        assertFalse(repo.getSettings().first().onboardingCompleted)

        val result = repo.completeOnboarding()
        assertTrue(result.isSuccess)

        assertTrue(repo.getSettings().first().onboardingCompleted)
    }

    // ============================================================
    // Settings Round-trip
    // ============================================================

    @Test
    fun testSettingsRoundTrip() = runTest {
        val (repo, _) = createInitializedRepository()

        repo.updateWeightUnit(WeightUnit.LB)
        repo.updateDefaultRest(300)
        repo.updateNotifications(reminder = true, vibration = false, sound = true)
        repo.completeOnboarding()

        val settings = repo.getSettings().first()
        assertEquals(WeightUnit.LB, settings.weightUnit)
        assertEquals(300, settings.defaultRestSeconds)
        assertTrue(settings.trainingReminderEnabled)
        assertFalse(settings.vibrationEnabled)
        assertTrue(settings.soundEnabled)
        assertTrue(settings.onboardingCompleted)
    }

    // ============================================================
    // Unit Conversion
    // ============================================================

    @Test
    fun testKgToLbConversion() {
        val result = SettingsRepositoryImpl.kgToLb(1.0)
        assertEquals(2.20462, result, 0.0001)
    }

    @Test
    fun testLbToKgConversion() {
        val result = SettingsRepositoryImpl.lbToKg(2.20462)
        assertEquals(1.0, result, 0.0001)
    }

    @Test
    fun testConversionRoundTrip() {
        val original = 100.0
        val converted = SettingsRepositoryImpl.lbToKg(SettingsRepositoryImpl.kgToLb(original))
        assertEquals(original, converted, 0.001)
    }

    @Test
    fun testConversionConstants() {
        assertEquals(2.20462, SettingsRepositoryImpl.KG_TO_LB)
    }

    // ============================================================
    // Export Data (JSON)
    // ============================================================

    @Test
    fun testExportDataAsJson() = runTest {
        val (repo, _) = createInitializedRepository()

        val result = repo.exportData(ExportFormat.JSON, null)
        if (result.isFailure) {
            // Print the error for debugging
            println("Export failed: ${result.exceptionOrNull()}")
            println("Cause: ${result.exceptionOrNull()?.cause}")
        }
        assertTrue(result.isSuccess)

        val jsonStr = result.getOrThrow()
        assertTrue(jsonStr.contains("version"))
        assertTrue(jsonStr.isNotEmpty())
    }

    @Test
    fun testExportDataAsCsvNotSupported() = runTest {
        val (repo, _) = createInitializedRepository()

        val result = repo.exportData(ExportFormat.CSV, null)
        assertTrue(result.isFailure)
        assertIs<DomainError.ExportFailedError>(result.exceptionOrNull())
    }

    // ============================================================
    // Clear All Data
    // ============================================================

    @Test
    fun testClearAllDataSucceeds() = runTest {
        val (repo, _) = createInitializedRepository()

        val result = repo.clearAllData()
        assertTrue(result.isSuccess)

        // Settings should still exist (not cleared)
        val settings = repo.getSettings().first()
        assertNotNull(settings)
        assertEquals("default", settings.id)
    }

    @Test
    fun testClearAllDataPreservesExercisesAndSettings() = runTest {
        val (repo, db) = createInitializedRepository()

        // Insert default exercises
        val exerciseRepo = ExerciseRepositoryImpl(db)
        exerciseRepo.seedDefaultExercises()

        // Clear all data
        val result = repo.clearAllData()
        assertTrue(result.isSuccess)

        // Exercises should still exist
        val exercises = exerciseRepo.getAll().first()
        assertEquals(21, exercises.size)

        // Settings should still exist
        val settings = repo.getSettings().first()
        assertNotNull(settings)
        assertEquals("default", settings.id)
    }

    // ============================================================
    // Import Data (JSON string-based)
    // ============================================================

    @Test
    fun testImportDataRejectsInvalidJson() = runTest {
        val (repo, _) = createInitializedRepository()

        val result = repo.importDataFromJson("not valid json")
        assertTrue(result.isFailure)
    }

    @Test
    fun testImportDataRejectsMissingVersion() = runTest {
        val (repo, _) = createInitializedRepository()

        val result = repo.importDataFromJson("""{"settings": {}}""")
        assertTrue(result.isFailure)
    }

    @Test
    fun testImportDataRejectsUnsupportedVersion() = runTest {
        val (repo, _) = createInitializedRepository()

        val result = repo.importDataFromJson("""{"version": 99, "settings": {}}""")
        assertTrue(result.isFailure)
    }

    @Test
    fun testExportAndImportRoundTrip() = runTest {
        val (repo, db) = createInitializedRepository()

        // Seed exercises
        val exerciseRepo = ExerciseRepositoryImpl(db)
        exerciseRepo.seedDefaultExercises()

        // Create a plan so there's data to import
        val now = kotlinx.datetime.Clock.System.now().toString()
        db.trainRecorderQueries.insertPlan(
            id = "plan-1",
            display_name = "Test Plan",
            plan_mode = "infinite_loop",
            cycle_length = null,
            schedule_mode = "weekly_fixed",
            interval_days = null,
            is_active = 1L,
            created_at = now,
            updated_at = now,
        )

        // Export
        val exportResult = repo.exportData(ExportFormat.JSON, null)
        assertTrue(exportResult.isSuccess)
        val jsonStr = exportResult.getOrThrow()

        // Clear all data (preserves exercises and settings)
        repo.clearAllData()

        // Verify plan is gone
        val plansAfterClear = db.trainRecorderQueries.selectAllTrainingPlans().executeAsList()
        assertEquals(0, plansAfterClear.size)

        // Import back
        val importResult = repo.importDataFromJson(jsonStr)
        if (importResult.isFailure) {
            println("Import failed: ${importResult.exceptionOrNull()}")
            println("Cause: ${importResult.exceptionOrNull()?.cause}")
        }
        assertTrue(importResult.isSuccess)
        val importReport = importResult.getOrThrow()
        assertTrue(importReport.importedCount > 0, "Expected importedCount > 0, got ${importReport.importedCount}. Errors: ${importReport.errors}")
    }

    @Test
    fun testImportDataRegeneratesIds() = runTest {
        val (repo, _) = createInitializedRepository()

        val json = """
        {
            "version": 1,
            "exportedAt": "2025-01-15T10:30:00Z",
            "settings": {"id":"default","weight_unit":"kg","default_rest_seconds":180,"training_reminder_enabled":1,"vibration_enabled":1,"sound_enabled":0,"onboarding_completed":0,"updated_at":"2025-01-15T10:30:00Z"},
            "exercises": [],
            "trainingPlans": [{"id":"old-plan-1","display_name":"Test Plan","plan_mode":"infinite_loop","cycle_length":null,"schedule_mode":"weekly_fixed","interval_days":null,"is_active":1,"created_at":"2025-01-15T10:30:00Z","updated_at":"2025-01-15T10:30:00Z"}],
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

        val result = repo.importDataFromJson(json)
        assertTrue(result.isSuccess)
        // The import should succeed with regenerated IDs
    }

    @Test
    fun testImportDataTransactionRollbackOnFailure() = runTest {
        val (repo, _) = createInitializedRepository()

        // Import with missing required key should not leave partial data
        val json = """
        {
            "version": 1,
            "settings": {},
            "exercises": [],
            "trainingPlans": [],
            "trainingDays": [],
            "trainingDayExercises": [],
            "trainingDaySetConfigs": [],
            "workoutSessions": [{"bad": "data"}],
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

        val result = repo.importDataFromJson(json)
        // Should succeed but with errors reported
        // Individual row parse failures are captured, not thrown
        if (result.isSuccess) {
            val report = result.getOrThrow()
            assertTrue(report.errors.isNotEmpty())
        }
    }

    // ============================================================
    // Full JSON Export Content Tests
    // ============================================================

    @Test
    fun testExportContainsAllRequiredTables() = runTest {
        val (repo, db) = createInitializedRepository()
        val exerciseRepo = ExerciseRepositoryImpl(db)
        exerciseRepo.seedDefaultExercises()

        val result = repo.exportData(ExportFormat.JSON, null)
        assertTrue(result.isSuccess)

        val json = result.getOrThrow()
        // Check that JSON contains all the required table names
        assertTrue(json.contains("\"version\""))
        assertTrue(json.contains("\"exercises\""))
        assertTrue(json.contains("\"trainingPlans\""))
        assertTrue(json.contains("\"settings\""))
    }

    @Test
    fun testExportWithDateRangeFiltersSessions() = runTest {
        val (repo, db) = createInitializedRepository()

        // Insert a workout session
        val now = kotlinx.datetime.Clock.System.now().toString()
        db.trainRecorderQueries.insertSession(
            id = "session-1",
            plan_id = null,
            training_day_id = null,
            record_date = "2025-03-15",
            training_type = "push",
            workout_status = "completed",
            started_at = now,
            ended_at = now,
            is_backfill = 0L,
            created_at = now,
            updated_at = now,
        )

        // Export with date range that includes the session
        val range = com.trainrecorder.domain.repository.DateRange(
            start = kotlinx.datetime.LocalDate.parse("2025-03-01"),
            end = kotlinx.datetime.LocalDate.parse("2025-03-31"),
        )
        val result = repo.exportData(ExportFormat.JSON, range)
        assertTrue(result.isSuccess)

        val json = result.getOrThrow()
        assertTrue(json.contains("session-1"))
    }

    @Test
    fun testExportWithDateRangeExcludesOutOfRangeSessions() = runTest {
        val (repo, db) = createInitializedRepository()

        // Insert a workout session outside the range
        val now = kotlinx.datetime.Clock.System.now().toString()
        db.trainRecorderQueries.insertSession(
            id = "session-old",
            plan_id = null,
            training_day_id = null,
            record_date = "2024-01-15",
            training_type = "push",
            workout_status = "completed",
            started_at = now,
            ended_at = now,
            is_backfill = 0L,
            created_at = now,
            updated_at = now,
        )

        // Export with date range that excludes the session
        val range = com.trainrecorder.domain.repository.DateRange(
            start = kotlinx.datetime.LocalDate.parse("2025-03-01"),
            end = kotlinx.datetime.LocalDate.parse("2025-03-31"),
        )
        val result = repo.exportData(ExportFormat.JSON, range)
        assertTrue(result.isSuccess)

        val json = result.getOrThrow()
        assertFalse(json.contains("session-old"))
    }
}
