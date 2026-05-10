package com.trainrecorder

expect fun getPlatform(): Platform

interface Platform {
    val name: String
}
