import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { verify as verifyHeat } from "./b2-hot-recompute.mjs";
import { verify as verifyIds } from "./b2-event-id.mjs";
import { verify as verifyRedirects } from "./b2-redirects.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT_1700 = join(here, "..", "engine", "__samples__", "out-1700");
const SAMPLE = join(here, "..", "engine", "__samples__", "v1");

describe("standalone B2 verify gates", () => {
  it("skips when the engine dir has no hot.json / meta.json (fixture builds)", async () => {
    const missing = join(tmpdir(), "b2-no-engine-does-not-exist");
    const heat = await verifyHeat({ engineDir: missing });
    const ids = await verifyIds({ engineDir: missing });
    const redir = await verifyRedirects({ engineDir: missing });
    assert.equal(heat.ok, true, heat.message);
    assert.equal(heat.skipped, true);
    assert.equal(ids.ok, true, ids.message);
    assert.equal(ids.skipped, true);
    assert.equal(redir.ok, true, redir.message);
    assert.equal(redir.skipped, true);
  });

  it("b2-hot-recompute passes the real out-1700 snapshot", async () => {
    const result = await verifyHeat({ engineDir: OUT_1700 });
    assert.equal(result.ok, true, result.message);
    assert.match(result.message, /5\.5|1 hot\.json|match recompute/);
  });

  it("b2-event-id passes out-1700 (one event, two item URLs)", async () => {
    const result = await verifyIds({ engineDir: OUT_1700 });
    assert.equal(result.ok, true, result.message);
  });

  it("b2-redirects self-checks out-1700 empty list and the synthetic alias sample", async () => {
    const empty = await verifyRedirects({ engineDir: OUT_1700 });
    assert.equal(empty.ok, true, empty.message);
    const sample = await verifyRedirects({ engineDir: SAMPLE });
    assert.equal(sample.ok, true, sample.message);
    assert.match(sample.message, /1 redirect page/);
  });

  it("b2-event-id collapses www vs apex search URLs of the same item", async () => {
    const dir = mkdtempSync(join(tmpdir(), "b2-search-alias-"));
    try {
      mkdirSync(join(dir, "search"), { recursive: true });
      writeFileSync(
        join(dir, "meta.json"),
        JSON.stringify({ data_as_of: "2026-10-23T12:00:00+08:00", generated_at: "2026-10-23T04:00:00.000Z" }),
      );
      writeFileSync(
        join(dir, "search", "source.json"),
        JSON.stringify({
          generatedAt: "2026-10-23T04:00:00.000Z",
          docs: [
            {
              id: "sha256:aaa",
              kind: "item",
              title: "Patch the Planet",
              selected: false,
              eventPublicId: "2026-10-21-php2shell-wiz-rce",
              originalUrl: "https://latent.space/p/ainews-openais-patch-the-planet-program/",
            },
            {
              id: "sha256:bbb",
              kind: "item",
              title: "Patch the Planet www",
              selected: false,
              eventPublicId: "2026-10-21-php2shell-wiz-rce",
              originalUrl: "https://www.latent.space/p/ainews-openais-patch-the-planet-program",
            },
          ],
        }),
      );
      const result = await verifyIds({ engineDir: dir });
      assert.equal(result.ok, true, result.message);
      assert.match(result.message, /URL aliases collapsed|duplicates 0/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("b2-event-id fails when two hot entries share an event_id", async () => {
    const dir = mkdtempSync(join(tmpdir(), "b2-dup-"));
    try {
      mkdirSync(join(dir, "events"), { recursive: true });
      mkdirSync(join(dir, "timeline"), { recursive: true });
      writeFileSync(
        join(dir, "meta.json"),
        JSON.stringify({ data_as_of: "2026-10-19T15:24:00+08:00", generated_at: "2026-10-19T08:00:00.000Z" }),
      );
      writeFileSync(
        join(dir, "hot.json"),
        JSON.stringify({
          computedAt: "2026-10-19T08:00:00.000Z",
          windowHours: 48,
          entries: [
            { rank: 1, story: { publicId: "2026-10-19-synthetic-dup", title: "SYNTHETIC" }, heat: 1, sourceCount: 2, sourceNames: ["A"], participants: [], spark: [] },
            { rank: 2, story: { publicId: "2026-10-19-synthetic-dup", title: "SYNTHETIC" }, heat: 1, sourceCount: 2, sourceNames: ["B"], participants: [], spark: [] },
          ],
        }),
      );
      writeFileSync(
        join(dir, "events", "2026-10-19-synthetic-dup.json"),
        JSON.stringify({ publicId: "2026-10-19-synthetic-dup", title: "SYNTHETIC", status: "active" }),
      );
      const result = await verifyIds({ engineDir: dir });
      assert.equal(result.ok, false);
      assert.match(result.message, /duplicate event_id/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
