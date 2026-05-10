package com.trainrecorder.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import app.cash.sqldelight.driver.android.AndroidSqliteDriver
import com.trainrecorder.db.TrainRecorderDatabase
import com.trainrecorder.di.appModule
import com.trainrecorder.ui.App
import org.koin.android.ext.koin.androidContext
import org.koin.core.context.startKoin
import org.koin.dsl.module

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        startKoin {
            androidContext(this@MainActivity)
            modules(
                module {
                    single<TrainRecorderDatabase> {
                        val driver = AndroidSqliteDriver(
                            schema = TrainRecorderDatabase.Schema,
                            context = this@MainActivity,
                            name = "trainrecorder.db",
                        )
                        TrainRecorderDatabase(driver)
                    }
                },
                appModule,
            )
        }

        setContent {
            App()
        }
    }
}
