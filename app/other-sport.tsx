/**
 * Other Sport Route
 *
 * Push page for other sport recording.
 * Renders the OtherSportScreen component with data from DB.
 * In production, data will be connected via store/context.
 */

import React, { useEffect, useState, useCallback } from "react";
import { OtherSportScreen } from "@components/sport";
import type { SportEntryData, CustomSportData } from "@components/sport";
import type { SportType } from "../src/types";
import { getDatabase } from "../src/db/database";
import type { DatabaseAdapter } from "../src/db/database-adapter";
import { createSportTypeRepo } from "../src/db/repositories/sport-type.repo";

function getDbAdapter(): DatabaseAdapter {
  return getDatabase() as unknown as DatabaseAdapter;
}

export default function OtherSportRoute() {
  const [sportTypes, setSportTypes] = useState<SportType[]>([]);

  useEffect(() => {
    try {
      const db = getDbAdapter();
      const sportTypeRepo = createSportTypeRepo(db);
      setSportTypes(sportTypeRepo.findAllIncludingCustom());
    } catch {
      // DB not available
    }
  }, []);

  const handleSave = useCallback((_data: SportEntryData) => {
    // Will create OtherSportRecord + SportMetricValue entries via repo
  }, []);

  const handleCreateCustomSport = useCallback((_data: CustomSportData) => {
    // Will create SportType (is_custom=1) + SportMetric entries via repo
  }, []);

  const handleBack = useCallback(() => {
    // Will navigate back to calendar via router.back()
  }, []);

  return (
    <OtherSportScreen
      sportTypes={sportTypes}
      currentMetrics={[]}
      onSave={handleSave}
      onCreateCustomSport={handleCreateCustomSport}
      onBack={handleBack}
    />
  );
}
