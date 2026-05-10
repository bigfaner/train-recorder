/**
 * Body Data Route
 *
 * Push page for body measurement recording.
 * Renders the BodyDataScreen component with data from DB.
 * In production, data will be connected via store/context.
 */

import React, { useEffect, useState, useCallback } from "react";
import { BodyDataScreen } from "@components/body";
import type { BodyEntryData } from "@components/body";
import type { BodyMeasurement } from "../src/types";
import { getDatabase } from "../src/db/database";
import type { DatabaseAdapter } from "../src/db/database-adapter";
import { createBodyMeasurementRepo } from "../src/db/repositories/body-measurement.repo";

function getDbAdapter(): DatabaseAdapter {
  return getDatabase() as unknown as DatabaseAdapter;
}

export default function BodyDataRoute() {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [latest, setLatest] = useState<BodyMeasurement | null>(null);
  const [previous, setPrevious] = useState<BodyMeasurement | null>(null);

  useEffect(() => {
    try {
      const db = getDbAdapter();
      const bodyRepo = createBodyMeasurementRepo(db);
      const all = bodyRepo.findAll();
      setMeasurements(all);
      setLatest(bodyRepo.findLatest());
      if (all.length >= 2) {
        // Previous is second-to-last by date
        const sorted = [...all].sort(
          (a, b) =>
            new Date(b.record_date).getTime() -
            new Date(a.record_date).getTime(),
        );
        setPrevious(sorted[1] ?? null);
      }
    } catch {
      // DB not available
    }
  }, []);

  const handleSave = useCallback((_data: BodyEntryData) => {
    // Will create BodyMeasurement record via repo
  }, []);

  const handleUpdate = useCallback((_id: number, _data: BodyEntryData) => {
    // Will update BodyMeasurement record via repo
  }, []);

  const handleDelete = useCallback((_id: number) => {
    // Will delete BodyMeasurement record via repo
  }, []);

  return (
    <BodyDataScreen
      measurements={measurements}
      latest={latest}
      previous={previous}
      onSave={handleSave}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
