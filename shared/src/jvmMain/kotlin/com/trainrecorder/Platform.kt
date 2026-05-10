package com.trainrecorder

actual fun getPlatform(): Platform = object : Platform {
    override val name: String = "JVM"
}
