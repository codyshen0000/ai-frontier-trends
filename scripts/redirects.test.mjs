import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { loadEngineData } from "./engine/loader.mjs";
import { SITE_BASE, canonicalHref, writeRedirects } from "./redirects.mjs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SAMPLE = join(here, "engine", "__samples__", "v1");
const OUT_1700 = join(here, "engine", "__samples__", "out-1700");

describe("writeRedirects SYNTHETIC pages", () => {
  it("writes meta refresh + canonical under /ai-frontier-trends/events/<to>/", () => {
    const dist = mkdtempSync(join(tmpdir(), "b2-redir-"));
    try {
      const result = writeRedirects(dist, {
        redirects: [
          { from: "2026-10-19-synthetic-alias", to: "2026-10-19-synthetic-alpha", via: "merged_into" },
        ],
      });
      assert.equal(result.written, 1);
      const html = readFileSync(join(dist, "events", "2026-10-19-synthetic-alias", "index.html"), "utf8");
      assert.match(html, /http-equiv="refresh"/);
      assert.match(html, /url=\.\.\/2026-10-19-synthetic-alpha\//);
      assert.match(html, /rel="canonical"/);
      assert.equal(canonicalHref("2026-10-19-synthetic-alpha"), "/ai-frontier-trends/events/2026-10-19-synthetic-alpha/");
      assert.match(html, /href="\/ai-frontier-trends\/events\/2026-10-19-synthetic-alpha\/"/);
      assert.match(html, /data-ft-redirect="2026-10-19-synthetic-alias"/);
      assert.doesNotMatch(html, /example\.com/);
      assert.doesNotMatch(html, /实时|引擎已 1:1|aihot/i);
    } finally {
      rmSync(dist, { recursive: true, force: true });
    }
  });

  it("resolves A→B→C chains to the final event", () => {
    const dist = mkdtempSync(join(tmpdir(), "b2-redir-chain-"));
    try {
      writeRedirects(dist, [
        { from: "2026-10-19-synthetic-a", to: "2026-10-19-synthetic-b" },
        { from: "2026-10-19-synthetic-b", to: "2026-10-19-synthetic-c" },
      ]);
      const htmlA = readFileSync(join(dist, "events", "2026-10-19-synthetic-a", "index.html"), "utf8");
      const htmlB = readFileSync(join(dist, "events", "2026-10-19-synthetic-b", "index.html"), "utf8");
      assert.match(htmlA, /synthetic-c/);
      assert.match(htmlB, /synthetic-c/);
      assert.match(htmlA, /\/ai-frontier-trends\/events\/2026-10-19-synthetic-c\//);
    } finally {
      rmSync(dist, { recursive: true, force: true });
    }
  });

  it("skips unsafe ids and writes nothing for an empty list", () => {
    const dist = mkdtempSync(join(tmpdir(), "b2-redir-empty-"));
    mkdirSync(join(dist, "events"), { recursive: true });
    try {
      const before = readdirSync(dist, { recursive: true }).sort();
      assert.deepEqual(writeRedirects(dist, { redirects: [] }), { written: 0, paths: [], skipped: [] });
      assert.deepEqual(readdirSync(dist, { recursive: true }).sort(), before);
      const skipped = writeRedirects(dist, { redirects: [{ from: "../etc", to: "2026-10-19-synthetic-alpha" }] });
      assert.equal(skipped.written, 0);
      assert.ok(skipped.skipped.length);
    } finally {
      rmSync(dist, { recursive: true, force: true });
    }
  });

  it("accepts the B0 synthetic sample bundle (one alias)", () => {
    const bundle = loadEngineData({ dir: SAMPLE });
    const dist = mkdtempSync(join(tmpdir(), "b2-redir-sample-"));
    try {
      const result = writeRedirects(dist, bundle);
      assert.equal(result.written, 1);
      const html = readFileSync(result.paths[0], "utf8");
      assert.match(html, /rel="canonical"/);
      assert.match(html, new RegExp(SITE_BASE.replaceAll("/", "\\/")));
    } finally {
      rmSync(dist, { recursive: true, force: true });
    }
  });

  it("writes 0 pages for the real out-1700 snapshot (redirects currently empty)", () => {
    const bundle = loadEngineData({ dir: OUT_1700 });
    assert.equal(bundle.redirects.length, 0);
    const dist = mkdtempSync(join(tmpdir(), "b2-redir-1700-"));
    try {
      const result = writeRedirects(dist, bundle);
      assert.equal(result.written, 0);
    } finally {
      rmSync(dist, { recursive: true, force: true });
    }
  });
});
