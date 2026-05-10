package com.trainrecorder

import app.cash.sqldelight.db.SqlDriver
import app.cash.sqldelight.driver.native.NativeSqliteDriver
import com.trainrecorder.db.TrainRecorderDatabase
import com.trainrecorder.di.appModule
import com.trainrecorder.ui.App
import org.koin.core.context.startKoin
import org.koin.dsl.module
import platform.UIKit.UIViewController
import androidx.compose.ui.window.ComposeUIViewController

fun MainViewController(): UIViewController {
    startKoin {
        modules(
            module {
                single<TrainRecorderDatabase> {
                    val driver: SqlDriver = NativeSqliteDriver(
                        schema = TrainRecorderDatabase.Schema,
                        name = "trainrecorder.db",
                    )
                    TrainRecorderDatabase(driver)
                }
            },
            appModule,
        )
    }

    return ComposeUIViewController {
        App()
    }
}
