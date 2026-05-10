package com.trainrecorder.ui.components

import kotlinx.datetime.LocalDate

/**
 * Data point for a line chart (progress curve).
 */
data class LineChartDataPoint(
    val date: LocalDate,
    val value: Double,
    val isPR: Boolean = false,
)

/**
 * Data point for a bar chart (volume trend).
 */
data class BarChartDataPoint(
    val date: LocalDate,
    val value: Double,
)

/**
 * Data point for a heatmap grid (training frequency).
 * Each cell represents a single day with an intensity level.
 */
data class HeatmapCell(
    val date: LocalDate,
    val intensity: Int, // 0-4 scale: 0=none, 1=light, 2=medium, 3=high, 4=max
)

/**
 * Represents a highlighted data point from touch-to-inspect interaction.
 */
data class InspectedPoint(
    val index: Int,
    val x: Float,
    val y: Float,
    val label: String,
    val value: String,
)
