package com.trainrecorder.viewmodel

import com.trainrecorder.domain.model.TrainingPlan
import com.trainrecorder.domain.repository.PlanWithDays
import com.trainrecorder.domain.repository.TrainingDayWithExercises
import com.trainrecorder.domain.repository.TrainingPlanRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class PlanUiState(
    val activePlan: PlanWithDays?,
    val allPlans: List<TrainingPlan>,
    val isLoaded: Boolean,
    val isSaving: Boolean = false,
    val error: String? = null,
) {
    companion object {
        fun initial() = PlanUiState(
            activePlan = null,
            allPlans = emptyList(),
            isLoaded = false,
        )
    }
}

sealed class PlanEvent {
    data class CreatePlan(val plan: TrainingPlan, val days: List<TrainingDayWithExercises>) : PlanEvent()
    data class UpdatePlan(val plan: TrainingPlan, val days: List<TrainingDayWithExercises>) : PlanEvent()
    data class ActivatePlan(val planId: String) : PlanEvent()
    data class DeletePlan(val planId: String) : PlanEvent()
}

class PlanViewModel(
    private val planRepository: TrainingPlanRepository,
    coroutineScope: CoroutineScope? = null,
) : BaseViewModel<PlanUiState>(PlanUiState.initial()) {

    private val scope = coroutineScope ?: CoroutineScope(SupervisorJob() + Dispatchers.Default)

    init {
        loadPlans()
    }

    fun onEvent(event: PlanEvent) {
        when (event) {
            is PlanEvent.CreatePlan -> createPlan(event.plan, event.days)
            is PlanEvent.UpdatePlan -> updatePlan(event.plan, event.days)
            is PlanEvent.ActivatePlan -> activatePlan(event.planId)
            is PlanEvent.DeletePlan -> deletePlan(event.planId)
        }
    }

    private fun loadPlans() {
        setState { copy(isLoaded = false) }
        scope.launch {
            planRepository.getActivePlan()
                .combine(planRepository.getAllPlans()) { activePlan, allPlans ->
                    Pair(activePlan, allPlans)
                }
                .collect { (activePlan, allPlans) ->
                    val activePlanWithDays = if (activePlan != null) {
                        planRepository.getPlanWithDays(activePlan.id)
                    } else {
                        kotlinx.coroutines.flow.flowOf(null)
                    }

                    activePlanWithDays.collect { planWithDays ->
                        setState {
                            copy(
                                activePlan = planWithDays,
                                allPlans = allPlans,
                                isLoaded = true,
                            )
                        }
                    }
                }
        }
    }

    private fun createPlan(plan: TrainingPlan, days: List<TrainingDayWithExercises>) {
        setState { copy(isSaving = true, error = null) }
        scope.launch {
            planRepository.createPlan(plan, days)
                .onSuccess {
                    setState { copy(isSaving = false) }
                }
                .onFailure { error ->
                    setState { copy(isSaving = false, error = error.message) }
                }
        }
    }

    private fun updatePlan(plan: TrainingPlan, days: List<TrainingDayWithExercises>) {
        setState { copy(isSaving = true, error = null) }
        scope.launch {
            planRepository.updatePlan(plan, days)
                .onSuccess {
                    setState { copy(isSaving = false) }
                }
                .onFailure { error ->
                    setState { copy(isSaving = false, error = error.message) }
                }
        }
    }

    private fun activatePlan(planId: String) {
        setState { copy(isSaving = true, error = null) }
        scope.launch {
            planRepository.activatePlan(planId)
                .onSuccess {
                    setState { copy(isSaving = false) }
                }
                .onFailure { error ->
                    setState { copy(isSaving = false, error = error.message) }
                }
        }
    }

    private fun deletePlan(planId: String) {
        setState { copy(isSaving = true, error = null) }
        scope.launch {
            planRepository.deletePlan(planId)
                .onSuccess {
                    setState { copy(isSaving = false) }
                }
                .onFailure { error ->
                    setState { copy(isSaving = false, error = error.message) }
                }
        }
    }
}
