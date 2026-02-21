/**
 * report.ts — test result formatting and file output
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

export type Status = "PASS" | "FAIL" | "SKIP" | "ERROR";

export interface ScenarioResult {
  id: string;
  name: string;
  status: Status;
  durationMs: number;
  details: string[];
  evidence?: Record<string, unknown>;
  error?: string;
}

const RESULTS_DIR = join(import.meta.dir, "../results");

// ANSI colours
const GREEN  = "\x1b[32m";
const RED    = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN   = "\x1b[36m";
const DIM    = "\x1b[2m";
const BOLD   = "\x1b[1m";
const RESET  = "\x1b[0m";

function statusColour(s: Status): string {
  if (s === "PASS")  return GREEN  + BOLD + s + RESET;
  if (s === "FAIL")  return RED    + BOLD + s + RESET;
  if (s === "SKIP")  return YELLOW + BOLD + s + RESET;
  return RED + BOLD + s + RESET;
}

export function printResult(r: ScenarioResult): void {
  const pad = r.id.padEnd(3, " ");
  const dur = `${(r.durationMs / 1000).toFixed(1)}s`.padStart(7, " ");
  console.log(
    `  ${CYAN}[${pad}]${RESET} ${r.name.padEnd(50, ".")}${statusColour(r.status)}${DIM}${dur}${RESET}`
  );
  for (const line of r.details) {
    console.log(`       ${DIM}${line}${RESET}`);
  }
  if (r.error) {
    console.log(`       ${RED}ERROR: ${r.error}${RESET}`);
  }
}

export function printSummary(results: ScenarioResult[]): void {
  const pass  = results.filter((r) => r.status === "PASS").length;
  const fail  = results.filter((r) => r.status === "FAIL").length;
  const skip  = results.filter((r) => r.status === "SKIP").length;
  const error = results.filter((r) => r.status === "ERROR").length;
  const total = results.length;

  console.log();
  console.log(`${BOLD}━━━ Summary ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
  console.log(`  ${GREEN}PASS${RESET}  ${pass}/${total}`);
  if (fail  > 0) console.log(`  ${RED}FAIL${RESET}  ${fail}`);
  if (error > 0) console.log(`  ${RED}ERROR${RESET} ${error}`);
  if (skip  > 0) console.log(`  ${YELLOW}SKIP${RESET}  ${skip}`);
  console.log();

  if (fail + error > 0) {
    console.log(`${BOLD}━━━ Failed Details ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
    for (const r of results.filter((r) => r.status === "FAIL" || r.status === "ERROR")) {
      console.log(`  ${RED}[${r.id}] ${r.name}${RESET}`);
      for (const d of r.details) console.log(`      ${d}`);
      if (r.error) console.log(`      ERROR: ${r.error}`);
    }
    console.log();
  }
}

export function saveResults(results: ScenarioResult[]): void {
  mkdirSync(RESULTS_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const path = join(RESULTS_DIR, `run-${ts}.json`);
  writeFileSync(path, JSON.stringify(results, null, 2), "utf-8");
  console.log(`${DIM}  Results saved → ${path}${RESET}`);
}
