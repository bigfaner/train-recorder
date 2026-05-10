/**
 * Sport Editor Route
 *
 * Push page for custom sport type creation.
 * Renders the CustomSportEditor component with injected props.
 * In production, data will be connected via store/context.
 */

import React from "react";
import { CustomSportEditor } from "@components/sport";
import type { CustomSportData } from "@components/sport";

export default function SportEditorRoute() {
  const handleSave = (_data: CustomSportData) => {
    // Will create SportType (is_custom=1) + SportMetric entries via repo
  };

  const handleBack = () => {
    // Will navigate back via router.back()
  };

  return <CustomSportEditor onSave={handleSave} onBack={handleBack} />;
}
