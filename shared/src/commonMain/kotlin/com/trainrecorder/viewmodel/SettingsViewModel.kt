package com.trainrecorder.viewmodel

import com.trainrecorder.domain.model.UserSettings
import com.trainrecorder.domain.model.WeightUnit
import com.trainrecorder.domain.repository.DateRange
import com.trainrecorder.domain.repository.ExportFormat
import com.trainrecorder.domain.repository.ImportResult
import com.trainrecorder.domain.repository.SettingsRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock

data class SettingsUiState(
    val settings: UserSettings?,
    val isExporting: Boolean,
    val isImporting: Boolean,
    val isLoaded: Boolean,
    val error: String? = null,
) {
    companion object {
        fun initial() = SettingsUiState(
            settings = null,
            isExporting = false,
            isImporting = false,
            isLoaded = false,
        )
    }
}

sealed class SettingsEvent {
    data class UpdateWeightUnit(val unit: WeightUnit) : SettingsEvent()
    data class UpdateDefaultRest(val seconds: Int) : SettingsEvent()
    data class UpdateNotifications(val reminder: Boolean, val vibration: Boolean, val sound: Boolean) : SettingsEvent()
    data class ExportData(val format: ExportFormat, val dateRange: DateRange?) : SettingsEvent()
    data class ImportData(val filePath: String) : SettingsEvent()
    data object ClearAllData : SettingsEvent()
    data object CompleteOnboarding : SettingsEvent()
}

class SettingsViewModel(
    private val settingsRepository: SettingsRepository,
    coroutineScope: CoroutineScope? = null,
) : BaseViewModel<SettingsUiState>(SettingsUiState.initial()) {

    private val scope = coroutineScope ?: CoroutineScope(SupervisorJob() + Dispatchers.Default)

    init {
        loadSettings()
    }

    fun onEvent(event: SettingsEvent) {
        when (event) {
            is SettingsEvent.UpdateWeightUnit -> updateWeightUnit(event.unit)
            is SettingsEvent.UpdateDefaultRest -> updateDefaultRest(event.seconds)
            is SettingsEvent.UpdateNotifications -> updateNotifications(event.reminder, event.vibration, event.sound)
            is SettingsEvent.ExportData -> exportData(event.format, event.dateRange)
            is SettingsEvent.ImportData -> importData(event.filePath)
            is SettingsEvent.ClearAllData -> clearAllData()
            is SettingsEvent.CompleteOnboarding -> completeOnboarding()
        }
    }

    private fun loadSettings() {
        scope.launch {
            settingsRepository.getSettings().collect { settings ->
                setState {
                    copy(
                        settings = settings,
                        isLoaded = true,
                    )
                }
            }
        }
    }

    private fun updateWeightUnit(unit: WeightUnit) {
        setState { copy(error = null) }
        scope.launch {
            settingsRepository.updateWeightUnit(unit)
                .onFailure { error ->
                    setState { copy(error = error.message) }
                }
        }
    }

    private fun updateDefaultRest(seconds: Int) {
        setState { copy(error = null) }
        scope.launch {
            settingsRepository.updateDefaultRest(seconds)
                .onFailure { error ->
                    setState { copy(error = error.message) }
                }
        }
    }

    private fun updateNotifications(reminder: Boolean, vibration: Boolean, sound: Boolean) {
        setState { copy(error = null) }
        scope.launch {
            settingsRepository.updateNotifications(reminder, vibration, sound)
                .onFailure { error ->
                    setState { copy(error = error.message) }
                }
        }
    }

    private fun exportData(format: ExportFormat, dateRange: DateRange?) {
        setState { copy(isExporting = true, error = null) }
        scope.launch {
            settingsRepository.exportData(format, dateRange)
                .onSuccess {
                    setState { copy(isExporting = false) }
                }
                .onFailure { error ->
                    setState { copy(isExporting = false, error = error.message) }
                }
        }
    }

    private fun importData(filePath: String) {
        setState { copy(isImporting = true, error = null) }
        scope.launch {
            settingsRepository.importData(filePath)
                .onSuccess {
                    setState { copy(isImporting = false) }
                }
                .onFailure { error ->
                    setState { copy(isImporting = false, error = error.message) }
                }
        }
    }

    fun importDataFromJson(jsonString: String) {
        setState { copy(isImporting = true, error = null) }
        scope.launch {
            settingsRepository.importDataFromJson(jsonString)
                .onSuccess {
                    setState { copy(isImporting = false) }
                }
                .onFailure { error ->
                    setState { copy(isImporting = false, error = error.message) }
                }
        }
    }

    private fun clearAllData() {
        setState { copy(error = null) }
        scope.launch {
            settingsRepository.clearAllData()
                .onFailure { error ->
                    setState { copy(error = error.message) }
                }
        }
    }

    private fun completeOnboarding() {
        scope.launch {
            settingsRepository.completeOnboarding()
                .onFailure { error ->
                    setState { copy(error = error.message) }
                }
        }
    }
}
