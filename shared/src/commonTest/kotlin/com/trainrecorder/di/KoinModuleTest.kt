package com.trainrecorder.di

import com.trainrecorder.TestDatabaseFactory
import com.trainrecorder.createTestDatabase
import com.trainrecorder.data.repository.TimerNotificationHelper
import com.trainrecorder.db.TrainRecorderDatabase
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
import kotlin.test.AfterTest
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertNotNull
import kotlin.test.assertTrue
import org.koin.core.context.startKoin
import org.koin.core.context.stopKoin
import org.koin.core.parameter.parametersOf
import org.koin.test.KoinTest
import org.koin.test.check.checkModules
import org.koin.test.get

/**
 * Tests that the Koin AppModule correctly registers all dependencies
 * and that repositories can be resolved from the container.
 */
class KoinModuleTest : KoinTest {

    private lateinit var testDatabase: TrainRecorderDatabase

    @BeforeTest
    fun setup() {
        testDatabase = createTestDatabase()
    }

    @AfterTest
    fun teardown() {
        try {
            stopKoin()
        } catch (_: Exception) {
            // Koin may not be started if test failed before startKoin
        }
    }

    @Test
    fun verifyKoinModulesLoad() {
        startKoin {
            modules(
                org.koin.dsl.module {
                    single<TrainRecorderDatabase> { testDatabase }
                },
                appModule,
            )
        }.checkModules()

        stopKoin()
    }

    @Test
    fun allRepositoriesCanBeResolved() {
        startKoin {
            modules(testAppModule(testDatabase))
        }

        // Verify all repository interfaces resolve
        assertNotNull(get<WorkoutRepository>())
        assertNotNull(get<TrainingPlanRepository>())
        assertNotNull(get<ExerciseRepository>())
        assertNotNull(get<SettingsRepository>())
        assertNotNull(get<BodyDataRepository>())
        assertNotNull(get<FeelingRepository>())
        assertNotNull(get<OtherSportRepository>())
        assertNotNull(get<PersonalRecordRepository>())
        assertNotNull(get<WeightSuggestionRepository>())

        stopKoin()
    }

    @Test
    fun scheduleCalculatorCanBeResolved() {
        startKoin {
            modules(testAppModule(testDatabase))
        }

        assertNotNull(get<ScheduleCalculator>())

        stopKoin()
    }

    @Test
    fun timerServiceCanBeResolved() {
        startKoin {
            modules(testAppModule(testDatabase))
        }

        assertNotNull(get<TimerService>())

        stopKoin()
    }

    @Test
    fun timerServiceImplementsTimerServiceImpl() {
        startKoin {
            modules(testAppModule(testDatabase))
        }

        val timerService = get<TimerService>()
        assertTrue(
            timerService::class.simpleName?.contains("TimerServiceImpl") == true,
            "TimerService should be implemented by TimerServiceImpl"
        )

        stopKoin()
    }

    @Test
    fun databaseIsSingletonInModule() {
        startKoin {
            modules(testAppModule(testDatabase))
        }

        val db1 = get<TrainRecorderDatabase>()
        val db2 = get<TrainRecorderDatabase>()
        assertTrue(db1 === db2, "Database should be a singleton")

        stopKoin()
    }
}
