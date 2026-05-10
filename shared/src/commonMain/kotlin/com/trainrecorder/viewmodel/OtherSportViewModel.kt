package com.trainrecorder.viewmodel

import com.trainrecorder.domain.model.MetricInputType
import com.trainrecorder.domain.model.OtherSportMetric
import com.trainrecorder.domain.model.OtherSportMetricValue
import com.trainrecorder.domain.model.OtherSportRecord
import com.trainrecorder.domain.model.OtherSportType
import com.trainrecorder.domain.repository.OtherSportRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDate

data class OtherSportUiState(
    val sportTypes: List<OtherSportType>,
    val selectedType: OtherSportType?,
    val metrics: List<OtherSportMetric>,
    val metricValues: Map<String, String>,
    val date: LocalDate,
    val notes: String,
    val isSaving: Boolean,
    val isLoaded: Boolean = false,
    val error: String? = null,
) {
    companion object {
        fun initial(today: LocalDate) = OtherSportUiState(
            sportTypes = emptyList(),
            selectedType = null,
            metrics = emptyList(),
            metricValues = emptyMap(),
            date = today,
            notes = "",
            isSaving = false,
        )
    }
}

sealed class OtherSportEvent {
    data class SelectSportType(val typeId: String) : OtherSportEvent()
    data class SetMetricValue(val metricId: String, val value: String) : OtherSportEvent()
    data class SetNotes(val notes: String) : OtherSportEvent()
    data class Save(val date: LocalDate) : OtherSportEvent()
    data class CreateCustomType(val name: String, val metrics: List<OtherSportMetric>) : OtherSportEvent()
}

class OtherSportViewModel(
    private val otherSportRepository: OtherSportRepository,
    today: LocalDate = Clock.System.now().toEpochMilliseconds().let {
        LocalDate(2026, 1, 1) // Default fallback
    },
    coroutineScope: CoroutineScope? = null,
) : BaseViewModel<OtherSportUiState>(OtherSportUiState.initial(today)) {

    private val scope = coroutineScope ?: CoroutineScope(SupervisorJob() + Dispatchers.Default)

    init {
        loadSportTypes()
    }

    fun onEvent(event: OtherSportEvent) {
        when (event) {
            is OtherSportEvent.SelectSportType -> selectSportType(event.typeId)
            is OtherSportEvent.SetMetricValue -> setMetricValue(event.metricId, event.value)
            is OtherSportEvent.SetNotes -> setNotes(event.notes)
            is OtherSportEvent.Save -> saveRecord(event.date)
            is OtherSportEvent.CreateCustomType -> createCustomType(event.name, event.metrics)
        }
    }

    private fun loadSportTypes() {
        scope.launch {
            otherSportRepository.getSportTypes().collect { types ->
                setState {
                    copy(
                        sportTypes = types,
                        isLoaded = true,
                    )
                }
            }
        }
    }

    private fun selectSportType(typeId: String) {
        val selected = state.value.sportTypes.find { it.id == typeId }
        setState {
            copy(
                selectedType = selected,
                metrics = emptyList(), // Metrics would be loaded from repository
                metricValues = emptyMap(),
            )
        }
    }

    private fun setMetricValue(metricId: String, value: String) {
        setState {
            copy(metricValues = metricValues + (metricId to value))
        }
    }

    private fun setNotes(notes: String) {
        setState { copy(notes = notes) }
    }

    private fun saveRecord(date: LocalDate) {
        val current = state.value
        if (current.selectedType == null) {
            setState { copy(error = "Please select a sport type") }
            return
        }

        setState { copy(isSaving = true, error = null, date = date) }
        scope.launch {
            val record = OtherSportRecord(
                id = "",
                sportTypeId = current.selectedType!!.id,
                recordDate = date,
                notes = current.notes.ifBlank { null },
                createdAt = Clock.System.now(),
                updatedAt = Clock.System.now(),
            )

            val metricValuesList = current.metricValues.map { (metricId, value) ->
                OtherSportMetricValue(
                    id = "",
                    sportRecordId = "",
                    metricId = metricId,
                    metricValue = value,
                    createdAt = Clock.System.now(),
                    updatedAt = Clock.System.now(),
                )
            }

            otherSportRepository.createRecord(record, metricValuesList)
                .onSuccess {
                    setState { copy(isSaving = false) }
                }
                .onFailure { error ->
                    setState { copy(isSaving = false, error = error.message) }
                }
        }
    }

    private fun createCustomType(name: String, metrics: List<OtherSportMetric>) {
        setState { copy(isSaving = true, error = null) }
        scope.launch {
            val now = Clock.System.now()
            val type = OtherSportType(
                id = "",
                displayName = name,
                isCustom = true,
                createdAt = now,
                updatedAt = now,
            )

            otherSportRepository.createSportType(type, metrics)
                .onSuccess {
                    setState { copy(isSaving = false) }
                }
                .onFailure { error ->
                    setState { copy(isSaving = false, error = error.message) }
                }
        }
    }
}
