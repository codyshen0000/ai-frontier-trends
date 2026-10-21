import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { groupByEvent } from "./groupByEvent.mjs";
import { findDedupeIssues } from "./dedupe.mjs";

const SYN = "SYNTHETIC";

function card({
  key,
  eventId,
  source,
  url,
  selected = true,
  at = "2026-10-19T08:00:00.000Z",
  id,
}) {
  return {
    key,
    anchorAt: at,
    item: {
      id: id || `sha256:synthetic-${key}`,
      title: `${SYN} · ${key}`,
      summary: `${SYN} 摘要`,
      reason: null,
      source: { name: source },
      publishedAt: at,
      timelineAt: at,
      category: "model",
      tags: [],
      selected,
      channel: "news",
      x: null,
      originalUrl: url,
      storyPublicId: eventId,
    },
    group: null,
  };
}

describe("groupByEvent SYNTHETIC merge cases", () => {
  it("collapses two cards of the same event_id into one with 另 N 家 fields", () => {
    const cards = [
      card({
        key: "alpha-decoder",
        eventId: "2026-10-19-synthetic-merge-alpha",
        source: "公开实验室",
        url: "https://example.invalid/synthetic/alpha-lab",
        at: "2026-10-19T08:00:00.000Z",
      }),
      card({
        key: "alpha-qbit",
        eventId: "2026-10-19-synthetic-merge-alpha",
        source: "复现笔记",
        url: "https://example.invalid/synthetic/alpha-notes",
        selected: false,
        at: "2026-10-19T07:00:00.000Z",
      }),
    ];
    const out = groupByEvent(cards);
    assert.equal(out.length, 1);
    assert.equal(out[0].item.storyPublicId, "2026-10-19-synthetic-merge-alpha");
    assert.equal(out[0].item.sourceCount, 2);
    assert.deepEqual(out[0].item.sourceNames.sort(), ["公开实验室", "复现笔记"].sort());
    assert.equal(out[0].group.additionalSourceCount, 1);
    assert.equal(out[0].group.reportCount, 2);
    assert.equal(out[0].item.source.name, "公开实验室");
    assert.equal(out[0].item.participants.length, 2);
  });

  it("folds a merged_into alias into the surviving event (B2-07)", () => {
    const cards = [
      card({
        key: "alpha",
        eventId: "2026-10-19-synthetic-merge-alpha",
        source: "公开实验室",
        url: "https://example.invalid/synthetic/alpha",
      }),
      card({
        key: "alias",
        eventId: "2026-10-19-synthetic-merge-alias",
        source: "周刊源",
        url: "https://example.invalid/synthetic/alias",
        at: "2026-10-19T06:00:00.000Z",
      }),
    ];
    const out = groupByEvent(cards, {
      redirects: [
        { from: "2026-10-19-synthetic-merge-alias", to: "2026-10-19-synthetic-merge-alpha", via: "merged_into" },
      ],
    });
    assert.equal(out.length, 1);
    assert.equal(out[0].item.storyPublicId, "2026-10-19-synthetic-merge-alpha");
    assert.equal(out[0].group.additionalSourceCount, 1);
    assert.equal(out.some((c) => c.item.storyPublicId === "2026-10-19-synthetic-merge-alias"), false);
  });

  it("drops a duplicate normalized URL across leftover cards", () => {
    const cards = [
      card({
        key: "one",
        eventId: null,
        source: "公开实验室",
        url: "https://www.example.invalid/synthetic/same/?utm_source=x",
      }),
      card({
        key: "two",
        eventId: null,
        source: "公开实验室",
        url: "https://example.invalid/synthetic/same",
        id: "sha256:synthetic-two",
      }),
    ];
    cards[0].item.storyPublicId = undefined;
    cards[1].item.storyPublicId = undefined;
    const out = groupByEvent(cards);
    assert.equal(out.length, 1);
  });

  it("hides 另 N 家 when N<1 (single source)", () => {
    const out = groupByEvent([
      card({
        key: "solo",
        eventId: "2026-10-19-synthetic-merge-solo",
        source: "公开实验室",
        url: "https://example.invalid/synthetic/solo",
      }),
    ]);
    assert.equal(out[0].group.additionalSourceCount, 0);
    assert.equal(out[0].item.sourceCount, 1);
  });

  it("enriches sourceCount from event.timeline members when B1 passes the bundle", () => {
    const cards = [
      card({
        key: "rep",
        eventId: "2026-10-19-synthetic-merge-members",
        source: "公开实验室",
        url: "https://example.invalid/synthetic/members-lab",
        id: "sha256:synthetic-rep",
      }),
    ];
    const out = groupByEvent(cards, {
      events: [
        {
          publicId: "2026-10-19-synthetic-merge-members",
          title: `${SYN} members`,
          timeline: [
            {
              id: "sha256:synthetic-rep",
              source: { name: "公开实验室", kind: "editorial" },
              publishedAt: "2026-10-19T08:00:00.000Z",
            },
            {
              id: "sha256:synthetic-other",
              source: { name: "复现笔记", kind: "editorial" },
              publishedAt: "2026-10-19T07:00:00.000Z",
            },
            {
              id: "sha256:synthetic-third",
              source: { name: "周刊源", kind: "signal" },
              publishedAt: "2026-10-19T06:00:00.000Z",
            },
          ],
        },
      ],
    });
    assert.equal(out[0].item.sourceCount, 3);
    assert.equal(out[0].group.additionalSourceCount, 2);
    assert.deepEqual(out[0].item.sourceNames.sort(), ["公开实验室", "复现笔记", "周刊源"].sort());
    assert.equal(out[0].item.participants.filter((p) => p.kind === "editorial").length, 2);
  });

  it("keeps same-origin iconUrl/iconSrcSet when grouping again", () => {
    const first = card({
      key: "icon-a",
      eventId: "2026-10-19-synthetic-merge-icon",
      source: "The Decoder",
      url: "https://example.invalid/synthetic/icon",
    });
    first.item.participants = [
      {
        name: "The Decoder",
        kind: "editorial",
        iconUrl: "assets/avatars/the-decoder-com-32.webp",
        iconSrcSet: "assets/avatars/the-decoder-com-32.webp 32w, assets/avatars/the-decoder-com-64.webp 64w",
      },
    ];
    const out = groupByEvent([first]);
    assert.equal(out[0].item.participants[0].iconUrl, "assets/avatars/the-decoder-com-32.webp");
    assert.match(out[0].item.participants[0].iconSrcSet, /64w/);
  });

  it("leaves unique events unique and reports 0 duplicates after grouping", () => {
    const cards = [
      card({
        key: "a",
        eventId: "2026-10-19-synthetic-merge-a",
        source: "公开实验室",
        url: "https://example.invalid/synthetic/a",
      }),
      card({
        key: "b",
        eventId: "2026-10-19-synthetic-merge-b",
        source: "复现笔记",
        url: "https://example.invalid/synthetic/b",
        at: "2026-10-19T05:00:00.000Z",
      }),
    ];
    const out = groupByEvent(cards);
    const scan = findDedupeIssues({ timeline: { cards: out }, hot: { entries: [] }, redirects: [] });
    assert.equal(out.length, 2);
    assert.equal(scan.ok, true, scan.issues.join("\n"));
  });
});
