/**
 * Stats Page (Tab 4)
 *
 * Statistics overview dashboard with:
 * - Hero card: weekly volume with week-over-week change
 * - Four-grid summary: sessions, duration, PRs
 * - Weekly volume bar chart: last 8 weeks
 * - PR list: top 4 exercises with estimated 1RM
 * - Training frequency heatmap: 28-day grid
 */

import React, { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Colors, Spacing } from "@utils/constants";
import type { StatsData } from "@services/stats-service";
import {
  HeroCard,
  FourGridSummary,
  WeeklyVolumeChart,
  PRList,
  TrainingHeatmap,
  EmptyStatsState,
} from "@components/stats";

export default function StatsScreen() {
  const [statsData] = useState<StatsData | null>(null);

  // Stats data will be loaded from the service in a real app.
  // For now, display the empty state placeholder.
  // Integration with the database will be wired up via a store or hook.

  if (!statsData) {
    return (
      <View style={styles.container}>
        <EmptyStatsState />
      </View>
    );
  }

  if (!statsData.hasData) {
    return (
      <View style={styles.container}>
        <EmptyStatsState />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.content}
    >
      <HeroCard data={statsData.heroCard} />
      <FourGridSummary data={statsData.fourGrid} />
      <WeeklyVolumeChart data={statsData.weeklyVolumes} />
      <PRList records={statsData.prRecords} />
      <TrainingHeatmap data={statsData.frequencyHeatmap} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
  },
  content: {
    padding: Spacing.contentPadding,
    paddingTop: Spacing.contentPadding,
    paddingBottom: Spacing.sectionSpacing * 2,
  },
});
