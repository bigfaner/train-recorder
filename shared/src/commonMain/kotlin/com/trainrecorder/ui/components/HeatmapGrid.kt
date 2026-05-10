package com.trainrecorder.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
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
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.datetime.LocalDate

/**
 * Intensity scale levels: 0=none, 1=light, 2=medium, 3=high, 4=max.
 */
private val INTENSITY_COLORS = listOf(
    Color(0xFFE8E8ED), // 0 - no activity (light gray)
    Color(0xFF9BE9A8), // 1 - light
    Color(0xFF40C463), // 2 - medium
    Color(0xFF30A14E), // 3 - high
    Color(0xFF216E39), // 4 - max
)

private const val CELLS_PER_ROW = 7
private const val CELL_SPACING = 4f
private const val CELL_CORNER_RADIUS = 3f

/**
 * A heatmap grid composable for training frequency visualization.
 * Displays a 28-day grid (4 rows x 7 columns) with intensity-based coloring.
 * Supports touch-to-inspect to view cell details.
 *
 * @param cells The heatmap cells to render (max 28, most recent 28 days).
 * @param modifier Modifier for the chart.
 * @param accentColor The base color for intensity scaling (overrides default green scale).
 */
@Composable
fun HeatmapGrid(
    cells: List<HeatmapCell>,
    modifier: Modifier = Modifier,
    accentColor: Color? = null,
) {
    var inspectedIndex by remember(cells) { mutableStateOf<Int?>(null) }
    val colorScale = if (accentColor != null) {
        buildIntensityScale(accentColor)
    } else {
        INTENSITY_COLORS
    }

    Box(
        modifier = modifier,
        contentAlignment = Alignment.TopCenter,
    ) {
        Canvas(
            modifier = Modifier
                .fillMaxWidth()
                .height(180.dp)
                .pointerInput(cells) {
                    detectTapGestures { offset ->
                        inspectedIndex = findCellIndex(
                            Offset(offset.x, offset.y),
                            cells.size,
                            Size(size.width.toFloat(), size.height.toFloat()),
                        )
                    }
                },
        ) {
            val canvasSize = Size(size.width.toFloat(), size.height.toFloat())
            val rows = if (cells.isEmpty()) 0
                else kotlin.math.ceil(cells.size.toDouble() / CELLS_PER_ROW).toInt()
            val cellWidth = if (cells.isEmpty()) 0f
                else (canvasSize.width - (CELLS_PER_ROW + 1) * CELL_SPACING) / CELLS_PER_ROW
            val cellHeight = if (rows == 0) 0f
                else (canvasSize.height - (rows + 1) * CELL_SPACING) / rows

            cells.forEachIndexed { index, cell ->
                val row = index / CELLS_PER_ROW
                val col = index % CELLS_PER_ROW
                val x = CELL_SPACING + col * (cellWidth + CELL_SPACING)
                val y = CELL_SPACING + row * (cellHeight + CELL_SPACING)

                val color = colorScale[cell.intensity.coerceIn(0, 4)]
                val isHighlighted = inspectedIndex == index

                drawRoundRect(
                    color = color,
                    topLeft = Offset(x, y),
                    size = Size(cellWidth, cellHeight),
                    cornerRadius = CornerRadius(CELL_CORNER_RADIUS, CELL_CORNER_RADIUS),
                )

                if (isHighlighted) {
                    drawRoundRect(
                        color = Color.White,
                        topLeft = Offset(x - 2f, y - 2f),
                        size = Size(cellWidth + 4f, cellHeight + 4f),
                        cornerRadius = CornerRadius(CELL_CORNER_RADIUS, CELL_CORNER_RADIUS),
                        style = Stroke(width = 2f),
                    )
                }
            }
        }

        // Inspection tooltip
        inspectedIndex?.let { index ->
            if (index in cells.indices) {
                val cell = cells[index]
                val intensityLabel = when (cell.intensity) {
                    0 -> "No training"
                    1 -> "Light"
                    2 -> "Medium"
                    3 -> "High"
                    else -> "Max"
                }
                Text(
                    text = "${formatDate(cell.date)} - $intensityLabel",
                    color = MaterialTheme.colorScheme.onSurface,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(top = 4.dp, start = 8.dp),
                )
            }
        }
    }
}

private fun findCellIndex(
    offset: Offset,
    cellCount: Int,
    canvasSize: Size,
): Int? {
    if (cellCount == 0) return null
    val rows = kotlin.math.ceil(cellCount.toDouble() / CELLS_PER_ROW).toInt()
    val cellWidth = (canvasSize.width - (CELLS_PER_ROW + 1) * CELL_SPACING) / CELLS_PER_ROW
    val cellHeight = (canvasSize.height - (rows + 1) * CELL_SPACING) / rows

    for (index in 0 until cellCount) {
        val row = index / CELLS_PER_ROW
        val col = index % CELLS_PER_ROW
        val x = CELL_SPACING + col * (cellWidth + CELL_SPACING)
        val y = CELL_SPACING + row * (cellHeight + CELL_SPACING)

        if (offset.x >= x && offset.x <= x + cellWidth &&
            offset.y >= y && offset.y <= y + cellHeight
        ) {
            return index
        }
    }
    return null
}

private fun buildIntensityScale(accentColor: Color): List<Color> {
    return listOf(
        Color(0xFFE8E8ED),
        accentColor.copy(alpha = 0.25f),
        accentColor.copy(alpha = 0.50f),
        accentColor.copy(alpha = 0.75f),
        accentColor,
    )
}
