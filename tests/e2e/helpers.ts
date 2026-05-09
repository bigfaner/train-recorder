import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import type { Page } from "@playwright/test";

const __dirname = dirname(fileURLToPath(import.meta.url));

// -- Config ---------------------------------------------------------------
let _configPath: string | null = null;
let _config: E2EConfig | null = null;

function findConfigPath(): string {
  const envPath = process.env.E2E_CONFIG_PATH;
  if (envPath && existsSync(envPath)) return resolve(envPath);

  let dir = __dirname;
  for (let i = 0; i < 10; i++) {
    const candidate = resolve(dir, "config.yaml");
    if (existsSync(candidate)) return candidate;
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return "";
}

const SCREENSHOTS_DIR = join(__dirname, "results", "screenshots");

interface E2EConfig {
  baseUrl?: string;
  timeout?: number | string;
}

function getConfig(): E2EConfig {
  if (_config) return _config;
  _configPath = findConfigPath();
  if (!_configPath) return {};
  const raw = parseYaml(readFileSync(_configPath, "utf-8"));
  if (typeof raw !== "object" || raw === null) {
    throw new Error(`Invalid config.yaml: expected object, got ${typeof raw}`);
  }
  _config = raw as E2EConfig;
  return _config;
}

export function baseUrl(): string {
  return getConfig().baseUrl ?? "http://localhost:8081";
}
export function timeout(): number {
  return Number(getConfig().timeout ?? 30000);
}

// -- Evidence ---------------------------------------------------------------
export async function screenshot(page: Page, tcId: string): Promise<string> {
  if (!existsSync(SCREENSHOTS_DIR))
    mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const path = join(SCREENSHOTS_DIR, `${tcId}.png`);
  await page.screenshot({ path, fullPage: true });
  return path;
}

// -- Retry ------------------------------------------------------------------
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts?: { maxRetries?: number; delayMs?: number; label?: string },
): Promise<T> {
  const maxRetries = opts?.maxRetries ?? 3;
  const delayMs = opts?.delayMs ?? 1000;
  const label = opts?.label ?? "operation";

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt === maxRetries) throw e;
      console.warn(
        `${label} failed (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`,
        e,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("unreachable");
}

// -- File helpers ------------------------------------------------------------
export const PROJECT_ROOT = resolve(__dirname, "..", "..");

export function readProjectFile(relPath: string): string {
  return readFileSync(join(PROJECT_ROOT, relPath), "utf-8");
}

export function projectFileExists(relPath: string): boolean {
  return existsSync(join(PROJECT_ROOT, relPath));
}
