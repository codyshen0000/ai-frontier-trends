import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  DEFAULT_ENGINE_DIR,
  EngineDataError,
  FORBIDDEN_KEY_RE,
  isAcceptedCoverClass,
  isOfficialDiagramClass,
  loadEngineData,
  loadEngineForBuild,
  resolveEngineDir,
} from "./loader.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const SAMPLE = join(here, "__samples__", "v1");
const FIXTURE_IDS = ["flash-api", "mm-816b", "edge-nb", "agent-2", "api-price", "longctx-eval"];

function tmpCopy() {
  const dir = mkdtempSync(join(tmpdir(), "b0-engine-"));
  cpSync(SAMPLE, dir, { recursive: true });
  return dir;
}

function collectKeys(value, keys = new Set()) {
  if (value === null || typeof value !== "object") return keys;
  if (Array.isArray(value)) {
    for (const entry of value) collectKeys(entry, keys);
    return keys;
  }
  for (const [key, child] of Object.entries(value)) {
    keys.add(key);
    collectKeys(child, keys);
  }
  return keys;
}

describe("cover class aliases", () => {
  it("accepts official_diagram and official_explainer as the same class", () => {
    assert.equal(isOfficialDiagramClass("official_diagram"), true);
    assert.equal(isOfficialDiagramClass("official_explainer"), true);
    assert.equal(isAcceptedCoverClass("official_diagram"), true);
    assert.equal(isAcceptedCoverClass("official_explainer"), true);
    assert.equal(isAcceptedCoverClass("model_sample"), true);
    assert.equal(isAcceptedCoverClass("paper_figure"), true);
    assert.equal(isAcceptedCoverClass("product_screenshot"), true);
    assert.equal(isAcceptedCoverClass("og"), false);
  });
});

describe("resolveEngineDir", () => {
  it("defaults to data/engine/v1 under the repo root", () => {
    const dir = resolveEngineDir({});
    assert.equal(dir.endsWith(join("data", "engine", "v1")), true);
    assert.equal(DEFAULT_ENGINE_DIR, "data/engine/v1");
  });

  it("honours FT_ENGINE_DIR, including absolute paths", () => {
    assert.equal(resolveEngineDir({ FT_ENGINE_DIR: "/tmp/engine-v1" }), "/tmp/engine-v1");
    const relative = resolveEngineDir({ FT_ENGINE_DIR: "scripts/engine/__samples__/v1" });
    assert.equal(relative.endsWith(join("scripts", "engine", "__samples__", "v1")), true);
  });
});

describe("loadEngineData(synthetic sample)", () => {
  it("loads the marked-synthetic dump and resolves data_as_of + built_at", () => {
    const bundle = loadEngineData({ dir: SAMPLE });
    assert.equal(bundle.meta.mode, "synthetic");
    assert.equal(bundle.data_as_of, "2026-10-19T15:24:00+08:00");
    assert.equal(bundle.built_at, "2026-10-19T08:00:00.000Z");
    assert.equal(bundle.hot.entries.length, 1);
    assert.equal(bundle.hot.entries[0].cover.valueClass, "official_diagram");
    assert.equal(bundle.daily?.key, "2026-10-19");
    assert.equal(bundle.feedItems.length, 1);
    assert.equal(bundle.events[0].publicId, "2026-10-19-synthetic-alpha");
    assert.equal(bundle.redirects[0].from, "2026-10-19-synthetic-alias");
    assert.equal(bundle.timeline?.cards[0].item.storyPublicId, "2026-10-19-synthetic-alpha");
    const serialized = JSON.stringify(bundle);
    for (const id of FIXTURE_IDS) {
      assert.equal(serialized.includes(id), false, `synthetic sample leaked fixture id ${id}`);
    }
  });

  it("exposes no score key anywhere in the bundle", () => {
    const bundle = loadEngineData({ dir: SAMPLE });
    for (const key of collectKeys(bundle)) {
      assert.equal(FORBIDDEN_KEY_RE.test(key), false, `forbidden key ${key}`);
      assert.notEqual(key.toLowerCase(), "score");
    }
  });

  it("accepts generated_at as the built_at fallback", () => {
    const dir = tmpCopy();
    try {
      const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8"));
      delete meta.built_at;
      meta.generated_at = "2026-10-19T09:00:00.000Z";
      writeFileSync(join(dir, "meta.json"), `${JSON.stringify(meta, null, 2)}\n`);
      const bundle = loadEngineData({ dir });
      assert.equal(bundle.built_at, "2026-10-19T09:00:00.000Z");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("accepts official_explainer as a cover class alias", () => {
    const dir = tmpCopy();
    try {
      const hot = JSON.parse(readFileSync(join(dir, "hot.json"), "utf8"));
      hot.entries[0].cover.valueClass = "official_explainer";
      writeFileSync(join(dir, "hot.json"), `${JSON.stringify(hot, null, 2)}\n`);
      const bundle = loadEngineData({ dir });
      assert.equal(bundle.hot.entries[0].cover.valueClass, "official_explainer");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("EngineDataError fallback contract", () => {
  it("throws a typed error when the directory is missing", () => {
    assert.throws(
      () => loadEngineData({ dir: join(SAMPLE, "does-not-exist") }),
      (err) => err instanceof EngineDataError && err.name === "EngineDataError" && err.code === "MISSING_DIR",
    );
  });

  it("throws when meta.json is missing", () => {
    const dir = mkdtempSync(join(tmpdir(), "b0-empty-"));
    try {
      assert.throws(
        () => loadEngineData({ dir }),
        (err) => err instanceof EngineDataError && err.code === "MISSING_META",
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("throws INVALID_JSON on broken files", () => {
    const dir = tmpCopy();
    try {
      writeFileSync(join(dir, "hot.json"), "{not json");
      assert.throws(
        () => loadEngineData({ dir }),
        (err) => err instanceof EngineDataError && err.code === "INVALID_JSON",
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("rejects a score key so the build can fall back", () => {
    const dir = tmpCopy();
    try {
      const event = JSON.parse(readFileSync(join(dir, "events", "2026-10-19-synthetic-alpha.json"), "utf8"));
      event.score = 88;
      writeFileSync(join(dir, "events", "2026-10-19-synthetic-alpha.json"), `${JSON.stringify(event)}\n`);
      assert.throws(
        () => loadEngineData({ dir }),
        (err) => err instanceof EngineDataError && err.code === "FORBIDDEN_KEY" && /score/.test(err.message),
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("rejects score_avg / attention / gate_a keys", () => {
    for (const key of ["score_avg", "attention_score", "attention", "gate_a"]) {
      const dir = tmpCopy();
      try {
        const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8"));
        meta[key] = 1;
        writeFileSync(join(dir, "meta.json"), `${JSON.stringify(meta)}\n`);
        assert.throws(
          () => loadEngineData({ dir }),
          (err) => err instanceof EngineDataError && err.code === "FORBIDDEN_KEY",
          key,
        );
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it("rejects an unknown cover class", () => {
    const dir = tmpCopy();
    try {
      const hot = JSON.parse(readFileSync(join(dir, "hot.json"), "utf8"));
      hot.entries[0].cover.valueClass = "og";
      writeFileSync(join(dir, "hot.json"), `${JSON.stringify(hot)}\n`);
      assert.throws(
        () => loadEngineData({ dir }),
        (err) => err instanceof EngineDataError && err.code === "INVALID_COVER_CLASS",
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("loads via FT_ENGINE_DIR", () => {
    const bundle = loadEngineData({ env: { FT_ENGINE_DIR: SAMPLE } });
    assert.equal(bundle.dir, SAMPLE);
  });

  it("loadEngineForBuild catches EngineDataError for the build fallback hook", () => {
    const miss = loadEngineForBuild({ dir: join(SAMPLE, "does-not-exist") });
    assert.equal(miss.ok, false);
    assert.equal(miss.engine, null);
    assert.equal(miss.error instanceof EngineDataError, true);
    assert.equal(miss.error.code, "MISSING_DIR");
    const hit = loadEngineForBuild({ dir: SAMPLE });
    assert.equal(hit.ok, true);
    assert.equal(hit.engine.meta.mode, "synthetic");
    assert.equal(hit.error, null);
  });
});

describe("site-data.ts public shapes", () => {
  it("does not declare a score field", () => {
    const source = readFileSync(join(here, "site-data.ts"), "utf8");
    const stripped = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    assert.doesNotMatch(stripped, /^\s*score\s*[?:]/m);
    assert.doesNotMatch(stripped, /\bscore_avg\b/);
    assert.match(source, /official_diagram/);
    assert.match(source, /official_explainer/);
    assert.match(source, /data_as_of/);
    assert.match(source, /built_at/);
  });
});
