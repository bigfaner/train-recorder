package com.trainrecorder.viewmodel

import com.trainrecorder.domain.model.Exercise
import com.trainrecorder.domain.model.ExerciseCategory
import com.trainrecorder.domain.repository.ExerciseRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch

data class ExerciseLibraryUiState(
    val exercises: List<Exercise>,
    val searchQuery: String,
    val selectedCategory: ExerciseCategory?,
    val isSelectionMode: Boolean,
    val selectedIds: Set<String>,
    val isLoaded: Boolean,
    val isSaving: Boolean = false,
    val error: String? = null,
) {
    companion object {
        fun initial() = ExerciseLibraryUiState(
            exercises = emptyList(),
            searchQuery = "",
            selectedCategory = null,
            isSelectionMode = false,
            selectedIds = emptySet(),
            isLoaded = false,
        )
    }
}

sealed class ExerciseLibraryEvent {
    data class Search(val query: String) : ExerciseLibraryEvent()
    data class FilterCategory(val category: ExerciseCategory?) : ExerciseLibraryEvent()
    data class ToggleSelection(val exerciseId: String) : ExerciseLibraryEvent()
    data class ConfirmSelection(val selectedIds: Set<String>) : ExerciseLibraryEvent()
    data class CreateExercise(val exercise: Exercise) : ExerciseLibraryEvent()
    data class DeleteExercise(val exerciseId: String) : ExerciseLibraryEvent()
}

class ExerciseLibraryViewModel(
    private val exerciseRepository: ExerciseRepository,
    coroutineScope: CoroutineScope? = null,
) : BaseViewModel<ExerciseLibraryUiState>(ExerciseLibraryUiState.initial()) {

    private val scope = coroutineScope ?: CoroutineScope(SupervisorJob() + Dispatchers.Default)

    private val _searchQuery = MutableStateFlow("")
    private val _selectedCategory = MutableStateFlow<ExerciseCategory?>(null)

    init {
        loadExercises()
    }

    fun onEvent(event: ExerciseLibraryEvent) {
        when (event) {
            is ExerciseLibraryEvent.Search -> search(event.query)
            is ExerciseLibraryEvent.FilterCategory -> filterCategory(event.category)
            is ExerciseLibraryEvent.ToggleSelection -> toggleSelection(event.exerciseId)
            is ExerciseLibraryEvent.ConfirmSelection -> { /* Handled by UI for navigation callback */ }
            is ExerciseLibraryEvent.CreateExercise -> createExercise(event.exercise)
            is ExerciseLibraryEvent.DeleteExercise -> deleteExercise(event.exerciseId)
        }
    }

    private fun loadExercises() {
        scope.launch {
            combine(
                exerciseRepository.getAll(),
                _searchQuery,
                _selectedCategory,
            ) { exercises, query, category ->
                Triple(exercises, query, category)
            }.collect { (exercises, query, category) ->
                val filtered = exercises
                    .filter { exercise ->
                        if (query.isBlank()) true
                        else exercise.displayName.contains(query, ignoreCase = true)
                    }
                    .filter { exercise ->
                        category == null || exercise.category == category
                    }

                setState {
                    copy(
                        exercises = filtered,
                        searchQuery = query,
                        selectedCategory = category,
                        isLoaded = true,
                    )
                }
            }
        }
    }

    private fun search(query: String) {
        _searchQuery.value = query
    }

    private fun filterCategory(category: ExerciseCategory?) {
        _selectedCategory.value = category
    }

    private fun toggleSelection(exerciseId: String) {
        setState {
            val updated = if (exerciseId in selectedIds) {
                selectedIds - exerciseId
            } else {
                selectedIds + exerciseId
            }
            copy(selectedIds = updated)
        }
    }

    private fun createExercise(exercise: Exercise) {
        setState { copy(isSaving = true, error = null) }
        scope.launch {
            exerciseRepository.create(exercise)
                .onSuccess {
                    setState { copy(isSaving = false) }
                }
                .onFailure { error ->
                    setState { copy(isSaving = false, error = error.message) }
                }
        }
    }

    private fun deleteExercise(exerciseId: String) {
        setState { copy(isSaving = true, error = null) }
        scope.launch {
            exerciseRepository.delete(exerciseId)
                .onSuccess {
                    setState { copy(isSaving = false) }
                }
                .onFailure { error ->
                    setState { copy(isSaving = false, error = error.message) }
                }
        }
    }
}
