package com.trainrecorder.viewmodel

import com.trainrecorder.domain.model.BodyMeasurement
import com.trainrecorder.domain.repository.BodyDataRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock

data class BodyDataUiState(
    val latestMeasurement: BodyMeasurement?,
    val trendData: List<BodyMeasurement>,
    val selectedMetric: BodyMetric,
    val isLoaded: Boolean,
    val isSaving: Boolean = false,
    val error: String? = null,
) {
    companion object {
        fun initial() = BodyDataUiState(
            latestMeasurement = null,
            trendData = emptyList(),
            selectedMetric = BodyMetric.WEIGHT,
            isLoaded = false,
        )
    }
}

enum class BodyMetric { WEIGHT, CHEST, WAIST, ARM, THIGH }

sealed class BodyDataEvent {
    data class SaveRecord(val record: BodyMeasurement) : BodyDataEvent()
    data class DeleteRecord(val id: String) : BodyDataEvent()
    data class SelectMetric(val metric: BodyMetric) : BodyDataEvent()
}

class BodyDataViewModel(
    private val bodyDataRepository: BodyDataRepository,
    coroutineScope: CoroutineScope? = null,
) : BaseViewModel<BodyDataUiState>(BodyDataUiState.initial()) {

    private val scope = coroutineScope ?: CoroutineScope(SupervisorJob() + Dispatchers.Default)

    init {
        loadBodyData()
    }

    fun onEvent(event: BodyDataEvent) {
        when (event) {
            is BodyDataEvent.SaveRecord -> saveRecord(event.record)
            is BodyDataEvent.DeleteRecord -> deleteRecord(event.id)
            is BodyDataEvent.SelectMetric -> selectMetric(event.metric)
        }
    }

    private fun loadBodyData() {
        scope.launch {
            bodyDataRepository.getAll().collect { measurements ->
                setState {
                    copy(
                        latestMeasurement = measurements.maxByOrNull { it.recordDate },
                        trendData = measurements.sortedBy { it.recordDate },
                        isLoaded = true,
                    )
                }
            }
        }
    }

    private fun saveRecord(record: BodyMeasurement) {
        setState { copy(isSaving = true, error = null) }
        scope.launch {
            val existingRecord = state.value.trendData.find { it.id == record.id }
            if (existingRecord != null) {
                bodyDataRepository.update(record)
                    .onSuccess {
                        setState { copy(isSaving = false) }
                    }
                    .onFailure { error ->
                        setState { copy(isSaving = false, error = error.message) }
                    }
            } else {
                bodyDataRepository.create(record)
                    .onSuccess {
                        setState { copy(isSaving = false) }
                    }
                    .onFailure { error ->
                        setState { copy(isSaving = false, error = error.message) }
                    }
            }
        }
    }

    private fun deleteRecord(id: String) {
        setState { copy(isSaving = true, error = null) }
        scope.launch {
            bodyDataRepository.delete(id)
                .onSuccess {
                    setState { copy(isSaving = false) }
                }
                .onFailure { error ->
                    setState { copy(isSaving = false, error = error.message) }
                }
        }
    }

    private fun selectMetric(metric: BodyMetric) {
        setState { copy(selectedMetric = metric) }
    }
}
