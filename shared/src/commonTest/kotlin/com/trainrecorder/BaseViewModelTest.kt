package com.trainrecorder

import kotlin.test.Test
import kotlin.test.assertEquals

class PlatformTest {
    @Test
    fun testPlatformNameIsNotEmpty() {
        val platform = getPlatform()
        assert(platform.name.isNotBlank())
    }
}
