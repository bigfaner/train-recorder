package com.trainrecorder

import app.cash.sqldelight.db.SqlDriver
import com.trainrecorder.db.TrainRecorderDatabase

/**
 * Platform-specific test SQL driver creation.
 * Each platform provides its own in-memory SQLite driver.
 */
expect class TestDatabaseFactory() {
    fun createDriver(): SqlDriver
}

fun createTestDatabase(): TrainRecorderDatabase {
    val factory = TestDatabaseFactory()
    val driver = factory.createDriver()
    TrainRecorderDatabase.Schema.create(driver)
    return TrainRecorderDatabase(driver)
}
