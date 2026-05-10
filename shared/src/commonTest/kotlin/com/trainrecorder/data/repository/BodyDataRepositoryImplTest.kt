package com.trainrecorder.data.repository

import com.trainrecorder.createTestDatabase
import com.trainrecorder.db.TrainRecorderDatabase
import com.trainrecorder.domain.model.BodyMeasurement
import com.trainrecorder.domain.model.DomainError
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class BodyDataRepositoryImplTest {

    private fun createRepository(): Pair<BodyDataRepositoryImpl, TrainRecorderDatabase> {
        val db = createTestDatabase()
        return BodyDataRepositoryImpl(db) to db
    }

    private val testInstant = Instant.parse("2025-01-15T10:30:00Z")

    private fun createTestMeasurement(
        id: String = "bm-1",
        recordDate: LocalDate = LocalDate.parse("2025-01-15"),
        bodyWeight: Double? = 75.0,
        chest: Double? = 100.0,
        waist: Double? = 80.0,
        arm: Double? = 35.0,
        thigh: Double? = 55.0,
        notes: String? = null,
    ) = BodyMeasurement(
        id = id,
        recordDate = recordDate,
        bodyWeight = bodyWeight,
        chest = chest,
        waist = waist,
        arm = arm,
        thigh = thigh,
        notes = notes,
        createdAt = testInstant,
        updatedAt = testInstant,
    )

    // ============================================================
    // CRUD: Create
    // ============================================================

    @Test
    fun testCreateBodyMeasurement() = runTest {
        val (repo, _) = createRepository()
        val measurement = createTestMeasurement()

        val result = repo.create(measurement)
        assertTrue(result.isSuccess)
        assertEquals("bm-1", result.getOrThrow())

        val all = repo.getAll().first()
        assertEquals(1, all.size)
        assertEquals(75.0, all[0].bodyWeight)
        assertEquals(LocalDate.parse("2025-01-15"), all[0].recordDate)
    }

    @Test
    fun testCreateBodyMeasurementWithNullFields() = runTest {
        val (repo, _) = createRepository()
        val measurement = createTestMeasurement(bodyWeight = 70.0, chest = null, waist = null, arm = null, thigh = null)

        val result = repo.create(measurement)
        assertTrue(result.isSuccess)

        val all = repo.getAll().first()
        assertEquals(1, all.size)
        assertEquals(70.0, all[0].bodyWeight)
        assertNull(all[0].chest)
    }

    @Test
    fun testCreateBodyMeasurementInvalidWeight() = runTest {
        val (repo, _) = createRepository()
        val measurement = createTestMeasurement(bodyWeight = -5.0)

        val result = repo.create(measurement)
        assertTrue(result.isFailure)
        assertIs<DomainError.ValidationError>(result.exceptionOrNull())
    }

    // ============================================================
    // CRUD: Read
    // ============================================================

    @Test
    fun testGetAll() = runTest {
        val (repo, _) = createRepository()
        repo.create(createTestMeasurement(id = "bm-1", recordDate = LocalDate.parse("2025-01-10")))
        repo.create(createTestMeasurement(id = "bm-2", recordDate = LocalDate.parse("2025-01-15")))

        val all = repo.getAll().first()
        assertEquals(2, all.size)
    }

    @Test
    fun testGetByDateRange() = runTest {
        val (repo, _) = createRepository()
        repo.create(createTestMeasurement(id = "bm-1", recordDate = LocalDate.parse("2025-01-10")))
        repo.create(createTestMeasurement(id = "bm-2", recordDate = LocalDate.parse("2025-01-15")))
        repo.create(createTestMeasurement(id = "bm-3", recordDate = LocalDate.parse("2025-01-20")))

        val results = repo.getByDateRange(
            LocalDate.parse("2025-01-12"),
            LocalDate.parse("2025-01-18"),
        ).first()
        assertEquals(1, results.size)
        assertEquals(LocalDate.parse("2025-01-15"), results[0].recordDate)
    }

    @Test
    fun testGetByDateRangeEmptyResult() = runTest {
        val (repo, _) = createRepository()
        repo.create(createTestMeasurement(id = "bm-1", recordDate = LocalDate.parse("2025-01-10")))

        val results = repo.getByDateRange(
            LocalDate.parse("2025-02-01"),
            LocalDate.parse("2025-02-28"),
        ).first()
        assertEquals(0, results.size)
    }

    @Test
    fun testGetLatest() = runTest {
        val (repo, _) = createRepository()
        repo.create(createTestMeasurement(id = "bm-1", recordDate = LocalDate.parse("2025-01-10")))
        repo.create(createTestMeasurement(id = "bm-2", recordDate = LocalDate.parse("2025-01-20")))

        val latest = repo.getLatest().first()
        assertNotNull(latest)
        assertEquals(LocalDate.parse("2025-01-20"), latest.recordDate)
    }

    @Test
    fun testGetLatestEmpty() = runTest {
        val (repo, _) = createRepository()

        val latest = repo.getLatest().first()
        assertNull(latest)
    }

    // ============================================================
    // CRUD: Update
    // ============================================================

    @Test
    fun testUpdateBodyMeasurement() = runTest {
        val (repo, _) = createRepository()
        val measurement = createTestMeasurement()
        repo.create(measurement)

        val updated = measurement.copy(
            bodyWeight = 76.5,
            notes = "Updated",
            updatedAt = Instant.parse("2025-01-16T10:30:00Z"),
        )
        val result = repo.update(updated)
        assertTrue(result.isSuccess)

        val all = repo.getAll().first()
        assertEquals(1, all.size)
        assertEquals(76.5, all[0].bodyWeight)
        assertEquals("Updated", all[0].notes)
    }

    @Test
    fun testUpdateNotFound() = runTest {
        val (repo, _) = createRepository()
        val measurement = createTestMeasurement()

        val result = repo.update(measurement)
        assertTrue(result.isFailure)
        assertIs<DomainError.BodyMeasurementNotFoundError>(result.exceptionOrNull())
    }

    // ============================================================
    // CRUD: Delete
    // ============================================================

    @Test
    fun testDeleteBodyMeasurement() = runTest {
        val (repo, _) = createRepository()
        repo.create(createTestMeasurement())

        val result = repo.delete("bm-1")
        assertTrue(result.isSuccess)

        val all = repo.getAll().first()
        assertEquals(0, all.size)
    }

    @Test
    fun testDeleteNotFound() = runTest {
        val (repo, _) = createRepository()

        val result = repo.delete("nonexistent")
        assertTrue(result.isFailure)
        assertIs<DomainError.BodyMeasurementNotFoundError>(result.exceptionOrNull())
    }

    // ============================================================
    // Full CRUD roundtrip
    // ============================================================

    @Test
    fun testFullCrudRoundtrip() = runTest {
        val (repo, _) = createRepository()

        // Create
        val measurement = createTestMeasurement()
        repo.create(measurement)
        var fetched = repo.getLatest().first()
        assertNotNull(fetched)
        assertEquals(75.0, fetched.bodyWeight)

        // Update
        val updated = measurement.copy(bodyWeight = 76.0, updatedAt = testInstant)
        repo.update(updated)
        fetched = repo.getLatest().first()
        assertNotNull(fetched)
        assertEquals(76.0, fetched.bodyWeight)

        // Delete
        repo.delete("bm-1")
        fetched = repo.getLatest().first()
        assertNull(fetched)
    }
}
