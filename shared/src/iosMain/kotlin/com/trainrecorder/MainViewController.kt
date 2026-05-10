package com.trainrecorder

import androidx.compose.ui.window.ComposeUIViewController
import com.trainrecorder.di.appModule
import com.trainrecorder.ui.App
import org.koin.core.context.startKoin
import platform.UIKit.UIViewController

fun MainViewController(): UIViewController {
    startKoin {
        modules(appModule)
    }

    return ComposeUIViewController {
        App()
    }
}
