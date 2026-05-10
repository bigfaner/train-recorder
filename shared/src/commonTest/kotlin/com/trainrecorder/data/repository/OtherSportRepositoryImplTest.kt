package com.trainrecorder.data.repository

import com.trainrecorder.createTestDatabase
import com.trainrecorder.db.TrainRecorderDatabase
import com.trainrecorder.domain.model.DomainError
import com.trainrecorder.domain.model.MetricInputType
import com.trainrecorder.domain.model.OtherSportMetric
import com.trainrecorder.domain.model.OtherSportMetricValue
import com.trainrecorder.domain.model.OtherSportRecord
import com.trainrecorder.domain.model.OtherSportType
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertTrue

class OtherSportRepositoryImplTest {

    private fun createRepository(): Pair<OtherSportRepositoryImpl, TrainRecorderDatabase> {
        val db = createTestDatabase()
        return OtherSportRepositoryImpl(db) to db
    }

    private val testInstant = Instant.parse("2025-01-15T10:30:00Z")

    private fun createTestSportType(
        id: String = "st-1",
        displayName: String = "Swimming",
        isCustom: Boolean = false,
    ) = OtherSportType(
        id = id,
        displayName = displayName,
        isCustom = isCustom,
        createdAt = testInstant,
        updatedAt = testInstant,
    )

    private fun createTestMetric(
        id: String = "m-1",
        sportTypeId: String = "st-1",
        metricName: String = "Distance",
        metricKey: String = "distance",
        inputType: MetricInputType = MetricInputType.NUMBER,
        isRequired: Boolean = true,
        unit: String? = "m",
    ) = OtherSportMetric(
        id = id,
        sportTypeId = sportTypeId,
        metricName = metricName,
        metricKey = metricKey,
        inputType = inputType,
        isRequired = isRequired,
        unit = unit,
        createdAt = testInstant,
        updatedAt = testInstant,
    )

    private fun createTestRecord(
        id: String = "sr-1",
        sportTypeId: String = "st-1",
        recordDate: LocalDate = LocalDate.parse("2025-01-15"),
        notes: String? = null,
    ) = OtherSportRecord(
        id = id,
        sportTypeId = sportTypeId,
        recordDate = recordDate,
        notes = notes,
        createdAt = testInstant,
        updatedAt = testInstant,
    )

    private fun createTestMetricValue(
        id: String = "mv-1",
        sportRecordId: String = "sr-1",
        metricId: String = "m-1",
        metricValue: String = "1500",
    ) = OtherSportMetricValue(
        id = id,
        sportRecordId = sportRecordId,
        metricId = metricId,
        metricValue = metricValue,
        createdAt = testInstant,
        updatedAt = testInstant,
    )

    // ============================================================
    // Sport Type: Create
    // ============================================================

    @Test
    fun testCreateSportType() = runTest {
        val (repo, _) = createRepository()
        val type = createTestSportType()
        val metrics = listOf(createTestMetric())

        val result = repo.createSportType(type, metrics)
        assertTrue(result.isSuccess)
        assertEquals("st-1", result.getOrThrow())

        val types = repo.getSportTypes().first()
        assertEquals(1, types.size)
        assertEquals("Swimming", types[0].displayName)
    }

    @Test
    fun testCreateSportTypeWithMultipleMetrics() = runTest {
        val (repo, _) = createRepository()
        val type = createTestSportType()
        val metrics = listOf(
            createTestMetric(id = "m-1", metricName = "Distance", metricKey = "distance", unit = "km"),
            createTestMetric(id = "m-2", metricName = "Time", metricKey = "time", unit = "min"),
            createTestMetric(id = "m-3", metricName = "Heart Rate", metricKey = "hr", unit = "bpm"),
        )

        val result = repo.createSportType(type, metrics)
        assertTrue(result.isSuccess)
    }

    @Test
    fun testCreateSportTypeDuplicateNameFails() = runTest {
        val (repo, _) = createRepository()

        val type1 = createTestSportType(id = "st-1", displayName = "Swimming")
        repo.createSportType(type1, listOf(createTestMetric()))

        val type2 = createTestSportType(id = "st-2", displayName = "Swimming")
        val result = repo.createSportType(type2, listOf(createTestMetric(sportTypeId = "st-2")))

        assertTrue(result.isFailure)
        assertIs<DomainError.DuplicateSportTypeNameError>(result.exceptionOrNull())
    }

    @Test
    fun testCreateCustomSportType() = runTest {
        val (repo, _) = createRepository()
        val type = createTestSportType(displayName = "Custom Sport", isCustom = true)
        val metrics = listOf(createTestMetric())

        val result = repo.createSportType(type, metrics)
        assertTrue(result.isSuccess)

        val types = repo.getSportTypes().first()
        assertEquals(1, types.size)
        assertTrue(types[0].isCustom)
    }

    // ============================================================
    // Sport Records: Create
    // ============================================================

    @Test
    fun testCreateRecord() = runTest {
        val (repo, _) = createRepository()
        val type = createTestSportType()
        val metric = createTestMetric()
        repo.createSportType(type, listOf(metric))

        val record = createTestRecord()
        val metricValues = listOf(createTestMetricValue())

        val result = repo.createRecord(record, metricValues)
        assertTrue(result.isSuccess)
        assertEquals("sr-1", result.getOrThrow())
    }

    @Test
    fun testCreateRecordWithMultipleMetricValues() = runTest {
        val (repo, _) = createRepository()
        val type = createTestSportType()
        val metrics = listOf(
            createTestMetric(id = "m-1", metricKey = "distance"),
            createTestMetric(id = "m-2", metricKey = "time"),
        )
        repo.createSportType(type, metrics)

        val record = createTestRecord()
        val metricValues = listOf(
            createTestMetricValue(id = "mv-1", metricId = "m-1", metricValue = "5000"),
            createTestMetricValue(id = "mv-2", metricId = "m-2", metricValue = "30"),
        )

        val result = repo.createRecord(record, metricValues)
        assertTrue(result.isSuccess)
    }

    // ============================================================
    // Sport Records: Date range query
    // ============================================================

    @Test
    fun testGetRecordsByDateRange() = runTest {
        val (repo, _) = createRepository()
        val type = createTestSportType()
        repo.createSportType(type, listOf(createTestMetric()))

        repo.createRecord(createTestRecord(id = "sr-1", recordDate = LocalDate.parse("2025-01-10")), emptyList())
        repo.createRecord(createTestRecord(id = "sr-2", recordDate = LocalDate.parse("2025-01-15")), emptyList())
        repo.createRecord(createTestRecord(id = "sr-3", recordDate = LocalDate.parse("2025-01-20")), emptyList())

        val results = repo.getRecordsByDateRange(
            LocalDate.parse("2025-01-12"),
            LocalDate.parse("2025-01-18"),
        ).first()
        assertEquals(1, results.size)
        assertEquals(LocalDate.parse("2025-01-15"), results[0].recordDate)
    }

    @Test
    fun testGetRecordsByDateRangeEmpty() = runTest {
        val (repo, _) = createRepository()
        val type = createTestSportType()
        repo.createSportType(type, listOf(createTestMetric()))

        repo.createRecord(createTestRecord(recordDate = LocalDate.parse("2025-01-10")), emptyList())

        val results = repo.getRecordsByDateRange(
            LocalDate.parse("2025-02-01"),
            LocalDate.parse("2025-02-28"),
        ).first()
        assertEquals(0, results.size)
    }

    // ============================================================
    // Sport Records: Delete
    // ============================================================

    @Test
    fun testDeleteRecord() = runTest {
        val (repo, _) = createRepository()
        val type = createTestSportType()
        repo.createSportType(type, listOf(createTestMetric()))

        repo.createRecord(createTestRecord(), listOf(createTestMetricValue()))

        val result = repo.deleteRecord("sr-1")
        assertTrue(result.isSuccess)

        val records = repo.getRecordsByDateRange(
            LocalDate.parse("2025-01-01"),
            LocalDate.parse("2025-12-31"),
        ).first()
        assertEquals(0, records.size)
    }

    @Test
    fun testDeleteRecordNotFound() = runTest {
        val (repo, _) = createRepository()

        val result = repo.deleteRecord("nonexistent")
        assertTrue(result.isFailure)
        assertIs<DomainError.OtherSportRecordNotFoundError>(result.exceptionOrNull())
    }
}
