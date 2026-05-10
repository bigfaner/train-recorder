package com.trainrecorder.domain.model

/**
 * Workout session status.
 */
enum class WorkoutStatus(val value: String) {
    IN_PROGRESS("in_progress"),
    COMPLETED("completed"),
    COMPLETED_PARTIAL("completed_partial");

    companion object {
        fun fromValue(value: String): WorkoutStatus =
            entries.firstOrNull { it.value == value }
                ?: throw IllegalArgumentException("Unknown WorkoutStatus: $value")
    }
}

/**
 * Exercise status within a workout.
 */
enum class ExerciseStatus(val value: String) {
    PENDING("pending"),
    IN_PROGRESS("in_progress"),
    COMPLETED("completed"),
    SKIPPED("skipped");

    companion object {
        fun fromValue(value: String): ExerciseStatus =
            entries.firstOrNull { it.value == value }
                ?: throw IllegalArgumentException("Unknown ExerciseStatus: $value")
    }
}

/**
 * Training type for workout sessions and training days.
 */
enum class TrainingType(val value: String) {
    PUSH("push"),
    PULL("pull"),
    LEGS("legs"),
    OTHER("other"),
    CUSTOM("custom");

    companion object {
        fun fromValue(value: String): TrainingType =
            entries.firstOrNull { it.value == value }
                ?: throw IllegalArgumentException("Unknown TrainingType: $value")
    }
}

/**
 * Weight unit preference.
 */
enum class WeightUnit(val value: String) {
    KG("kg"),
    LB("lb");

    companion object {
        fun fromValue(value: String): WeightUnit =
            entries.firstOrNull { it.value == value }
                ?: throw IllegalArgumentException("Unknown WeightUnit: $value")
    }
}

/**
 * Exercise category classification.
 */
enum class ExerciseCategory(val value: String) {
    CORE("core"),
    UPPER_PUSH("upper_push"),
    UPPER_PULL("upper_pull"),
    LOWER("lower"),
    ABS_CORE("abs_core"),
    SHOULDER("shoulder"),
    CUSTOM("custom");

    companion object {
        fun fromValue(value: String): ExerciseCategory =
            entries.firstOrNull { it.value == value }
                ?: throw IllegalArgumentException("Unknown ExerciseCategory: $value")
    }
}

/**
 * Plan schedule mode.
 */
enum class ScheduleDayType(val value: String) {
    WEEKLY_FIXED("weekly_fixed"),
    FIXED_INTERVAL("fixed_interval");

    companion object {
        fun fromValue(value: String): ScheduleDayType =
            entries.firstOrNull { it.value == value }
                ?: throw IllegalArgumentException("Unknown ScheduleDayType: $value")
    }
}

/**
 * Weight suggestion hint based on recent performance.
 */
enum class SuggestionHint(val value: String) {
    NONE("none"),
    GOOD_STATE("good_state"),
    REDUCE_10PC("reduce_10pc"),
    FIRST_TIME("first_time");

    companion object {
        fun fromValue(value: String): SuggestionHint =
            entries.firstOrNull { it.value == value }
                ?: throw IllegalArgumentException("Unknown SuggestionHint: $value")
    }
}

/**
 * Exercise mode for sets configuration.
 */
enum class ExerciseMode(val value: String) {
    FIXED("fixed"),
    CUSTOM("custom");

    companion object {
        fun fromValue(value: String): ExerciseMode =
            entries.firstOrNull { it.value == value }
                ?: throw IllegalArgumentException("Unknown ExerciseMode: $value")
    }
}

/**
 * Plan mode for training plans.
 */
enum class PlanMode(val value: String) {
    INFINITE_LOOP("infinite_loop"),
    FIXED_CYCLE("fixed_cycle");

    companion object {
        fun fromValue(value: String): PlanMode =
            entries.firstOrNull { it.value == value }
                ?: throw IllegalArgumentException("Unknown PlanMode: $value")
    }
}

/**
 * Input type for other sport metrics.
 */
enum class MetricInputType(val value: String) {
    NUMBER("number"),
    TEXT("text");

    companion object {
        fun fromValue(value: String): MetricInputType =
            entries.firstOrNull { it.value == value }
                ?: throw IllegalArgumentException("Unknown MetricInputType: $value")
    }
}
