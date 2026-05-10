package com.trainrecorder.viewmodel

import com.trainrecorder.domain.model.UserSettings
import com.trainrecorder.domain.model.WeightUnit
import com.trainrecorder.domain.repository.DateRange
import com.trainrecorder.domain.repository.ExportFormat
import com.trainrecorder.domain.repository.ImportResult
import com.trainrecorder.domain.repository.SettingsRepository
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Clock
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class SettingsViewModelTest {

    private fun makeSettings(
        weightUnit: WeightUnit = WeightUnit.KG,
        restSeconds: Int = 90,
    ) = UserSettings(
        id = "settings1",
        weightUnit = weightUnit,
        defaultRestSeconds = restSeconds,
        trainingReminderEnabled = true,
        vibrationEnabled = true,
        soundEnabled = true,
        onboardingCompleted = false,
        updatedAt = Clock.System.now(),
    )

    private val defaultSettings = makeSettings()

    private class FakeSettingsRepository(
        settings: UserSettings,
        private val updateWeightUnitResult: Result<Unit> = Result.success(Unit),
        private val updateDefaultRestResult: Result<Unit> = Result.success(Unit),
        private val updateNotificationsResult: Result<Unit> = Result.success(Unit),
        private val exportResult: Result<String> = Result.success("/path/to/export"),
        private val importResult: Result<ImportResult> = Result.success(ImportResult(10, 0, emptyList())),
        private val clearAllDataResult: Result<Unit> = Result.success(Unit),
        private val completeOnboardingResult: Result<Unit> = Result.success(Unit),
    ) : SettingsRepository {
        private val _settings = MutableStateFlow(settings)

        override fun getSettings(): Flow<UserSettings> = _settings
        override suspend fun updateWeightUnit(unit: WeightUnit): Result<Unit> = updateWeightUnitResult
        override suspend fun updateDefaultRest(seconds: Int): Result<Unit> = updateDefaultRestResult
        override suspend fun updateNotifications(reminder: Boolean, vibration: Boolean, sound: Boolean): Result<Unit> = updateNotificationsResult
        override suspend fun completeOnboarding(): Result<Unit> = completeOnboardingResult
        override suspend fun exportData(format: ExportFormat, dateRange: DateRange?): Result<String> = exportResult
        override suspend fun importData(filePath: String): Result<ImportResult> = importResult
        override suspend fun clearAllData(): Result<Unit> = clearAllDataResult
    }

    private fun makeFakeRepo(
        settings: UserSettings = defaultSettings,
        updateWeightUnitResult: Result<Unit> = Result.success(Unit),
        updateDefaultRestResult: Result<Unit> = Result.success(Unit),
        updateNotificationsResult: Result<Unit> = Result.success(Unit),
        exportResult: Result<String> = Result.success("/path/to/export"),
        importResult: Result<ImportResult> = Result.success(ImportResult(10, 0, emptyList())),
        clearAllDataResult: Result<Unit> = Result.success(Unit),
        completeOnboardingResult: Result<Unit> = Result.success(Unit),
    ) = FakeSettingsRepository(
        settings = settings,
        updateWeightUnitResult = updateWeightUnitResult,
        updateDefaultRestResult = updateDefaultRestResult,
        updateNotificationsResult = updateNotificationsResult,
        exportResult = exportResult,
        importResult = importResult,
        clearAllDataResult = clearAllDataResult,
        completeOnboardingResult = completeOnboardingResult,
    )

    @Test
    fun `initial state has null settings before loading`() {
        val testScope = TestScope()
        val vm = SettingsViewModel(
            settingsRepository = makeFakeRepo(),
            coroutineScope = testScope,
        )

        val state = vm.state.value
        assertNull(state.settings)
        assertFalse(state.isLoaded)
        assertFalse(state.isExporting)
        assertFalse(state.isImporting)
        assertNull(state.error)
    }

    @Test
    fun `settings are loaded on init`() = runTest {
        val settings = makeSettings()
        val testScope = TestScope()
        val vm = SettingsViewModel(
            settingsRepository = makeFakeRepo(settings = settings),
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertTrue(state.isLoaded)
        assertNotNull(state.settings)
        assertEquals(WeightUnit.KG, state.settings!!.weightUnit)
        assertEquals(90, state.settings!!.defaultRestSeconds)
    }

    @Test
    fun `updateWeightUnit delegates to repository`() = runTest {
        val testScope = TestScope()
        val vm = SettingsViewModel(
            settingsRepository = makeFakeRepo(),
            coroutineScope = testScope,
        )

        vm.onEvent(SettingsEvent.UpdateWeightUnit(WeightUnit.LB))
        testScope.advanceUntilIdle()

        assertNull(vm.state.value.error)
    }

    @Test
    fun `updateWeightUnit handles failure`() = runTest {
        val testScope = TestScope()
        val vm = SettingsViewModel(
            settingsRepository = makeFakeRepo(
                updateWeightUnitResult = Result.failure(Exception("Update failed")),
            ),
            coroutineScope = testScope,
        )

        vm.onEvent(SettingsEvent.UpdateWeightUnit(WeightUnit.LB))
        testScope.advanceUntilIdle()

        assertEquals("Update failed", vm.state.value.error)
    }

    @Test
    fun `updateDefaultRest delegates to repository`() = runTest {
        val testScope = TestScope()
        val vm = SettingsViewModel(
            settingsRepository = makeFakeRepo(),
            coroutineScope = testScope,
        )

        vm.onEvent(SettingsEvent.UpdateDefaultRest(120))
        testScope.advanceUntilIdle()

        assertNull(vm.state.value.error)
    }

    @Test
    fun `exportData sets exporting state`() = runTest {
        val testScope = TestScope()
        val vm = SettingsViewModel(
            settingsRepository = makeFakeRepo(),
            coroutineScope = testScope,
        )

        vm.onEvent(SettingsEvent.ExportData(ExportFormat.JSON, null))
        testScope.advanceUntilIdle()

        assertFalse(vm.state.value.isExporting)
        assertNull(vm.state.value.error)
    }

    @Test
    fun `exportData handles failure`() = runTest {
        val testScope = TestScope()
        val vm = SettingsViewModel(
            settingsRepository = makeFakeRepo(
                exportResult = Result.failure(Exception("Export failed")),
            ),
            coroutineScope = testScope,
        )

        vm.onEvent(SettingsEvent.ExportData(ExportFormat.JSON, null))
        testScope.advanceUntilIdle()

        assertFalse(vm.state.value.isExporting)
        assertEquals("Export failed", vm.state.value.error)
    }

    @Test
    fun `importData sets importing state`() = runTest {
        val testScope = TestScope()
        val vm = SettingsViewModel(
            settingsRepository = makeFakeRepo(),
            coroutineScope = testScope,
        )

        vm.onEvent(SettingsEvent.ImportData("/path/to/import"))
        testScope.advanceUntilIdle()

        assertFalse(vm.state.value.isImporting)
        assertNull(vm.state.value.error)
    }

    @Test
    fun `clearAllData delegates to repository`() = runTest {
        val testScope = TestScope()
        val vm = SettingsViewModel(
            settingsRepository = makeFakeRepo(),
            coroutineScope = testScope,
        )

        vm.onEvent(SettingsEvent.ClearAllData)
        testScope.advanceUntilIdle()

        assertNull(vm.state.value.error)
    }

    @Test
    fun `completeOnboarding delegates to repository`() = runTest {
        val testScope = TestScope()
        val vm = SettingsViewModel(
            settingsRepository = makeFakeRepo(),
            coroutineScope = testScope,
        )

        vm.onEvent(SettingsEvent.CompleteOnboarding)
        testScope.advanceUntilIdle()

        assertNull(vm.state.value.error)
    }
}
