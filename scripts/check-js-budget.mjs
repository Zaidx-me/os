#!/usr/bin/env node
/**
 * CI gate: landing route (/) first-load JS must be <= 150 KB gzip.
 * Reads `.next/diagnostics/route-bundle-stats.json` produced by `next build`.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const BUDGET_KB = 150;
const ROOT = process.cwd();
const STATS_PATH = path.join(ROOT, ".next/diagnostics/route-bundle-stats.json");

if (!fs.existsSync(STATS_PATH)) {
  console.error(
    `Missing ${STATS_PATH}. Run "npm run build" before the budget check.`,
  );
  process.exit(1);
}

const stats = JSON.parse(fs.readFileSync(STATS_PATH, "utf8"));
const landing = stats.find((r) => r.route === "/");

if (!landing) {
  console.error('No "/" entry in route-bundle-stats.json');
  process.exit(1);
}

let totalGzip = 0;
const lines = [];

for (const chunkPath of landing.firstLoadChunkPaths) {
  const abs = path.isAbsolute(chunkPath)
    ? chunkPath
    : path.join(ROOT, chunkPath);
  if (!fs.existsSync(abs)) {
    console.error(`Chunk not found: ${abs}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(abs);
  const gz = zlib.gzipSync(raw);
  totalGzip += gz.length;
  lines.push(`  ${path.basename(abs)}: ${(gz.length / 1024).toFixed(1)} KB gzip`);
}

const totalKb = totalGzip / 1024;
console.log(`Landing route first-load JS (gzip): ${totalKb.toFixed(1)} KB`);
for (const line of lines) console.log(line);

if (totalKb > BUDGET_KB) {
  console.error(
    `\nBudget exceeded: ${totalKb.toFixed(1)} KB > ${BUDGET_KB} KB limit.`,
  );
  process.exit(1);
}

console.log(`\nOK — within ${BUDGET_KB} KB gzip budget.`);
