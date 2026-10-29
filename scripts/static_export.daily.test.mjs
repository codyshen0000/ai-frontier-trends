import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { exportStatic } from "./static_export.mjs";

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function daily(key, extra = {}) {
  const row = {
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
  if (extra.generatedAt) row.generatedAt = extra.generatedAt;
  if (extra.data_as_of) row.data_as_of = extra.data_as_of;
  return row;
}

async function exportOnce(distDir, contentDir, { asOf, tip, archive }) {
  await exportStatic({
    distDir,
    contentDir,
    dataAsOf: asOf,
    builtAt: "2026-10-25T08:00:00.000Z",
    engine: {},
    site: { daily: tip, dailies: [tip, archive] },
  });
}

const tmp = mkdtempSync(join(tmpdir(), "static-export-daily-"));
try {
  const contentDir = join(tmp, "content");
  mkdirSync(contentDir, { recursive: true });

  const tip = daily("2026-10-24", {
    sourcesCount: 14,
    firstPartyEvents: 12,
    flashes: Array.from({ length: 20 }, (_, i) => ({ title: `flash-${i}` })),
    generatedAt: "2026-10-24T16:20:00.000Z",
  });
  const archive = daily("2026-10-25", {
    sourcesCount: 11,
    firstPartyEvents: 6,
    flashes: Array.from({ length: 10 }, (_, i) => ({ title: `thin-${i}` })),
    data_as_of: "2026-10-25T11:06:10+08:00",
  });

  const firstDir = join(tmp, "dist-1");
  const secondDir = join(tmp, "dist-2");
  await exportOnce(firstDir, contentDir, {
    asOf: "2026-10-25T16:00:00+08:00",
    tip,
    archive,
  });
  await exportOnce(secondDir, contentDir, {
    asOf: "2026-10-25T19:25:00+08:00",
    tip,
    archive,
  });

  const latest = JSON.parse(readFileSync(join(firstDir, "api", "v1", "daily", "latest.json"), "utf8"));
  const tipFile = JSON.parse(readFileSync(join(firstDir, "api", "v1", "daily", "2026-10-24.json"), "utf8"));
  const archiveFile = JSON.parse(readFileSync(join(firstDir, "api", "v1", "daily", "2026-10-25.json"), "utf8"));
  const laterLatest = JSON.parse(readFileSync(join(secondDir, "api", "v1", "daily", "latest.json"), "utf8"));
  const index = JSON.parse(readFileSync(join(firstDir, "api", "v1", "index.json"), "utf8"));
  const files = (index.files || []).map((row) => row.path);

  assert.equal(latest.key, "2026-10-24", "latest.json stays tip-only");
  assert.equal(latest.data_as_of, "2026-10-25T16:00:00+08:00", "latest.json keeps build-time asOf");
  assert.equal(laterLatest.data_as_of, "2026-10-25T19:25:00+08:00", "later latest.json may refresh asOf");
  assert.equal(latest.metrics.sourcesCount, 14);
  assert.equal(latest.metrics.firstPartyEvents, 12);
  assert.equal(latest.flashes.length, 20);

  assert.equal(tipFile.key, "2026-10-24");
  assert.equal(tipFile.data_as_of, "2026-10-24T16:20:00.000Z", "tip key freezes on generatedAt");
  assert.equal(archiveFile.key, "2026-10-25");
  assert.equal(archiveFile.data_as_of, "2026-10-25T11:06:10+08:00", "archive key prefers embedded data_as_of");
  assert.equal(archiveFile.metrics.sourcesCount, 11, "archive day may be below floor");

  assert.equal(
    sha256(join(firstDir, "api", "v1", "daily", "2026-10-24.json")),
    sha256(join(secondDir, "api", "v1", "daily", "2026-10-24.json")),
    "tip calendar key sha stays frozen across deploys",
  );
  assert.equal(
    sha256(join(firstDir, "api", "v1", "daily", "2026-10-25.json")),
    sha256(join(secondDir, "api", "v1", "daily", "2026-10-25.json")),
    "archive calendar key sha stays frozen across deploys",
  );
  assert.notEqual(
    sha256(join(firstDir, "api", "v1", "daily", "latest.json")),
    sha256(join(secondDir, "api", "v1", "daily", "latest.json")),
    "latest.json may change asOf between deploys",
  );

  const rootDaily = JSON.parse(readFileSync(join(firstDir, "api", "v1", "daily.json"), "utf8"));
  assert.equal(rootDaily.key, "2026-10-24", "api/v1/daily.json mirrors tip latest");
  assert.equal(rootDaily.data_as_of, latest.data_as_of);
  assert.ok(files.includes("api/v1/daily.json"), "index lists api/v1/daily.json");
  assert.ok(files.includes("api/v1/daily/latest.json"));
  assert.ok(files.includes("api/v1/daily/2026-10-24.json"));
  assert.ok(files.includes("api/v1/daily/2026-10-25.json"));
  assert.equal(files.filter((path) => path === "api/v1/daily/2026-10-24.json").length, 1);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log("static_export.daily.test.mjs ok");
