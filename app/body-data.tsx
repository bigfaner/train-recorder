/**
 * Body Data Route
 *
 * Push page for body measurement recording.
 * Renders the BodyDataScreen component with injected props.
 * In production, data will be connected via store/context.
 */

import React from "react";
import { BodyDataScreen } from "@components/body";
import type { BodyEntryData } from "@components/body";

export default function BodyDataRoute() {
  // Placeholder handlers - will be connected to store/context
  const handleSave = (_data: BodyEntryData) => {
    // Will create BodyMeasurement record via repo
  };

  const handleUpdate = (_id: number, _data: BodyEntryData) => {
    // Will update BodyMeasurement record via repo
  };

  const handleDelete = (_id: number) => {
    // Will delete BodyMeasurement record via repo
  };

  return (
    <BodyDataScreen
      measurements={[]}
      latest={null}
      previous={null}
      onSave={handleSave}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
