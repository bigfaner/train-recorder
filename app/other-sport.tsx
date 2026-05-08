/**
 * Other Sport Route
 *
 * Push page for other sport recording.
 * Renders the OtherSportScreen component with injected props.
 * In production, data will be connected via store/context.
 */

import React from "react";
import { OtherSportScreen } from "@components/sport";
import type { SportEntryData, CustomSportData } from "@components/sport";

export default function OtherSportRoute() {
  const handleSave = (_data: SportEntryData) => {
    // Will create OtherSportRecord + SportMetricValue entries via repo
  };

  const handleCreateCustomSport = (_data: CustomSportData) => {
    // Will create SportType (is_custom=1) + SportMetric entries via repo
  };

  const handleBack = () => {
    // Will navigate back to calendar via router.back()
  };

  return (
    <OtherSportScreen
      sportTypes={[]}
      currentMetrics={[]}
      onSave={handleSave}
      onCreateCustomSport={handleCreateCustomSport}
      onBack={handleBack}
    />
  );
}
