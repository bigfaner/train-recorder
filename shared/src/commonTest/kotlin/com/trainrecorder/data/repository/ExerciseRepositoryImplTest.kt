package com.trainrecorder.data.repository

import com.trainrecorder.TestDatabaseFactory
import com.trainrecorder.createTestDatabase
import com.trainrecorder.db.TrainRecorderDatabase
import com.trainrecorder.domain.model.DomainError
import com.trainrecorder.domain.model.Exercise
import com.trainrecorder.domain.model.ExerciseCategory
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Instant
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class ExerciseRepositoryImplTest {

    private fun createRepository(): Pair<ExerciseRepositoryImpl, TrainRecorderDatabase> {
        val db = createTestDatabase()
        return ExerciseRepositoryImpl(db) to db
    }

    private val testInstant = Instant.parse("2025-01-15T10:30:00Z")

    private fun createTestExercise(
        id: String = "test-ex-1",
        name: String = "Test Exercise",
        category: ExerciseCategory = ExerciseCategory.CORE,
        weightIncrement: Double = 2.5,
        defaultRest: Int = 180,
        isCustom: Boolean = false,
    ) = Exercise(
        id = id,
        displayName = name,
        category = category,
        weightIncrement = weightIncrement,
        defaultRest = defaultRest,
        isCustom = isCustom,
        createdAt = testInstant,
        updatedAt = testInstant,
    )

    // ============================================================
    // CRUD: Create
    // ============================================================

    @Test
    fun testCreateExercise() = runTest {
        val (repo, _) = createRepository()
        val exercise = createTestExercise()

        val result = repo.create(exercise)
        assertTrue(result.isSuccess)
        assertEquals("test-ex-1", result.getOrThrow())

        val exercises = repo.getAll().first()
        assertEquals(1, exercises.size)
        assertEquals("Test Exercise", exercises[0].displayName)
    }

    @Test
    fun testCreateExerciseDuplicateNameFails() = runTest {
        val (repo, _) = createRepository()

        val exercise1 = createTestExercise(id = "ex-1", name = "Squat")
        val exercise2 = createTestExercise(id = "ex-2", name = "Squat")

        assertTrue(repo.create(exercise1).isSuccess)
        val result = repo.create(exercise2)
        assertTrue(result.isFailure)
        val error = result.exceptionOrNull()
        assertNotNull(error)
        assertIs<DomainError.DuplicateExerciseNameError>(error)
    }

    // ============================================================
    // CRUD: Read
    // ============================================================

    @Test
    fun testGetAllExercises() = runTest {
        val (repo, _) = createRepository()
        repo.create(createTestExercise(id = "ex-1", name = "Squat", category = ExerciseCategory.CORE))
        repo.create(createTestExercise(id = "ex-2", name = "Bench Press", category = ExerciseCategory.UPPER_PUSH))

        val exercises = repo.getAll().first()
        assertEquals(2, exercises.size)
    }

    @Test
    fun testGetByCategory() = runTest {
        val (repo, _) = createRepository()
        repo.create(createTestExercise(id = "ex-1", name = "Squat", category = ExerciseCategory.CORE))
        repo.create(createTestExercise(id = "ex-2", name = "Bench Press", category = ExerciseCategory.UPPER_PUSH))
        repo.create(createTestExercise(id = "ex-3", name = "Row", category = ExerciseCategory.UPPER_PULL))

        val coreExercises = repo.getByCategory(ExerciseCategory.CORE).first()
        assertEquals(1, coreExercises.size)
        assertEquals("Squat", coreExercises[0].displayName)

        val upperPush = repo.getByCategory(ExerciseCategory.UPPER_PUSH).first()
        assertEquals(1, upperPush.size)
        assertEquals("Bench Press", upperPush[0].displayName)

        val lower = repo.getByCategory(ExerciseCategory.LOWER).first()
        assertEquals(0, lower.size)
    }

    @Test
    fun testGetById() = runTest {
        val (repo, _) = createRepository()
        repo.create(createTestExercise(id = "ex-1", name = "Squat"))

        val exercise = repo.getById("ex-1").first()
        assertNotNull(exercise)
        assertEquals("Squat", exercise.displayName)
        assertEquals(ExerciseCategory.CORE, exercise.category)
        assertEquals(2.5, exercise.weightIncrement)
    }

    @Test
    fun testGetByIdNotFound() = runTest {
        val (repo, _) = createRepository()

        val exercise = repo.getById("nonexistent").first()
        assertEquals(null, exercise)
    }

    // ============================================================
    // CRUD: Update
    // ============================================================

    @Test
    fun testUpdateExercise() = runTest {
        val (repo, _) = createRepository()
        val exercise = createTestExercise(id = "ex-1", name = "Squat")
        repo.create(exercise)

        val updated = exercise.copy(
            displayName = "Back Squat",
            weightIncrement = 5.0,
            updatedAt = Instant.parse("2025-01-16T10:30:00Z"),
        )
        val result = repo.update(updated)
        assertTrue(result.isSuccess)

        val fetched = repo.getById("ex-1").first()
        assertNotNull(fetched)
        assertEquals("Back Squat", fetched.displayName)
        assertEquals(5.0, fetched.weightIncrement)
    }

    // ============================================================
    // CRUD: Delete
    // ============================================================

    @Test
    fun testDeleteExercise() = runTest {
        val (repo, _) = createRepository()
        repo.create(createTestExercise(id = "ex-1", name = "Squat"))

        val result = repo.delete("ex-1")
        assertTrue(result.isSuccess)

        val exercises = repo.getAll().first()
        assertEquals(0, exercises.size)
    }

    @Test
    fun testDeleteExerciseInUseReturnsError() = runTest {
        val db = createTestDatabase()
        val queries = db.trainRecorderQueries

        // Insert exercise directly
        queries.insertExercise(
            id = "ex-1",
            display_name = "Squat",
            category = "core",
            weight_increment = 5.0,
            default_rest = 180L,
            is_custom = 0L,
            created_at = testInstant.toString(),
            updated_at = testInstant.toString(),
        )

        // Insert training plan and day
        queries.insertSettings(
            id = "s", weight_unit = "kg", default_rest_seconds = 180L,
            training_reminder_enabled = 1L, vibration_enabled = 1L, sound_enabled = 0L,
            onboarding_completed = 0L, updated_at = testInstant.toString(),
        )

        // Use raw SQL via driver for tables without named insert queries
        val driver = TestDatabaseFactory().createDriver()
        // Actually, we can use SqlDriver.execute via the driver obtained from the DB
        // Let's use a workaround: the schema already has the tables, use the driver from TestDatabaseFactory
        val rawDriver = TestDatabaseFactory().createDriver()
        TrainRecorderDatabase.Schema.create(rawDriver)
        val rawDb = TrainRecorderDatabase(rawDriver)
        rawDb.trainRecorderQueries.insertExercise(
            id = "ex-1", display_name = "Squat", category = "core",
            weight_increment = 5.0, default_rest = 180L, is_custom = 0L,
            created_at = testInstant.toString(), updated_at = testInstant.toString(),
        )
        // We need to insert training_day_exercise which references ex-1
        // Insert plan, day, then day_exercise using raw SQL via the driver
        rawDriver.execute(null, "INSERT INTO training_plan(id, display_name, plan_mode, schedule_mode, is_active, created_at, updated_at) VALUES('tp-1','Test','infinite_loop','weekly_fixed',1,'${testInstant}','${testInstant}')", 0)
        rawDriver.execute(null, "INSERT INTO training_day(id, plan_id, display_name, day_type, order_index, created_at, updated_at) VALUES('td-1','tp-1','Day1','push',1,'${testInstant}','${testInstant}')", 0)
        rawDriver.execute(null, "INSERT INTO training_day_exercise(id, training_day_id, exercise_id, order_index, exercise_mode, target_sets, target_reps, rest_seconds, weight_increment, created_at, updated_at) VALUES('tde-1','td-1','ex-1',1,'fixed',3,5,180,2.5,'${testInstant}','${testInstant}')", 0)

        val repo = ExerciseRepositoryImpl(rawDb)
        val result = repo.delete("ex-1")
        assertTrue(result.isFailure)
        val error = result.exceptionOrNull()
        assertNotNull(error)
        assertIs<DomainError.ExerciseInUseError>(error)
    }

    // ============================================================
    // Search
    // ============================================================

    @Test
    fun testSearchExercises() = runTest {
        val (repo, _) = createRepository()
        repo.create(createTestExercise(id = "ex-1", name = "Barbell Squat"))
        repo.create(createTestExercise(id = "ex-2", name = "Front Squat"))
        repo.create(createTestExercise(id = "ex-3", name = "Bench Press"))

        val results = repo.search("Squat").first()
        assertEquals(2, results.size)
        assertTrue(results.all { it.displayName.contains("Squat") })
    }

    @Test
    fun testSearchExercisesNoMatch() = runTest {
        val (repo, _) = createRepository()
        repo.create(createTestExercise(id = "ex-1", name = "Squat"))

        val results = repo.search("NonExistent").first()
        assertEquals(0, results.size)
    }

    @Test
    fun testSearchExercisesChineseNames() = runTest {
        val (repo, _) = createRepository()
        repo.create(createTestExercise(id = "ex-1", name = "深蹲"))

        val results = repo.search("深").first()
        assertEquals(1, results.size)
        assertEquals("深蹲", results[0].displayName)
    }

    // ============================================================
    // Seed Default Exercises
    // ============================================================

    @Test
    fun testSeedDefaultExercises() = runTest {
        val (repo, _) = createRepository()

        val result = repo.seedDefaultExercises()
        assertTrue(result.isSuccess)

        val exercises = repo.getAll().first()
        // 21 default exercises (4 core + 3 upper_push + 4 upper_pull + 4 lower + 3 abs_core + 3 shoulder)
        assertEquals(21, exercises.size)
    }

    @Test
    fun testSeedDefaultExercisesIsIdempotent() = runTest {
        val (repo, _) = createRepository()

        repo.seedDefaultExercises()
        val firstCount = repo.getAll().first().size

        repo.seedDefaultExercises()
        val secondCount = repo.getAll().first().size

        assertEquals(firstCount, secondCount)
    }

    @Test
    fun testSeedDefaultExercisesContainAllCategories() = runTest {
        val (repo, _) = createRepository()
        repo.seedDefaultExercises()

        val exercises = repo.getAll().first()
        val categories = exercises.map { it.category }.distinct()

        assertTrue(categories.contains(ExerciseCategory.CORE))
        assertTrue(categories.contains(ExerciseCategory.UPPER_PUSH))
        assertTrue(categories.contains(ExerciseCategory.UPPER_PULL))
        assertTrue(categories.contains(ExerciseCategory.LOWER))
        assertTrue(categories.contains(ExerciseCategory.ABS_CORE))
        assertTrue(categories.contains(ExerciseCategory.SHOULDER))
    }

    @Test
    fun testSeedDefaultExercisesAreNotCustom() = runTest {
        val (repo, _) = createRepository()
        repo.seedDefaultExercises()

        val exercises = repo.getAll().first()
        assertTrue(exercises.all { !it.isCustom })
    }

    @Test
    fun testSeedDefaultExercisesSpecificValues() = runTest {
        val (repo, _) = createRepository()
        repo.seedDefaultExercises()

        val exercises = repo.getAll().first()
        val squat = exercises.find { it.displayName == "深蹲" }
        assertNotNull(squat)
        assertEquals(ExerciseCategory.CORE, squat.category)
        assertEquals(5.0, squat.weightIncrement)
        assertEquals(180, squat.defaultRest)

        val lateralRaise = exercises.find { it.displayName == "侧平举" }
        assertNotNull(lateralRaise)
        assertEquals(ExerciseCategory.SHOULDER, lateralRaise.category)
        assertEquals(1.0, lateralRaise.weightIncrement)
        assertEquals(60, lateralRaise.defaultRest)
    }

    // ============================================================
    // CRUD: Full roundtrip
    // ============================================================

    @Test
    fun testFullCrudRoundtrip() = runTest {
        val (repo, _) = createRepository()

        // Create
        val exercise = createTestExercise(id = "ex-1", name = "Custom Exercise", isCustom = true)
        repo.create(exercise)

        // Read
        var fetched = repo.getById("ex-1").first()
        assertNotNull(fetched)
        assertEquals("Custom Exercise", fetched.displayName)
        assertTrue(fetched.isCustom)

        // Update
        val updated = exercise.copy(displayName = "Updated Exercise", weightIncrement = 5.0)
        repo.update(updated)
        fetched = repo.getById("ex-1").first()
        assertNotNull(fetched)
        assertEquals("Updated Exercise", fetched.displayName)
        assertEquals(5.0, fetched.weightIncrement)

        // Delete
        repo.delete("ex-1")
        fetched = repo.getById("ex-1").first()
        assertEquals(null, fetched)
    }
}
