import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { exportStatic } from "./static_export.mjs";

function daily(key, extra = {}) {
  return {
    kind: "daily",
    key,
    title: `日报 ${key}`,
    overview: `overview ${key}`,
    lead: { title: `lead ${key}`, leadParagraph: `para ${key}` },
    metrics: {
      sourcesCount: extra.sourcesCount ?? 0,
      firstPartyEvents: extra.firstPartyEvents ?? 0,
    },
    flashes: extra.flashes || [],
  };
}

const tmp = mkdtempSync(join(tmpdir(), "static-export-daily-"));
try {
  const distDir = join(tmp, "dist");
  const contentDir = join(tmp, "content");
  mkdirSync(contentDir, { recursive: true });

  const tip = daily("2026-10-24", {
    sourcesCount: 14,
    firstPartyEvents: 12,
    flashes: Array.from({ length: 20 }, (_, i) => ({ title: `flash-${i}` })),
  });
  const archive = daily("2026-10-25", {
    sourcesCount: 11,
    firstPartyEvents: 6,
    flashes: Array.from({ length: 10 }, (_, i) => ({ title: `thin-${i}` })),
  });

  await exportStatic({
    distDir,
    contentDir,
    dataAsOf: "2026-10-25T16:00:00+08:00",
    builtAt: "2026-10-25T08:00:00.000Z",
    engine: {},
    site: { daily: tip, dailies: [tip, archive] },
  });

  const latest = JSON.parse(readFileSync(join(distDir, "api", "v1", "daily", "latest.json"), "utf8"));
  const tipFile = JSON.parse(readFileSync(join(distDir, "api", "v1", "daily", "2026-10-24.json"), "utf8"));
  const archiveFile = JSON.parse(readFileSync(join(distDir, "api", "v1", "daily", "2026-10-25.json"), "utf8"));
  const index = JSON.parse(readFileSync(join(distDir, "api", "v1", "index.json"), "utf8"));
  const files = (index.files || []).map((row) => row.path);

  assert.equal(latest.key, "2026-10-24", "latest.json stays tip-only");
  assert.equal(latest.metrics.sourcesCount, 14);
  assert.equal(latest.metrics.firstPartyEvents, 12);
  assert.equal(latest.flashes.length, 20);
  assert.equal(tipFile.key, "2026-10-24");
  assert.equal(archiveFile.key, "2026-10-25");
  assert.equal(archiveFile.metrics.sourcesCount, 11, "archive day may be below floor");
  assert.ok(files.includes("api/v1/daily/latest.json"));
  assert.ok(files.includes("api/v1/daily/2026-10-24.json"));
  assert.ok(files.includes("api/v1/daily/2026-10-25.json"));
  assert.equal(files.filter((path) => path === "api/v1/daily/2026-10-24.json").length, 1);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log("static_export.daily.test.mjs ok");
