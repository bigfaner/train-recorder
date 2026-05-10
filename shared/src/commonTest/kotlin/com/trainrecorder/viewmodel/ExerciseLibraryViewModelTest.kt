package com.trainrecorder.viewmodel

import com.trainrecorder.domain.model.Exercise
import com.trainrecorder.domain.model.ExerciseCategory
import com.trainrecorder.domain.repository.ExerciseRepository
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Clock
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class ExerciseLibraryViewModelTest {

    private fun makeExercise(
        id: String = "ex1",
        name: String = "Bench Press",
        category: ExerciseCategory = ExerciseCategory.UPPER_PUSH,
        isCustom: Boolean = false,
    ) = Exercise(
        id = id,
        displayName = name,
        category = category,
        weightIncrement = 2.5,
        defaultRest = 90,
        isCustom = isCustom,
        createdAt = Clock.System.now(),
        updatedAt = Clock.System.now(),
    )

    private class FakeExerciseRepository(
        exercises: List<Exercise> = emptyList(),
        private val createResult: Result<String> = Result.success("new-ex"),
        private val deleteResult: Result<Unit> = Result.success(Unit),
    ) : ExerciseRepository {
        private val _exercises = MutableStateFlow(exercises)

        override fun getAll(): Flow<List<Exercise>> = _exercises
        override fun getByCategory(category: ExerciseCategory): Flow<List<Exercise>> =
            MutableStateFlow(_exercises.value.filter { it.category == category })
        override fun getById(id: String): Flow<Exercise?> =
            MutableStateFlow(_exercises.value.find { it.id == id })
        override fun search(query: String): Flow<List<Exercise>> =
            MutableStateFlow(_exercises.value.filter { it.displayName.contains(query, ignoreCase = true) })
        override suspend fun create(exercise: Exercise): Result<String> = createResult
        override suspend fun update(exercise: Exercise): Result<Unit> = Result.success(Unit)
        override suspend fun delete(id: String): Result<Unit> = deleteResult
        override suspend fun seedDefaultExercises(): Result<Unit> = Result.success(Unit)
    }

    @Test
    fun `initial state has correct defaults`() {
        val testScope = TestScope()
        val vm = ExerciseLibraryViewModel(
            exerciseRepository = FakeExerciseRepository(),
            coroutineScope = testScope,
        )

        val state = vm.state.value
        assertTrue(state.exercises.isEmpty())
        assertEquals("", state.searchQuery)
        assertNull(state.selectedCategory)
        assertFalse(state.isSelectionMode)
        assertTrue(state.selectedIds.isEmpty())
        assertFalse(state.isLoaded)
        assertFalse(state.isSaving)
        assertNull(state.error)
    }

    @Test
    fun `exercises are loaded on init`() = runTest {
        val exercises = listOf(
            makeExercise(id = "ex1", name = "Bench Press"),
            makeExercise(id = "ex2", name = "Squat", category = ExerciseCategory.LOWER),
        )

        val testScope = TestScope()
        val vm = ExerciseLibraryViewModel(
            exerciseRepository = FakeExerciseRepository(exercises = exercises),
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertTrue(state.isLoaded)
        assertEquals(2, state.exercises.size)
    }

    @Test
    fun `search filters exercises by name`() = runTest {
        val exercises = listOf(
            makeExercise(id = "ex1", name = "Bench Press"),
            makeExercise(id = "ex2", name = "Squat"),
            makeExercise(id = "ex3", name = "Overhead Press"),
        )

        val testScope = TestScope()
        val vm = ExerciseLibraryViewModel(
            exerciseRepository = FakeExerciseRepository(exercises = exercises),
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()
        vm.onEvent(ExerciseLibraryEvent.Search("press"))
        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertEquals(2, state.exercises.size)
        assertTrue(state.exercises.all { it.displayName.contains("press", ignoreCase = true) })
    }

    @Test
    fun `search is case insensitive`() = runTest {
        val exercises = listOf(
            makeExercise(id = "ex1", name = "Bench Press"),
        )

        val testScope = TestScope()
        val vm = ExerciseLibraryViewModel(
            exerciseRepository = FakeExerciseRepository(exercises = exercises),
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()
        vm.onEvent(ExerciseLibraryEvent.Search("BENCH"))
        testScope.advanceUntilIdle()

        assertEquals(1, vm.state.value.exercises.size)
    }

    @Test
    fun `filterCategory filters by category`() = runTest {
        val exercises = listOf(
            makeExercise(id = "ex1", name = "Bench Press", category = ExerciseCategory.UPPER_PUSH),
            makeExercise(id = "ex2", name = "Squat", category = ExerciseCategory.LOWER),
            makeExercise(id = "ex3", name = "Deadlift", category = ExerciseCategory.LOWER),
        )

        val testScope = TestScope()
        val vm = ExerciseLibraryViewModel(
            exerciseRepository = FakeExerciseRepository(exercises = exercises),
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()
        vm.onEvent(ExerciseLibraryEvent.FilterCategory(ExerciseCategory.LOWER))
        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertEquals(2, state.exercises.size)
        assertTrue(state.exercises.all { it.category == ExerciseCategory.LOWER })
    }

    @Test
    fun `filterCategory null shows all exercises`() = runTest {
        val exercises = listOf(
            makeExercise(id = "ex1", category = ExerciseCategory.UPPER_PUSH),
            makeExercise(id = "ex2", category = ExerciseCategory.LOWER),
        )

        val testScope = TestScope()
        val vm = ExerciseLibraryViewModel(
            exerciseRepository = FakeExerciseRepository(exercises = exercises),
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()
        vm.onEvent(ExerciseLibraryEvent.FilterCategory(ExerciseCategory.LOWER))
        testScope.advanceUntilIdle()
        assertEquals(1, vm.state.value.exercises.size)

        vm.onEvent(ExerciseLibraryEvent.FilterCategory(null))
        testScope.advanceUntilIdle()
        assertEquals(2, vm.state.value.exercises.size)
    }

    @Test
    fun `toggleSelection adds and removes exercise IDs`() = runTest {
        val testScope = TestScope()
        val vm = ExerciseLibraryViewModel(
            exerciseRepository = FakeExerciseRepository(),
            coroutineScope = testScope,
        )

        vm.onEvent(ExerciseLibraryEvent.ToggleSelection("ex1"))
        assertTrue(vm.state.value.selectedIds.contains("ex1"))

        vm.onEvent(ExerciseLibraryEvent.ToggleSelection("ex2"))
        assertTrue(vm.state.value.selectedIds.contains("ex1"))
        assertTrue(vm.state.value.selectedIds.contains("ex2"))

        vm.onEvent(ExerciseLibraryEvent.ToggleSelection("ex1"))
        assertFalse(vm.state.value.selectedIds.contains("ex1"))
        assertTrue(vm.state.value.selectedIds.contains("ex2"))
    }

    @Test
    fun `createExercise succeeds`() = runTest {
        val testScope = TestScope()
        val vm = ExerciseLibraryViewModel(
            exerciseRepository = FakeExerciseRepository(),
            coroutineScope = testScope,
        )

        val exercise = makeExercise(id = "new-ex", name = "New Exercise")
        vm.onEvent(ExerciseLibraryEvent.CreateExercise(exercise))
        testScope.advanceUntilIdle()

        assertFalse(vm.state.value.isSaving)
        assertNull(vm.state.value.error)
    }

    @Test
    fun `createExercise handles failure`() = runTest {
        val testScope = TestScope()
        val vm = ExerciseLibraryViewModel(
            exerciseRepository = FakeExerciseRepository(
                createResult = Result.failure(Exception("Duplicate name")),
            ),
            coroutineScope = testScope,
        )

        val exercise = makeExercise()
        vm.onEvent(ExerciseLibraryEvent.CreateExercise(exercise))
        testScope.advanceUntilIdle()

        assertFalse(vm.state.value.isSaving)
        assertEquals("Duplicate name", vm.state.value.error)
    }

    @Test
    fun `deleteExercise succeeds`() = runTest {
        val testScope = TestScope()
        val vm = ExerciseLibraryViewModel(
            exerciseRepository = FakeExerciseRepository(deleteResult = Result.success(Unit)),
            coroutineScope = testScope,
        )

        vm.onEvent(ExerciseLibraryEvent.DeleteExercise("ex1"))
        testScope.advanceUntilIdle()

        assertFalse(vm.state.value.isSaving)
        assertNull(vm.state.value.error)
    }

    @Test
    fun `deleteExercise handles failure`() = runTest {
        val testScope = TestScope()
        val vm = ExerciseLibraryViewModel(
            exerciseRepository = FakeExerciseRepository(
                deleteResult = Result.failure(Exception("Exercise in use")),
            ),
            coroutineScope = testScope,
        )

        vm.onEvent(ExerciseLibraryEvent.DeleteExercise("ex1"))
        testScope.advanceUntilIdle()

        assertFalse(vm.state.value.isSaving)
        assertEquals("Exercise in use", vm.state.value.error)
    }

    @Test
    fun `search and category filter combine`() = runTest {
        val exercises = listOf(
            makeExercise(id = "ex1", name = "Bench Press", category = ExerciseCategory.UPPER_PUSH),
            makeExercise(id = "ex2", name = "Overhead Press", category = ExerciseCategory.SHOULDER),
            makeExercise(id = "ex3", name = "Incline Bench Press", category = ExerciseCategory.UPPER_PUSH),
            makeExercise(id = "ex4", name = "Squat", category = ExerciseCategory.LOWER),
        )

        val testScope = TestScope()
        val vm = ExerciseLibraryViewModel(
            exerciseRepository = FakeExerciseRepository(exercises = exercises),
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()
        vm.onEvent(ExerciseLibraryEvent.FilterCategory(ExerciseCategory.UPPER_PUSH))
        vm.onEvent(ExerciseLibraryEvent.Search("press"))
        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertEquals(2, state.exercises.size)
        assertTrue(state.exercises.all { it.category == ExerciseCategory.UPPER_PUSH })
        assertTrue(state.exercises.all { it.displayName.contains("press", ignoreCase = true) })
    }
}
