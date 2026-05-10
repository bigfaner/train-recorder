package com.trainrecorder.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.datetime.LocalDate

private val CHART_PADDING_LEFT = 48f
private val CHART_PADDING_RIGHT = 16f
private val CHART_PADDING_TOP = 24f
private val CHART_PADDING_BOTTOM = 32f

/**
 * A line chart composable that renders progress curves with optional PR markers.
 * Supports touch-to-inspect to view data point details.
 *
 * @param dataPoints The data points to render.
 * @param modifier Modifier for the chart.
 * @param lineColor Color of the progress line.
 * @param prColor Color for PR markers (Success green by default).
 * @param gridColor Color for the grid lines.
 * @param textColor Color for axis labels.
 * @param label A label for the Y-axis (e.g., "Weight (kg)").
 */
@Composable
fun LineChart(
    dataPoints: List<LineChartDataPoint>,
    modifier: Modifier = Modifier,
    lineColor: Color = MaterialTheme.colorScheme.primary,
    prColor: Color = Color(0xFF30D158), // Success green
    gridColor: Color = MaterialTheme.colorScheme.outlineVariant,
    textColor: Color = MaterialTheme.colorScheme.onSurfaceVariant,
    label: String = "",
) {
    var inspectedPoint by remember(dataPoints) { mutableStateOf<InspectedPoint?>(null) }

    Box(
        modifier = modifier,
        contentAlignment = Alignment.TopCenter,
    ) {
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .pointerInput(dataPoints) {
                    detectTapGestures { offset ->
                        inspectedPoint = findNearestPoint(
                            Offset(offset.x, offset.y),
                            dataPoints,
                            Size(size.width.toFloat(), size.height.toFloat()),
                        )
                    }
                }
                .pointerInput(dataPoints) {
                    detectDragGestures { change, _ ->
                        change.consume()
                        inspectedPoint = findNearestPoint(
                            Offset(change.position.x, change.position.y),
                            dataPoints,
                            Size(size.width.toFloat(), size.height.toFloat()),
                        )
                    }
                },
        ) {
            if (dataPoints.size < 2) {
                return@Canvas
            }

            val chartArea = getChartArea(
                Size(size.width.toFloat(), size.height.toFloat()),
            )
            val (minValue, maxValue) = getValueRange(dataPoints)

            drawGrid(chartArea, gridColor, minValue, maxValue, dataPoints.size)

            // Draw the line path
            val points = dataPoints.mapIndexed { index, point ->
                val x = chartArea.left + (index.toFloat() / (dataPoints.size - 1).toFloat()) * chartArea.width
                val y = chartArea.bottom - ((point.value - minValue) / (maxValue - minValue)).toFloat() * chartArea.height
                Offset(x, y)
            }

            val path = Path().apply {
                if (points.isNotEmpty()) {
                    moveTo(points.first().x, points.first().y)
                    for (i in 1 until points.size) {
                        lineTo(points[i].x, points[i].y)
                    }
                }
            }

            drawPath(
                path = path,
                color = lineColor,
                style = Stroke(width = 3f),
            )

            // Draw data points
            points.forEachIndexed { index, offset ->
                val isPR = dataPoints[index].isPR
                val pointColor = if (isPR) prColor else lineColor
                val radius = if (isPR) 8f else 5f

                drawCircle(
                    color = pointColor,
                    radius = radius,
                    center = offset,
                )
                if (isPR) {
                    drawCircle(
                        color = pointColor,
                        radius = 11f,
                        center = offset,
                        style = Stroke(width = 2f),
                    )
                }
            }

            // Draw inspected point highlight
            inspectedPoint?.let { inspected ->
                val pointIndex = inspected.index
                if (pointIndex in points.indices) {
                    val point = points[pointIndex]
                    drawLine(
                        color = textColor.copy(alpha = 0.3f),
                        start = Offset(point.x, chartArea.top),
                        end = Offset(point.x, chartArea.bottom),
                        strokeWidth = 1f,
                        pathEffect = PathEffect.dashPathEffect(floatArrayOf(4f, 4f)),
                    )
                    drawCircle(
                        color = lineColor,
                        radius = 12f,
                        center = point,
                        style = Stroke(width = 2f),
                    )
                }
            }
        }

        // Axis labels overlay
        if (dataPoints.size >= 2) {
            val (minValue, maxValue) = getValueRange(dataPoints)
            val axisLabelColor = textColor

            // Y-axis labels
            Column(
                modifier = Modifier
                    .padding(start = 4.dp, top = CHART_PADDING_TOP.dp)
                    .align(Alignment.CenterStart),
            ) {
                for (i in 0..3) {
                    val fraction = i.toFloat() / 3f
                    val value = maxValue - fraction * (maxValue - minValue)
                    Text(
                        text = formatValue(value),
                        color = axisLabelColor,
                        fontSize = 10.sp,
                        modifier = Modifier.padding(vertical = 8.dp),
                    )
                }
            }

            // X-axis labels
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(
                        start = CHART_PADDING_LEFT.dp,
                        end = CHART_PADDING_RIGHT.dp,
                        top = 2.dp,
                    )
                    .align(Alignment.BottomCenter),
                horizontalArrangement = androidx.compose.foundation.layout.Arrangement.SpaceBetween,
            ) {
                val labelIndices = listOf(0, dataPoints.size / 2, dataPoints.size - 1)
                labelIndices.forEach { index ->
                    Text(
                        text = formatDate(dataPoints[index].date),
                        color = axisLabelColor,
                        fontSize = 10.sp,
                    )
                }
            }
        }

        // Inspection tooltip
        inspectedPoint?.let { inspected ->
            val pointIndex = inspected.index
            if (pointIndex in dataPoints.indices) {
                val dp = dataPoints[pointIndex]
                val prTag = if (dp.isPR) " PR" else ""
                Text(
                    text = "${formatDate(dp.date)}: ${formatValue(dp.value)}$prTag",
                    color = MaterialTheme.colorScheme.onSurface,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(top = 4.dp, start = 8.dp),
                )
            }
        }
    }
}

private fun getChartArea(size: Size): Rect {
    return Rect(
        left = CHART_PADDING_LEFT,
        top = CHART_PADDING_TOP,
        right = size.width - CHART_PADDING_RIGHT,
        bottom = size.height - CHART_PADDING_BOTTOM,
    )
}

private fun getValueRange(dataPoints: List<LineChartDataPoint>): Pair<Double, Double> {
    if (dataPoints.isEmpty()) return Pair(0.0, 100.0)
    val values = dataPoints.map { it.value }
    val minVal = values.min()
    val maxVal = values.max()
    val padding = if (maxVal == minVal) 5.0 else (maxVal - minVal) * 0.1
    return Pair(minVal - padding, maxVal + padding)
}

private fun DrawScope.drawGrid(
    chartArea: Rect,
    gridColor: Color,
    minValue: Double,
    maxValue: Double,
    pointCount: Int,
) {
    // Horizontal grid lines (4 lines)
    for (i in 0..3) {
        val fraction = i.toFloat() / 3f
        val y = chartArea.bottom - fraction * chartArea.height
        drawLine(
            color = gridColor,
            start = Offset(chartArea.left, y),
            end = Offset(chartArea.right, y),
            strokeWidth = 1f,
        )
    }
}

private fun findNearestPoint(
    offset: Offset,
    dataPoints: List<LineChartDataPoint>,
    size: Size,
): InspectedPoint? {
    if (dataPoints.isEmpty()) return null

    val chartArea = getChartArea(size)
    if (offset.x < chartArea.left || offset.x > chartArea.right ||
        offset.y < chartArea.top || offset.y > chartArea.bottom
    ) return null

    val (minValue, maxValue) = getValueRange(dataPoints)
    val range = maxValue - minValue
    if (range == 0.0) return null

    val points = dataPoints.mapIndexed { index, point ->
        val x = chartArea.left + (index.toFloat() / (dataPoints.size - 1).toFloat()) * chartArea.width
        val y = chartArea.bottom - ((point.value - minValue) / range).toFloat() * chartArea.height
        Offset(x, y)
    }

    val nearestIndex = points.indices.minByOrNull { idx ->
        val dx = points[idx].x - offset.x
        val dy = points[idx].y - offset.y
        dx * dx + dy * dy
    } ?: return null

    val dp = dataPoints[nearestIndex]
    val prTag = if (dp.isPR) " PR" else ""
    return InspectedPoint(
        index = nearestIndex,
        x = points[nearestIndex].x,
        y = points[nearestIndex].y,
        label = formatDate(dp.date),
        value = "${formatValue(dp.value)}$prTag",
    )
}

internal fun formatDate(date: LocalDate): String {
    return "${date.monthNumber}/${date.dayOfMonth}"
}

internal fun formatValue(value: Double): String {
    return if (value == value.toLong().toDouble()) {
        "${value.toLong()}"
    } else {
        String.format("%.1f", value)
    }
}
