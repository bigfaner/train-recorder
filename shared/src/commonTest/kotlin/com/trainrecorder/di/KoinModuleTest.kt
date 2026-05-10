package com.trainrecorder.di

import kotlin.test.Test
import org.koin.core.context.startKoin
import org.koin.core.context.stopKoin
import org.koin.test.check.checkModules

class KoinModuleTest {
    @Test
    fun verifyKoinModulesLoad() {
        startKoin {
            modules(appModule)
        }.checkModules()

        stopKoin()
    }
}
