package com.trainrecorder.ui.screens

import com.trainrecorder.domain.model.WorkoutSession
import com.trainrecorder.domain.model.WorkoutStatus
import com.trainrecorder.ui.components.BarChartDataPoint
import com.trainrecorder.ui.components.HeatmapCell
import com.trainrecorder.ui.components.LineChartDataPoint
import com.trainrecorder.viewmodel.HistoryTab
import com.trainrecorder.viewmodel.ProgressDataPoint
import com.trainrecorder.viewmodel.VolumeDataPoint
import com.trainrecorder.viewmodel.WorkoutSessionSummary
import kotlinx.datetime.LocalDate

/**
 * History tab labels for display.
 */
val HISTORY_TAB_LABELS = mapOf(
    HistoryTab.HISTORY to "History",
    HistoryTab.PROGRESS to "Progress",
    HistoryTab.VOLUME to "Volume",
    HistoryTab.PR to "PR",
)

/**
 * Convert sessions to summary cards for the History tab.
 * Filters out IN_PROGRESS sessions and sorts by date descending.
 */
fun computeSessionSummaries(
    sessions: List<WorkoutSession>,
): List<WorkoutSessionSummary> {
    return sessions
        .filter { it.workoutStatus != WorkoutStatus.IN_PROGRESS }
        .sortedByDescending { it.recordDate }
        .map { session ->
            WorkoutSessionSummary(
                sessionId = session.id,
                date = session.recordDate,
                trainingType = session.trainingType,
                exercises = emptyList(),
                totalVolume = 0.0,
                feelingScore = null,
            )
        }
}

/**
 * Convert progress data points to LineChartDataPoint format for the chart.
 */
fun toLineChartData(
    progressData: List<ProgressDataPoint>,
): List<LineChartDataPoint> {
    return progressData.map { point ->
        LineChartDataPoint(
            date = point.date,
            value = point.weight,
            isPR = point.isPR,
        )
    }
}

/**
 * Convert volume data points to BarChartDataPoint format for the chart.
 */
fun toBarChartData(
    volumeData: List<VolumeDataPoint>,
): List<BarChartDataPoint> {
    return volumeData.map { point ->
        BarChartDataPoint(
            date = point.date,
            value = point.volume,
        )
    }
}

/**
 * Format a date for display in session cards (e.g., "May 11").
 */
fun formatSessionDate(date: LocalDate): String {
    val monthName = date.month.name.lowercase().replaceFirstChar { it.uppercase() }
    return "$monthName ${date.dayOfMonth}"
}

/**
 * Format a date range for the progress chart axis.
 */
fun formatChartDateRange(dates: List<LocalDate>): Pair<String, String>? {
    if (dates.isEmpty()) return null
    val first = dates.first()
    val last = dates.last()
    return Pair(formatSessionDate(first), formatSessionDate(last))
}

/**
 * Compute the duration display for a session card.
 * Since we don't have duration stored directly, we format started/ended timestamps.
 */
fun formatSessionDuration(startedAt: kotlinx.datetime.Instant?, endedAt: kotlinx.datetime.Instant?): String {
    if (startedAt == null || endedAt == null) return "--"
    val durationSeconds = (endedAt.toEpochMilliseconds() - startedAt.toEpochMilliseconds()) / 1000
    val hours = durationSeconds / 3600
    val minutes = (durationSeconds % 3600) / 60
    return if (hours > 0) {
        "${hours}h ${minutes}m"
    } else {
        "${minutes}m"
    }
}

/**
 * Format volume with unit suffix.
 */
fun formatVolume(volume: Double, unit: String = "kg"): String {
    return if (volume == volume.toLong().toDouble()) {
        "${volume.toLong()} $unit"
    } else {
        String.format("%.1f %s", volume, unit)
    }
}

/**
 * Get the ordered list of history tabs.
 */
fun getHistoryTabs(): List<HistoryTab> = HistoryTab.entries
