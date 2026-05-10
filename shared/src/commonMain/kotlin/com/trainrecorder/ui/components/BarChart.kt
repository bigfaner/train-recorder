package com.trainrecorder.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
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
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val PADDING_LEFT = 48f
private val PADDING_RIGHT = 16f
private val PADDING_TOP = 24f
private val PADDING_BOTTOM = 32f
private val BAR_CORNER_RADIUS = 4f

/**
 * A bar chart composable for volume trends.
 * Supports touch-to-inspect to view bar value details.
 *
 * @param dataPoints The data points to render as bars.
 * @param modifier Modifier for the chart.
 * @param barColor Color of the bars.
 * @param gridColor Color for the grid lines.
 * @param textColor Color for axis labels.
 */
@Composable
fun BarChart(
    dataPoints: List<BarChartDataPoint>,
    modifier: Modifier = Modifier,
    barColor: Color = MaterialTheme.colorScheme.primary,
    gridColor: Color = MaterialTheme.colorScheme.outlineVariant,
    textColor: Color = MaterialTheme.colorScheme.onSurfaceVariant,
) {
    var inspectedIndex by remember(dataPoints) { mutableStateOf<Int?>(null) }

    Box(
        modifier = modifier,
        contentAlignment = Alignment.TopCenter,
    ) {
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .pointerInput(dataPoints) {
                    detectTapGestures { offset ->
                        inspectedIndex = findNearestBarIndex(
                            Offset(offset.x, offset.y),
                            dataPoints.size,
                            Size(size.width.toFloat(), size.height.toFloat()),
                        )
                    }
                }
                .pointerInput(dataPoints) {
                    detectDragGestures { change, _ ->
                        change.consume()
                        inspectedIndex = findNearestBarIndex(
                            Offset(change.position.x, change.position.y),
                            dataPoints.size,
                            Size(size.width.toFloat(), size.height.toFloat()),
                        )
                    }
                },
        ) {
            if (dataPoints.isEmpty()) return@Canvas

            val canvasSize = Size(size.width.toFloat(), size.height.toFloat())
            val chartArea = Rect(
                left = PADDING_LEFT,
                top = PADDING_TOP,
                right = canvasSize.width - PADDING_RIGHT,
                bottom = canvasSize.height - PADDING_BOTTOM,
            )

            val maxValue = dataPoints.maxOf { it.value }.let { max ->
                if (max == 0.0) 100.0 else max * 1.1
            }

            drawBarGrid(chartArea, gridColor, maxValue)

            val barCount = dataPoints.size
            val totalBarAreaWidth = chartArea.width
            val barSpacing = totalBarAreaWidth / barCount
            val barWidth = barSpacing * 0.6f
            val barOffset = (barSpacing - barWidth) / 2f

            dataPoints.forEachIndexed { index, dataPoint ->
                val barHeight = if (maxValue > 0) {
                    ((dataPoint.value / maxValue) * chartArea.height).toFloat()
                } else {
                    0f
                }
                val x = chartArea.left + index * barSpacing + barOffset
                val y = chartArea.bottom - barHeight

                val isHighlighted = inspectedIndex == index
                val color = if (isHighlighted) barColor else barColor.copy(alpha = 0.7f)

                drawRoundRect(
                    color = color,
                    topLeft = Offset(x, y),
                    size = Size(barWidth, barHeight),
                    cornerRadius = CornerRadius(BAR_CORNER_RADIUS, BAR_CORNER_RADIUS),
                )

                // Draw highlight indicator
                if (isHighlighted) {
                    drawRoundRect(
                        color = barColor,
                        topLeft = Offset(x - 1f, y - 1f),
                        size = Size(barWidth + 2f, barHeight + 2f),
                        cornerRadius = CornerRadius(BAR_CORNER_RADIUS, BAR_CORNER_RADIUS),
                        style = Stroke(width = 2f),
                    )
                }
            }
        }

        // X-axis labels
        if (dataPoints.isNotEmpty()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(
                        start = PADDING_LEFT.dp,
                        end = PADDING_RIGHT.dp,
                        top = 2.dp,
                    )
                    .align(Alignment.BottomCenter),
                horizontalArrangement = androidx.compose.foundation.layout.Arrangement.SpaceBetween,
            ) {
                val labelStep = maxOf(1, dataPoints.size / 5)
                dataPoints.forEachIndexed { index, dataPoint ->
                    if (index % labelStep == 0 || index == dataPoints.size - 1) {
                        Text(
                            text = formatDate(dataPoint.date),
                            color = textColor,
                            fontSize = 10.sp,
                        )
                    }
                }
            }
        }

        // Inspection tooltip
        inspectedIndex?.let { index ->
            if (index in dataPoints.indices) {
                val dp = dataPoints[index]
                Text(
                    text = "${formatDate(dp.date)}: ${formatValue(dp.value)} kg",
                    color = MaterialTheme.colorScheme.onSurface,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(top = 4.dp, start = 8.dp),
                )
            }
        }
    }
}

private fun DrawScope.drawBarGrid(
    chartArea: Rect,
    gridColor: Color,
    maxValue: Double,
) {
    // Horizontal grid lines
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

private fun findNearestBarIndex(
    offset: Offset,
    cellCount: Int,
    canvasSize: Size,
): Int? {
    if (cellCount == 0) return null

    val chartArea = Rect(
        left = PADDING_LEFT,
        top = PADDING_TOP,
        right = canvasSize.width - PADDING_RIGHT,
        bottom = canvasSize.height - PADDING_BOTTOM,
    )
    if (offset.x < chartArea.left || offset.x > chartArea.right) return null
    if (offset.y < chartArea.top || offset.y > chartArea.bottom + 40) return null

    val barSpacing = chartArea.width / cellCount
    val index = ((offset.x - chartArea.left) / barSpacing).toInt()
    return index.coerceIn(0, cellCount - 1)
}
