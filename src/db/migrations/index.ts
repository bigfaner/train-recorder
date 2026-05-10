export {
  getCurrentVersion,
  setSchemaVersion,
  applyMigrations,
  isDatabaseInitialized,
  SCHEMA_VERSION_KEY,
  INITIAL_VERSION,
} from "./migration-manager";
export type { Migration } from "./migration-manager";
