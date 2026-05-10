package com.trainrecorder.domain.model

/**
 * Base class for domain-level errors returned by repository operations.
 * These are returned via Result.failure(...) and never thrown directly.
 * Extends Exception so they can be used as Throwable in Result.failure().
 */
sealed class DomainError(message: String) : Exception(message) {
    /** Attempted to delete an exercise that is referenced by a training plan. */
    data class ExerciseInUseError(val exerciseId: String) :
        DomainError("Exercise $exerciseId is referenced by a training plan and cannot be deleted")

    /** Attempted to operate on an exercise that does not exist. */
    data class ExerciseNotFoundError(val exerciseId: String) :
        DomainError("Exercise $exerciseId not found")

    /** Attempted to create an exercise with a name that already exists. */
    data class DuplicateExerciseNameError(val name: String) :
        DomainError("Exercise with name '$name' already exists")

    /** Settings not initialized yet. */
    data object SettingsNotInitializedError :
        DomainError("User settings have not been initialized")

    /** Data export failed. */
    data class ExportFailedError(val reason: String) :
        DomainError("Export failed: $reason")

    /** Data import encountered ID conflicts. */
    data class ImportConflictError(val details: String) :
        DomainError("Import conflict: $details")
}
