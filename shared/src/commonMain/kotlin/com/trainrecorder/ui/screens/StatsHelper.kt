package com.trainrecorder.ui.screens

import com.trainrecorder.domain.model.PersonalRecord
import com.trainrecorder.domain.model.WorkoutSession
import com.trainrecorder.domain.model.WorkoutStatus
import com.trainrecorder.ui.components.BarChartDataPoint
import com.trainrecorder.ui.components.HeatmapCell
import com.trainrecorder.viewmodel.EstimatedOneRM
import com.trainrecorder.viewmodel.WeeklyStats
import kotlinx.datetime.Clock
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.minus
import kotlinx.datetime.plus
import kotlinx.datetime.todayIn

/**
 * Stats summary card data for the hero card.
 */
data class StatsHeroData(
    val weeklyVolume: Double,
    val previousWeeklyVolume: Double,
    val changePercent: Double,
    val totalSessionsThisWeek: Int,
)

/**
 * 4-grid summary item data.
 */
data class SummaryGridItem(
    val label: String,
    val value: String,
    val subtitle: String,
)

/**
 * PR list item for stats display.
 */
data class PRListItem(
    val exerciseName: String,
    val estimatedOneRM: Double,
    val date: LocalDate,
)

/**
 * Compute hero card data showing weekly volume and change percentage.
 * Uses the most recent complete week vs the week before.
 */
fun computeHeroData(
    weeklyStats: List<WeeklyStats>,
): StatsHeroData {
    if (weeklyStats.isEmpty()) {
        return StatsHeroData(
            weeklyVolume = 0.0,
            previousWeeklyVolume = 0.0,
            changePercent = 0.0,
            totalSessionsThisWeek = 0,
        )
    }

    val sorted = weeklyStats.sortedByDescending { it.weekStart }
    val currentWeek = sorted.first()
    val previousWeek = sorted.getOrElse(1) { currentWeek }

    val currentVolume = currentWeek.totalVolume
    val previousVolume = previousWeek.totalVolume
    val changePercent = if (previousVolume > 0) {
        ((currentVolume - previousVolume) / previousVolume) * 100.0
    } else {
        0.0
    }

    return StatsHeroData(
        weeklyVolume = currentVolume,
        previousWeeklyVolume = previousVolume,
        changePercent = changePercent,
        totalSessionsThisWeek = currentWeek.totalSessions,
    )
}

/**
 * Compute the 4-grid summary items from weekly stats and PRs.
 */
fun computeSummaryGrid(
    weeklyStats: List<WeeklyStats>,
    personalRecords: List<PersonalRecord>,
    estimatedOneRMs: List<EstimatedOneRM>,
): List<SummaryGridItem> {
    val currentWeek = weeklyStats.sortedByDescending { it.weekStart }.firstOrNull()
    val totalSessions = currentWeek?.totalSessions ?: 0
    val totalVolume = currentWeek?.totalVolume ?: 0.0
    val prCount = personalRecords.size
    val bestOneRM = estimatedOneRMs.maxByOrNull { it.estimatedWeight }

    return listOf(
        SummaryGridItem(
            label = "Sessions",
            value = "$totalSessions",
            subtitle = "this week",
        ),
        SummaryGridItem(
            label = "Volume",
            value = formatVolume(totalVolume),
            subtitle = "this week",
        ),
        SummaryGridItem(
            label = "PRs",
            value = "$prCount",
            subtitle = "total",
        ),
        SummaryGridItem(
            label = "Best 1RM",
            value = bestOneRM?.let { String.format("%.1f kg", it.estimatedWeight) } ?: "--",
            subtitle = bestOneRM?.exerciseName ?: "no data",
        ),
    )
}

/**
 * Compute 8-week volume bar chart data from weekly stats.
 * Returns the most recent 8 weeks of volume data.
 */
fun computeWeeklyVolumeChart(
    weeklyStats: List<WeeklyStats>,
): List<BarChartDataPoint> {
    return weeklyStats
        .sortedBy { it.weekStart }
        .takeLast(8)
        .map { stat ->
            BarChartDataPoint(
                date = stat.weekStart,
                value = stat.totalVolume,
            )
        }
}

/**
 * Compute PR list items from estimated 1RMs.
 */
fun computePRList(
    estimatedOneRMs: List<EstimatedOneRM>,
): List<PRListItem> {
    return estimatedOneRMs
        .sortedByDescending { it.estimatedWeight }
        .map { orm ->
            PRListItem(
                exerciseName = orm.exerciseName,
                estimatedOneRM = orm.estimatedWeight,
                date = orm.date,
            )
        }
}

/**
 * Compute heatmap data for the last 4 weeks (28 days).
 * Maps session counts to intensity levels:
 * - 0: no training
 * - 1: 1 session (light)
 * - 2: 2 sessions (medium)
 * - 3: 3 sessions (high)
 * - 4: 4+ sessions (max)
 */
fun computeHeatmapCells(
    sessions: List<WorkoutSession>,
    today: LocalDate? = null,
): List<HeatmapCell> {
    val referenceDate = today ?: Clock.System.todayIn(TimeZone.currentSystemDefault())
    val startDate = referenceDate.minus(27, DateTimeUnit.DAY)

    val completedByDate = sessions
        .filter { it.workoutStatus != WorkoutStatus.IN_PROGRESS }
        .filter { it.recordDate >= startDate && it.recordDate <= referenceDate }
        .groupBy { it.recordDate }

    return (0..27).map { dayOffset ->
        val date = startDate.plus(dayOffset, DateTimeUnit.DAY)
        val sessionCount = completedByDate[date]?.size ?: 0
        val intensity = when {
            sessionCount == 0 -> 0
            sessionCount == 1 -> 1
            sessionCount == 2 -> 2
            sessionCount == 3 -> 3
            else -> 4
        }
        HeatmapCell(
            date = date,
            intensity = intensity,
        )
    }
}

/**
 * Format change percentage with sign.
 */
fun formatChangePercent(percent: Double): String {
    val sign = when {
        percent > 0 -> "+"
        percent < 0 -> ""
        else -> ""
    }
    return "$sign${String.format("%.0f", percent)}%"
}

