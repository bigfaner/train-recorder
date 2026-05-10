/**
 * WorkoutSession repository with session_status state machine
 * and date/type/status queries.
 *
 * State machine: in_progress -> completed | completed_partial
 * session_date is VARCHAR(10) 'YYYY-MM-DD' for range queries.
 */

import type { DatabaseAdapter } from "../database-adapter";
import type { WorkoutSession } from "../../types";
import { createBaseRepository, type BaseRepo } from "./base.repository";

const TABLE_NAME = "workout_sessions";
const COLUMNS = [
  "id",
  "biz_key",
  "session_date",
  "training_type",
  "session_status",
  "started_at",
  "ended_at",
  "is_backlog",
  "created_at",
  "updated_at",
];

/** Valid session_status transitions */
const VALID_TRANSITIONS: Record<string, string[]> = {
  in_progress: ["completed", "completed_partial"],
  completed: [],
  completed_partial: [],
};

export interface WorkoutSessionRepo extends BaseRepo<WorkoutSession> {
  createSession(data: Omit<WorkoutSession, "id">): WorkoutSession;
  findByDate(sessionDate: string): WorkoutSession[];
  findByDateRange(startDate: string, endDate: string): WorkoutSession[];
  findByStatus(status: WorkoutSession["session_status"]): WorkoutSession[];
  findByTrainingType(
    trainingType: WorkoutSession["training_type"],
  ): WorkoutSession[];
  completeSession(id: number): WorkoutSession;
  partialCompleteSession(id: number): WorkoutSession;
  findActive(): WorkoutSession | null;
}

export function createWorkoutSessionRepo(
  db: DatabaseAdapter,
): WorkoutSessionRepo {
  const base = createBaseRepository<WorkoutSession>(db, TABLE_NAME, COLUMNS);
  const columnsStr = COLUMNS.join(", ");

  function transitionStatus(
    id: number,
    newStatus: WorkoutSession["session_status"],
  ): WorkoutSession {
    const session = base.findById(id);
    if (!session) {
      throw new Error(`WorkoutSession with id=${id} not found`);
    }
    const allowed = VALID_TRANSITIONS[session.session_status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new Error(
        `Invalid status transition: ${session.session_status} -> ${newStatus}`,
      );
    }
    const now = new Date().toISOString();
    db.runSync(
      `UPDATE workout_sessions SET session_status = ?, ended_at = ?, updated_at = ? WHERE id = ?`,
      [newStatus, now, now, id],
    );
    return base.findById(id)!;
  }

  return {
    ...base,

    createSession(data: Omit<WorkoutSession, "id">): WorkoutSession {
      return base.create(data);
    },

    findByDate(sessionDate: string): WorkoutSession[] {
      return db.getAllSync<WorkoutSession>(
        `SELECT ${columnsStr} FROM workout_sessions WHERE session_date = ? ORDER BY started_at ASC`,
        [sessionDate],
      );
    },

    findByDateRange(startDate: string, endDate: string): WorkoutSession[] {
      return db.getAllSync<WorkoutSession>(
        `SELECT ${columnsStr} FROM workout_sessions WHERE session_date >= ? AND session_date <= ? ORDER BY session_date ASC, started_at ASC`,
        [startDate, endDate],
      );
    },

    findByStatus(status: WorkoutSession["session_status"]): WorkoutSession[] {
      return db.getAllSync<WorkoutSession>(
        `SELECT ${columnsStr} FROM workout_sessions WHERE session_status = ? ORDER BY session_date DESC`,
        [status],
      );
    },

    findByTrainingType(
      trainingType: WorkoutSession["training_type"],
    ): WorkoutSession[] {
      return db.getAllSync<WorkoutSession>(
        `SELECT ${columnsStr} FROM workout_sessions WHERE training_type = ? ORDER BY session_date DESC`,
        [trainingType],
      );
    },

    completeSession(id: number): WorkoutSession {
      return transitionStatus(id, "completed");
    },

    partialCompleteSession(id: number): WorkoutSession {
      return transitionStatus(id, "completed_partial");
    },

    findActive(): WorkoutSession | null {
      return db.getFirstSync<WorkoutSession>(
        `SELECT ${columnsStr} FROM workout_sessions WHERE session_status = 'in_progress' ORDER BY started_at DESC LIMIT 1`,
      );
    },
  };
}
