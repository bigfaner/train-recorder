package com.trainrecorder.di

import com.trainrecorder.data.repository.BodyDataRepositoryImpl
import com.trainrecorder.data.repository.ExerciseRepositoryImpl
import com.trainrecorder.data.repository.FeelingRepositoryImpl
import com.trainrecorder.data.repository.OtherSportRepositoryImpl
import com.trainrecorder.data.repository.PersonalRecordRepositoryImpl
import com.trainrecorder.data.repository.SettingsRepositoryImpl
import com.trainrecorder.data.repository.TimerNotificationHelper
import com.trainrecorder.data.repository.TimerServiceImpl
import com.trainrecorder.data.repository.TrainingPlanRepositoryImpl
import com.trainrecorder.data.repository.WeightSuggestionRepositoryImpl
import com.trainrecorder.data.repository.WorkoutRepositoryImpl
import com.trainrecorder.domain.repository.BodyDataRepository
import com.trainrecorder.domain.repository.ExerciseRepository
import com.trainrecorder.domain.repository.FeelingRepository
import com.trainrecorder.domain.repository.OtherSportRepository
import com.trainrecorder.domain.repository.PersonalRecordRepository
import com.trainrecorder.domain.repository.SettingsRepository
import com.trainrecorder.domain.repository.TimerService
import com.trainrecorder.domain.repository.TrainingPlanRepository
import com.trainrecorder.domain.repository.WeightSuggestionRepository
import com.trainrecorder.domain.repository.WorkoutRepository
import com.trainrecorder.domain.usecase.ScheduleCalculator
import kotlinx.serialization.json.Json
import org.koin.core.module.dsl.singleOf
import org.koin.dsl.bind
import org.koin.dsl.module

/**
 * Stub TimerNotificationHelper for initial app setup.
 * Platform-specific implementations (Android ForegroundService, iOS BackgroundTask)
 * should override this binding in their respective modules.
 */
private class StubTimerNotificationHelper : TimerNotificationHelper {
    override fun showCountdownNotification(remainingSeconds: Int, totalDurationSeconds: Int) {
        // No-op stub -- platform module should provide real implementation
    }

    override fun showAlertNotification() {
        // No-op stub
    }

    override fun cancelNotification() {
        // No-op stub
    }

    override fun startBackgroundExecution() {
        // No-op stub
    }

    override fun stopBackgroundExecution() {
        // No-op stub
    }
}

/**
 * Main Koin module registering all shared-layer dependencies.
 *
 * Provides:
 * - [TrainRecorderDatabase] (must be provided by platform module or test module)
 * - All repository implementations
 * - [ScheduleCalculator]
 * - [TimerService] via [TimerServiceImpl]
 * - [TimerNotificationHelper] (stub; platform modules should override)
 */
val appModule = module {
    // Repositories (using explicit construction for classes with default params)
    singleOf(::WorkoutRepositoryImpl) bind WorkoutRepository::class
    singleOf(::TrainingPlanRepositoryImpl) bind TrainingPlanRepository::class
    singleOf(::ExerciseRepositoryImpl) bind ExerciseRepository::class
    single<SettingsRepository> {
        SettingsRepositoryImpl(
            database = get(),
        )
    }
    singleOf(::BodyDataRepositoryImpl) bind BodyDataRepository::class
    singleOf(::FeelingRepositoryImpl) bind FeelingRepository::class
    singleOf(::OtherSportRepositoryImpl) bind OtherSportRepository::class
    singleOf(::PersonalRecordRepositoryImpl) bind PersonalRecordRepository::class
    single<WeightSuggestionRepository> {
        WeightSuggestionRepositoryImpl(
            database = get(),
        )
    }

    // Use cases
    singleOf(::ScheduleCalculator)

    // Timer service with stub notification helper (platform module should override)
    single<TimerNotificationHelper> { StubTimerNotificationHelper() }
    single<TimerService> {
        TimerServiceImpl(
            database = get(),
            notificationHelper = get(),
        )
    }
}

/**
 * Creates a test-specific Koin module with an in-memory database.
 * Used by [KoinModuleTest] and integration tests.
 */
fun testAppModule(database: com.trainrecorder.db.TrainRecorderDatabase) = module {
    single<com.trainrecorder.db.TrainRecorderDatabase> { database }

    // Repositories
    singleOf(::WorkoutRepositoryImpl) bind WorkoutRepository::class
    singleOf(::TrainingPlanRepositoryImpl) bind TrainingPlanRepository::class
    singleOf(::ExerciseRepositoryImpl) bind ExerciseRepository::class
    single<SettingsRepository> {
        SettingsRepositoryImpl(
            database = get(),
        )
    }
    singleOf(::BodyDataRepositoryImpl) bind BodyDataRepository::class
    singleOf(::FeelingRepositoryImpl) bind FeelingRepository::class
    singleOf(::OtherSportRepositoryImpl) bind OtherSportRepository::class
    singleOf(::PersonalRecordRepositoryImpl) bind PersonalRecordRepository::class
    single<WeightSuggestionRepository> {
        WeightSuggestionRepositoryImpl(
            database = get(),
        )
    }

    // Use cases
    singleOf(::ScheduleCalculator)

    // Timer service with stub notification helper
    single<TimerNotificationHelper> { StubTimerNotificationHelper() }
    single<TimerService> {
        TimerServiceImpl(
            database = get(),
            notificationHelper = get(),
        )
    }
}
