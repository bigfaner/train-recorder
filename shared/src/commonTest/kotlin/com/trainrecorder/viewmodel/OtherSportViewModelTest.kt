package com.trainrecorder.viewmodel

import com.trainrecorder.domain.model.MetricInputType
import com.trainrecorder.domain.model.OtherSportMetric
import com.trainrecorder.domain.model.OtherSportMetricValue
import com.trainrecorder.domain.model.OtherSportRecord
import com.trainrecorder.domain.model.OtherSportType
import com.trainrecorder.domain.repository.OtherSportRepository
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
class OtherSportViewModelTest {

    private fun makeSportType(
        id: String = "type1",
        name: String = "Running",
        isCustom: Boolean = false,
    ) = OtherSportType(
        id = id,
        displayName = name,
        isCustom = isCustom,
        createdAt = Clock.System.now(),
        updatedAt = Clock.System.now(),
    )

    private class FakeOtherSportRepository(
        sportTypes: List<OtherSportType> = emptyList(),
        private val createTypeResult: Result<String> = Result.success("new-type"),
        private val createRecordResult: Result<String> = Result.success("new-record"),
        private val deleteRecordResult: Result<Unit> = Result.success(Unit),
    ) : OtherSportRepository {
        private val _sportTypes = MutableStateFlow(sportTypes)

        override fun getSportTypes(): Flow<List<OtherSportType>> = _sportTypes
        override suspend fun createSportType(type: OtherSportType, metrics: List<OtherSportMetric>): Result<String> = createTypeResult
        override fun getRecordsByDateRange(start: LocalDate, end: LocalDate): Flow<List<OtherSportRecord>> = MutableStateFlow(emptyList())
        override suspend fun createRecord(record: OtherSportRecord, metricValues: List<OtherSportMetricValue>): Result<String> = createRecordResult
        override suspend fun deleteRecord(id: String): Result<Unit> = deleteRecordResult
    }

    @Test
    fun `initial state has correct defaults`() {
        val today = LocalDate(2026, 1, 15)
        val testScope = TestScope()
        val vm = OtherSportViewModel(
            otherSportRepository = FakeOtherSportRepository(),
            today = today,
            coroutineScope = testScope,
        )

        val state = vm.state.value
        assertTrue(state.sportTypes.isEmpty())
        assertNull(state.selectedType)
        assertTrue(state.metrics.isEmpty())
        assertTrue(state.metricValues.isEmpty())
        assertEquals(today, state.date)
        assertEquals("", state.notes)
        assertFalse(state.isSaving)
        assertFalse(state.isLoaded)
        assertNull(state.error)
    }

    @Test
    fun `sport types are loaded on init`() = runTest {
        val types = listOf(
            makeSportType(id = "t1", name = "Running"),
            makeSportType(id = "t2", name = "Swimming"),
        )

        val testScope = TestScope()
        val vm = OtherSportViewModel(
            otherSportRepository = FakeOtherSportRepository(sportTypes = types),
            today = LocalDate(2026, 1, 15),
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()

        val state = vm.state.value
        assertTrue(state.isLoaded)
        assertEquals(2, state.sportTypes.size)
    }

    @Test
    fun `selectSportType updates selected type`() = runTest {
        val type = makeSportType(id = "t1", name = "Running")
        val testScope = TestScope()
        val vm = OtherSportViewModel(
            otherSportRepository = FakeOtherSportRepository(sportTypes = listOf(type)),
            today = LocalDate(2026, 1, 15),
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()
        vm.onEvent(OtherSportEvent.SelectSportType("t1"))

        val state = vm.state.value
        assertNotNull(state.selectedType)
        assertEquals("t1", state.selectedType!!.id)
    }

    @Test
    fun `setMetricValue updates metric values map`() = runTest {
        val testScope = TestScope()
        val vm = OtherSportViewModel(
            otherSportRepository = FakeOtherSportRepository(),
            today = LocalDate(2026, 1, 15),
            coroutineScope = testScope,
        )

        vm.onEvent(OtherSportEvent.SetMetricValue("metric1", "5.0"))
        vm.onEvent(OtherSportEvent.SetMetricValue("metric2", "30"))

        val state = vm.state.value
        assertEquals("5.0", state.metricValues["metric1"])
        assertEquals("30", state.metricValues["metric2"])
    }

    @Test
    fun `setNotes updates notes`() = runTest {
        val testScope = TestScope()
        val vm = OtherSportViewModel(
            otherSportRepository = FakeOtherSportRepository(),
            today = LocalDate(2026, 1, 15),
            coroutineScope = testScope,
        )

        vm.onEvent(OtherSportEvent.SetNotes("Morning run"))
        assertEquals("Morning run", vm.state.value.notes)
    }

    @Test
    fun `save fails when no type selected`() = runTest {
        val testScope = TestScope()
        val vm = OtherSportViewModel(
            otherSportRepository = FakeOtherSportRepository(),
            today = LocalDate(2026, 1, 15),
            coroutineScope = testScope,
        )

        vm.onEvent(OtherSportEvent.Save(LocalDate(2026, 1, 15)))

        assertEquals("Please select a sport type", vm.state.value.error)
    }

    @Test
    fun `save succeeds when type is selected`() = runTest {
        val type = makeSportType(id = "t1", name = "Running")
        val testScope = TestScope()
        val vm = OtherSportViewModel(
            otherSportRepository = FakeOtherSportRepository(sportTypes = listOf(type)),
            today = LocalDate(2026, 1, 15),
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()
        vm.onEvent(OtherSportEvent.SelectSportType("t1"))
        vm.onEvent(OtherSportEvent.Save(LocalDate(2026, 1, 15)))
        testScope.advanceUntilIdle()

        assertFalse(vm.state.value.isSaving)
        assertNull(vm.state.value.error)
    }

    @Test
    fun `save handles failure`() = runTest {
        val type = makeSportType(id = "t1", name = "Running")
        val testScope = TestScope()
        val vm = OtherSportViewModel(
            otherSportRepository = FakeOtherSportRepository(
                sportTypes = listOf(type),
                createRecordResult = Result.failure(Exception("Validation error")),
            ),
            today = LocalDate(2026, 1, 15),
            coroutineScope = testScope,
        )

        testScope.advanceUntilIdle()
        vm.onEvent(OtherSportEvent.SelectSportType("t1"))
        vm.onEvent(OtherSportEvent.Save(LocalDate(2026, 1, 15)))
        testScope.advanceUntilIdle()

        assertFalse(vm.state.value.isSaving)
        assertEquals("Validation error", vm.state.value.error)
    }

    @Test
    fun `createCustomType succeeds`() = runTest {
        val testScope = TestScope()
        val vm = OtherSportViewModel(
            otherSportRepository = FakeOtherSportRepository(),
            today = LocalDate(2026, 1, 15),
            coroutineScope = testScope,
        )

        val metrics = listOf(
            OtherSportMetric(
                id = "m1",
                sportTypeId = "",
                metricName = "Distance",
                metricKey = "distance",
                inputType = MetricInputType.NUMBER,
                isRequired = true,
                unit = "km",
                createdAt = Clock.System.now(),
                updatedAt = Clock.System.now(),
            ),
        )

        vm.onEvent(OtherSportEvent.CreateCustomType("Cycling", metrics))
        testScope.advanceUntilIdle()

        assertFalse(vm.state.value.isSaving)
        assertNull(vm.state.value.error)
    }

    @Test
    fun `createCustomType handles failure`() = runTest {
        val testScope = TestScope()
        val vm = OtherSportViewModel(
            otherSportRepository = FakeOtherSportRepository(
                createTypeResult = Result.failure(Exception("Duplicate name")),
            ),
            today = LocalDate(2026, 1, 15),
            coroutineScope = testScope,
        )

        vm.onEvent(OtherSportEvent.CreateCustomType("Running", emptyList()))
        testScope.advanceUntilIdle()

        assertFalse(vm.state.value.isSaving)
        assertEquals("Duplicate name", vm.state.value.error)
    }
}
