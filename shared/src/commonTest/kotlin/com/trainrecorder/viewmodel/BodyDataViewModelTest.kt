package com.trainrecorder.viewmodel

import com.trainrecorder.domain.model.BodyMeasurement
import com.trainrecorder.domain.repository.BodyDataRepository
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class BodyDataViewModelTest {

    private fun makeMeasurement(
        id: String = "m1",
        date: LocalDate = LocalDate(2026, 1, 15),
        weight: Double? = 75.0,
    ) = BodyMeasurement(
        id = id,
        recordDate = date,
        bodyWeight = weight,
        chest = null,
        waist = null,
        arm = null,
        thigh = null,
        notes = null,
        createdAt = Clock.System.now(),
        updatedAt = Clock.System.now(),
    )

    private class FakeBodyDataRepository(
        measurements: List<BodyMeasurement> = emptyList(),
        private val createResult: Result<String> = Result.success("new-id"),
        private val updateResult: Result<Unit> = Result.success(Unit),
        private val deleteResult: Result<Unit> = Result.success(Unit),
    ) : BodyDataRepository {
        private val _measurements = MutableStateFlow(measurements)

        override fun getAll(): Flow<List<BodyMeasurement>> = _measurements
        override fun getByDateRange(start: LocalDate, end: LocalDate): Flow<List<BodyMeasurement>> = _measurements
        override fun getLatest(): Flow<BodyMeasurement?> =
            MutableStateFlow(_measurements.value.maxByOrNull { it.recordDate })
        override suspend fun create(record: BodyMeasurement): Result<String> = createResult
        override suspend fun update(record: BodyMeasurement): Result<Unit> = updateResult
        override suspend fun delete(id: String): Result<Unit> = deleteResult
    }

    @Test
    fun `initial state has correct defaults`() {
        val testScope = TestScope()
        val vm = BodyDataViewModel(
            bodyDataRepository = FakeBodyDataRepository(),
            coroutineScope = testScope,
        )

        val state = vm.state.value
        assertNull(state.latestMeasurement)
        assertTrue(state.trendData.isEmpty())
        assertEquals(BodyMetric.WEIGHT, state.selectedMetric)
        assertFalse(state.isLoaded)
        assertFalse(state.isSaving)
        assertNull(state.error)
    }

    @Test
    fun `measurements are loaded on init`() = runTest {
        val m1 = makeMeasurement(id = "m1", date = LocalDate(2026, 1, 10))
        val m2 = makeMeasurement(id = "m2", date = LocalDate(2026, 1, 20))

        val testScope = TestScope()
        val vm = BodyDataViewModel(
            bodyDataRepository = FakeBodyDataRepository(measurements = listOf(m1, m2)),
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertTrue(state.isLoaded)
        assertEquals(2, state.trendData.size)
        assertNotNull(state.latestMeasurement)
        assertEquals("m2", state.latestMeasurement!!.id) // Latest by date
    }

    @Test
    fun `trend data is sorted by date`() = runTest {
        val m1 = makeMeasurement(id = "m1", date = LocalDate(2026, 1, 20))
        val m2 = makeMeasurement(id = "m2", date = LocalDate(2026, 1, 10))
        val m3 = makeMeasurement(id = "m3", date = LocalDate(2026, 1, 15))

        val testScope = TestScope()
        val vm = BodyDataViewModel(
            bodyDataRepository = FakeBodyDataRepository(measurements = listOf(m1, m2, m3)),
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertEquals(3, state.trendData.size)
        assertEquals("m2", state.trendData[0].id) // 2026-01-10
        assertEquals("m3", state.trendData[1].id) // 2026-01-15
        assertEquals("m1", state.trendData[2].id) // 2026-01-20
    }

    @Test
    fun `selectMetric changes the selected metric`() = runTest {
        val testScope = TestScope()
        val vm = BodyDataViewModel(
            bodyDataRepository = FakeBodyDataRepository(),
            coroutineScope = testScope,
        )

        vm.onEvent(BodyDataEvent.SelectMetric(BodyMetric.CHEST))
        assertEquals(BodyMetric.CHEST, vm.state.value.selectedMetric)
    }

    @Test
    fun `saveRecord creates new record`() = runTest {
        val testScope = TestScope()
        val vm = BodyDataViewModel(
            bodyDataRepository = FakeBodyDataRepository(),
            coroutineScope = testScope,
        )

        val record = makeMeasurement(id = "new-m")
        vm.onEvent(BodyDataEvent.SaveRecord(record))
        testScope.advanceUntilIdle()

        assertFalse(vm.state.value.isSaving)
        assertNull(vm.state.value.error)
    }

    @Test
    fun `saveRecord creates with failure`() = runTest {
        val testScope = TestScope()
        val vm = BodyDataViewModel(
            bodyDataRepository = FakeBodyDataRepository(
                createResult = Result.failure(Exception("Validation error")),
            ),
            coroutineScope = testScope,
        )

        val record = makeMeasurement(id = "bad-m")
        vm.onEvent(BodyDataEvent.SaveRecord(record))
        testScope.advanceUntilIdle()

        assertFalse(vm.state.value.isSaving)
        assertEquals("Validation error", vm.state.value.error)
    }

    @Test
    fun `deleteRecord succeeds`() = runTest {
        val testScope = TestScope()
        val vm = BodyDataViewModel(
            bodyDataRepository = FakeBodyDataRepository(deleteResult = Result.success(Unit)),
            coroutineScope = testScope,
        )

        vm.onEvent(BodyDataEvent.DeleteRecord("m1"))
        testScope.advanceUntilIdle()

        assertFalse(vm.state.value.isSaving)
        assertNull(vm.state.value.error)
    }

    @Test
    fun `deleteRecord handles failure`() = runTest {
        val testScope = TestScope()
        val vm = BodyDataViewModel(
            bodyDataRepository = FakeBodyDataRepository(
                deleteResult = Result.failure(Exception("Not found")),
            ),
            coroutineScope = testScope,
        )

        vm.onEvent(BodyDataEvent.DeleteRecord("bad-id"))
        testScope.advanceUntilIdle()

        assertFalse(vm.state.value.isSaving)
        assertEquals("Not found", vm.state.value.error)
    }

    @Test
    fun `all body metrics are available`() {
        val metrics = BodyMetric.entries
        assertEquals(5, metrics.size)
        assertTrue(metrics.contains(BodyMetric.WEIGHT))
        assertTrue(metrics.contains(BodyMetric.CHEST))
        assertTrue(metrics.contains(BodyMetric.WAIST))
        assertTrue(metrics.contains(BodyMetric.ARM))
        assertTrue(metrics.contains(BodyMetric.THIGH))
    }
}
