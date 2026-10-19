import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { groupByEvent } from "./groupByEvent.mjs";
import { writeRedirects } from "../redirects.mjs";

describe("B0 stubs replaced by B2 implementations", () => {
  it("groupByEvent is no longer an identity: duplicate event_id collapses", () => {
    const cards = [
      {
        key: "a",
        anchorAt: "2026-10-19T08:00:00.000Z",
        item: {
          id: "sha256:synthetic-a",
          title: "SYNTHETIC a",
          source: { name: "公开实验室" },
          publishedAt: "2026-10-19T08:00:00.000Z",
          timelineAt: "2026-10-19T08:00:00.000Z",
          selected: true,
          originalUrl: "https://example.invalid/synthetic/a",
          storyPublicId: "2026-10-19-synthetic-alpha",
        },
        group: null,
      },
      {
        key: "b",
        anchorAt: "2026-10-19T07:00:00.000Z",
        item: {
          id: "sha256:synthetic-b",
          title: "SYNTHETIC b",
          source: { name: "复现笔记" },
          publishedAt: "2026-10-19T07:00:00.000Z",
          timelineAt: "2026-10-19T07:00:00.000Z",
          selected: false,
          originalUrl: "https://example.invalid/synthetic/b",
          storyPublicId: "2026-10-19-synthetic-alpha",
        },
        group: null,
      },
    ];
    const out = groupByEvent(cards);
    assert.notEqual(out, cards);
    assert.equal(out.length, 1);
    assert.equal(out[0].group.additionalSourceCount, 1);
  });

  it("writeRedirects emits a page instead of no-op", () => {
    const dist = mkdtempSync(join(tmpdir(), "b2-stubs-redir-"));
    try {
      const result = writeRedirects(dist, {
        redirects: [{ from: "2026-10-19-synthetic-alias", to: "2026-10-19-synthetic-alpha" }],
      });
      assert.equal(result.written, 1);
      const html = readFileSync(join(dist, "events", "2026-10-19-synthetic-alias", "index.html"), "utf8");
      assert.match(html, /rel="canonical"/);
    } finally {
      rmSync(dist, { recursive: true, force: true });
    }
  });
});
