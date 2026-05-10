package com.trainrecorder.ui.navigation

import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.path
import androidx.compose.ui.unit.dp

/**
 * Custom icons for the Train Recorder tab bar and navigation.
 * Created as simple vector paths since material-icons-extended is not included
 * in Compose Multiplatform by default.
 */
object TrainRecorderIcons {

    /**
     * Simple calendar icon: rectangle with top bar and grid dots.
     */
    val Calendar: ImageVector by lazy {
        ImageVector.Builder(
            name = "Calendar",
            defaultWidth = 24.dp,
            defaultHeight = 24.dp,
            viewportWidth = 24f,
            viewportHeight = 24f,
        ).apply {
            path(
                fill = null,
            ) {
                // Outline rect
                moveTo(3f, 5f)
                lineTo(21f, 5f)
                lineTo(21f, 21f)
                lineTo(3f, 21f)
                close()
                // Top bar
                moveTo(3f, 9f)
                lineTo(21f, 9f)
                // Hangers
                moveTo(8f, 2f)
                lineTo(8f, 6f)
                moveTo(16f, 2f)
                lineTo(16f, 6f)
                // Grid dots - row 1
                moveTo(7.5f, 13f)
                lineTo(7.5f, 13.01f)
                moveTo(12f, 13f)
                lineTo(12f, 13.01f)
                moveTo(16.5f, 13f)
                lineTo(16.5f, 13.01f)
                // Grid dots - row 2
                moveTo(7.5f, 17f)
                lineTo(7.5f, 17.01f)
                moveTo(12f, 17f)
                lineTo(12f, 17.01f)
                moveTo(16.5f, 17f)
                lineTo(16.5f, 17.01f)
            }
        }.build()
    }

    /**
     * Clipboard list icon: clipboard with lines representing a list.
     */
    val ClipboardList: ImageVector by lazy {
        ImageVector.Builder(
            name = "ClipboardList",
            defaultWidth = 24.dp,
            defaultHeight = 24.dp,
            viewportWidth = 24f,
            viewportHeight = 24f,
        ).apply {
            path(
                fill = null,
            ) {
                // Clipboard body
                moveTo(8f, 3f)
                lineTo(16f, 3f)
                lineTo(16f, 5f)
                lineTo(8f, 5f)
                close()
                moveTo(5f, 4f)
                lineTo(19f, 4f)
                lineTo(19f, 21f)
                lineTo(5f, 21f)
                close()
                // List lines
                moveTo(9f, 10f)
                lineTo(16f, 10f)
                moveTo(9f, 14f)
                lineTo(16f, 14f)
                moveTo(9f, 18f)
                lineTo(16f, 18f)
                // Bullets
                moveTo(7f, 10f)
                lineTo(7.01f, 10f)
                moveTo(7f, 14f)
                lineTo(7.01f, 14f)
                moveTo(7f, 18f)
                lineTo(7.01f, 18f)
            }
        }.build()
    }

    /**
     * Chart bar icon: three vertical bars of different heights.
     */
    val ChartBar: ImageVector by lazy {
        ImageVector.Builder(
            name = "ChartBar",
            defaultWidth = 24.dp,
            defaultHeight = 24.dp,
            viewportWidth = 24f,
            viewportHeight = 24f,
        ).apply {
            path(
                fill = null,
            ) {
                // Baseline
                moveTo(3f, 20f)
                lineTo(21f, 20f)
                // Bars
                moveTo(6f, 12f)
                lineTo(6f, 20f)
                moveTo(10f, 8f)
                lineTo(10f, 20f)
                moveTo(14f, 14f)
                lineTo(14f, 20f)
                moveTo(18f, 6f)
                lineTo(18f, 20f)
            }
        }.build()
    }

    /**
     * Human figure standing: simplified person silhouette.
     */
    val FigureStand: ImageVector by lazy {
        ImageVector.Builder(
            name = "FigureStand",
            defaultWidth = 24.dp,
            defaultHeight = 24.dp,
            viewportWidth = 24f,
            viewportHeight = 24f,
        ).apply {
            path(
                fill = null,
            ) {
                // Head (circle)
                moveTo(12f, 4f)
                arcTo(2f, 2f, 0f, isMoreThanHalf = true, isPositiveArc = true, 2f, 0f)
                arcTo(2f, 2f, 0f, isMoreThanHalf = true, isPositiveArc = true, -2f, 0f)
                close()
                // Body
                moveTo(12f, 8f)
                lineTo(12f, 16f)
                // Arms
                moveTo(8f, 12f)
                lineTo(16f, 12f)
                // Legs
                moveTo(12f, 16f)
                lineTo(8f, 22f)
                moveTo(12f, 16f)
                lineTo(16f, 22f)
            }
        }.build()
    }

    /**
     * Gear/settings icon: simplified gear shape.
     */
    val Gear: ImageVector by lazy {
        ImageVector.Builder(
            name = "Gear",
            defaultWidth = 24.dp,
            defaultHeight = 24.dp,
            viewportWidth = 24f,
            viewportHeight = 24f,
        ).apply {
            path(
                fill = null,
            ) {
                // Outer gear teeth - simplified as circle with notches
                moveTo(12f, 15f)
                arcTo(3f, 3f, 0f, isMoreThanHalf = true, isPositiveArc = true, 3f, 0f)
                arcTo(3f, 3f, 0f, isMoreThanHalf = true, isPositiveArc = true, -3f, 0f)
                close()
                // Gear teeth at 4 cardinal points
                moveTo(12f, 1f)
                lineTo(12f, 5f)
                moveTo(12f, 19f)
                lineTo(12f, 23f)
                moveTo(1f, 12f)
                lineTo(5f, 12f)
                moveTo(19f, 12f)
                lineTo(23f, 12f)
                // Diagonal teeth
                moveTo(4.2f, 4.2f)
                lineTo(7.05f, 7.05f)
                moveTo(16.95f, 16.95f)
                lineTo(19.8f, 19.8f)
                moveTo(19.8f, 4.2f)
                lineTo(16.95f, 7.05f)
                moveTo(7.05f, 16.95f)
                lineTo(4.2f, 19.8f)
            }
        }.build()
    }
}
