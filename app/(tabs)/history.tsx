import { HistoryScreen } from "@components/history";

/**
 * History tab page (Tab 3).
 * Uses the injected-props HistoryScreen component.
 * Data will be wired via hooks/stores in future integration phase.
 */
export default function HistoryTabPage() {
  // Placeholder: in production, these props come from hooks/stores
  return (
    <HistoryScreen
      sessions={[]}
      exercisesBySession={new Map()}
      setsByExercise={new Map()}
      prs={[]}
      feelingsBySession={new Map()}
      exercises={[]}
      progressData={[]}
      progressExercises={[]}
      volumeData={[]}
      volumeSummary={{ currentWeek: 0, lastWeek: 0, monthlyTotal: 0 }}
      volumeWeekChange="N/A"
      prCards={[]}
      onEditSession={() => {}}
      onDeleteSession={() => {}}
      selectedExerciseBizKey={null}
      onExerciseSelect={() => {}}
    />
  );
}
