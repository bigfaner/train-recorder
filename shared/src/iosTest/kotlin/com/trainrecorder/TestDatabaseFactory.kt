package com.trainrecorder

import app.cash.sqldelight.db.SqlDriver
import app.cash.sqldelight.driver.native.NativeSqliteDriver

actual class TestDatabaseFactory {
    actual fun createDriver(): SqlDriver {
        return NativeSqliteDriver(TrainRecorderDatabase.Schema, "test.db")
    }
}
