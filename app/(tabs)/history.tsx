/**
 * History tab page (Tab 3).
 * Reads workout sessions, exercises, sets, PRs, and feelings from DB.
 * Renders the injected-props HistoryScreen component.
 */

import React, { useEffect, useState } from "react";
import { HistoryScreen } from "@components/history";
import type {
  WorkoutSession,
  WorkoutExercise,
  WorkoutSet,
  PersonalRecord,
  PersonalRecordEntry,
  Feeling,
  Exercise,
} from "../../src/types";
import { getDatabase } from "../../src/db/database";
import type { DatabaseAdapter } from "../../src/db/database-adapter";
import { createWorkoutSessionRepo } from "../../src/db/repositories/workout-session.repo";
import { createWorkoutExerciseRepo } from "../../src/db/repositories/workout-exercise.repo";
import { createWorkoutSetRepo } from "../../src/db/repositories/workout-set.repo";
import { createPersonalRecordRepo } from "../../src/db/repositories/personal-record.repo";
import { createFeelingRepo } from "../../src/db/repositories/feeling.repo";
import { createExerciseRepo } from "../../src/db/repositories/exercise.repo";

function getDbAdapter(): DatabaseAdapter {
  return getDatabase() as unknown as DatabaseAdapter;
}

/** Map DB PersonalRecord (snake_case) to PersonalRecordEntry (camelCase) */
function toPersonalRecordEntry(pr: PersonalRecord): PersonalRecordEntry {
  return {
    exerciseBizKey: pr.exercise_biz_key,
    prType: pr.pr_type,
    prValue: pr.pr_value,
    prDate: pr.pr_date,
  };
}

export default function HistoryTabPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [exercisesBySession, setExercisesBySession] = useState<
    Map<bigint, WorkoutExercise[]>
  >(new Map());
  const [setsByExercise, setSetsByExercise] = useState<
    Map<bigint, WorkoutSet[]>
  >(new Map());
  const [prs, setPrs] = useState<PersonalRecordEntry[]>([]);
  const [feelingsBySession, setFeelingsBySession] = useState<
    Map<bigint, Feeling>
  >(new Map());
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    try {
      const db = getDbAdapter();
      const sessionRepo = createWorkoutSessionRepo(db);
      const exerciseRepo = createWorkoutExerciseRepo(db);
      const setRepo = createWorkoutSetRepo(db);
      const prRepo = createPersonalRecordRepo(db);
      const feelingRepo = createFeelingRepo(db);
      const exerciseListRepo = createExerciseRepo(db);

      // Get all completed and partial sessions
      const completed = sessionRepo.findByStatus("completed");
      const partial = sessionRepo.findByStatus("completed_partial");
      const allSessions = [...completed, ...partial];
      setSessions(allSessions);

      // Build exercise and set maps
      const exMap = new Map<bigint, WorkoutExercise[]>();
      const setMap = new Map<bigint, WorkoutSet[]>();
      for (const session of allSessions) {
        const sessionExercises = exerciseRepo.findBySessionBizKey(
          session.biz_key,
        );
        exMap.set(session.biz_key, sessionExercises);
        for (const we of sessionExercises) {
          const sets = setRepo.findByWorkoutExerciseBizKey(we.biz_key);
          setMap.set(we.biz_key, sets);
        }
      }
      setExercisesBySession(exMap);
      setSetsByExercise(setMap);

      // Get all PRs and map to PersonalRecordEntry
      const allPrs = prRepo.findAll();
      setPrs(allPrs.map(toPersonalRecordEntry));

      // Get feelings for each session
      const feelMap = new Map<bigint, Feeling>();
      for (const session of allSessions) {
        const feeling = feelingRepo.findByWorkoutSessionBizKey(session.biz_key);
        if (feeling) {
          feelMap.set(session.biz_key, feeling);
        }
      }
      setFeelingsBySession(feelMap);

      // Get all exercises for name lookup
      setExercises(exerciseListRepo.findAllActive());
    } catch {
      // DB not available
    }
  }, []);

  return (
    <HistoryScreen
      sessions={sessions}
      exercisesBySession={exercisesBySession}
      setsByExercise={setsByExercise}
      prs={prs}
      feelingsBySession={feelingsBySession}
      exercises={exercises}
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
