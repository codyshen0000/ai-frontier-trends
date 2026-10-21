import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildSearchIndex } from "./static_export.mjs";

function tokenize(text) {
  const s = String(text || "").toLowerCase();
  const tokens = [];
  for (const run of s.match(/[\u4e00-\u9fff]+/g) || []) {
    if (run.length === 1) tokens.push(run);
    else {
      for (let i = 0; i < run.length - 1; i++) tokens.push(run.slice(i, i + 2));
    }
  }
  for (const word of s.replace(/[\u4e00-\u9fff]/g, " ").split(/[^a-z0-9]+/)) {
    if (word) tokens.push(word);
  }
  return tokens;
}

function scoreDoc(doc, tokens) {
  if (!tokens.length) return 0;
  const title = tokenize(doc.title);
  const summary = tokenize(doc.summary);
  const source = tokenize(doc.source);
  const category = tokenize(doc.category || "");
  let titleHits = 0;
  let summaryHits = 0;
  let sourceHits = 0;
  let categoryHits = 0;
  for (const tok of tokens) {
    if (title.includes(tok)) titleHits += 1;
    else if (summary.includes(tok)) summaryHits += 1;
    else if (source.includes(tok)) sourceHits += 1;
    else if (category.includes(tok)) categoryHits += 1;
  }
  if (titleHits === 0 && summaryHits === 0 && sourceHits === 0 && categoryHits === 0) return 0;
  return titleHits * 3 + summaryHits + sourceHits + categoryHits;
}

function searchHits(docs, q) {
  const tokens = tokenize(q);
  return docs.filter((doc) => scoreDoc(doc, tokens) > 0);
}

const tmp = mkdtempSync(join(tmpdir(), "search-index-"));
try {
  mkdirSync(join(tmp, "l2-covers"), { recursive: true });
  writeFileSync(join(tmp, "l2-covers", "articles.json"), `${JSON.stringify({
    hot: [
      {
        id: "same-handle-a",
        publications: [
          {
            url: "https://x.com/paperbot/status/1111111111111111111",
            sourceName: "X",
            title: "First paper from paperbot",
            summary: "Alpha paper summary.",
          },
          {
            url: "https://x.com/paperbot/status/2222222222222222222",
            sourceName: "X",
            title: "Second paper from paperbot",
            summary: "Beta paper summary.",
          },
          {
            url: "https://www.xiaohongshu.com/explore/6ad132870000000018007ca1",
            sourceName: "小红书",
            title: "PR-OPD：事后技能对齐隐藏状态",
            summary: "Hidden-state skill alignment note.",
          },
        ],
      },
    ],
  }, null, 2)}\n`);

  const engineDir = join(tmp, "engine");
  mkdirSync(join(engineDir, "feed"), { recursive: true });
  mkdirSync(join(engineDir, "events"), { recursive: true });
  writeFileSync(join(engineDir, "feed", "selected.json"), `${JSON.stringify({
    items: [
      {
        guid: "sha256:feeditem1",
        title: "Engine selected item",
        summary: "From selected feed.",
        originalUrl: "https://example-allowed.test/selected",
        pubDate: "2026-10-20T12:00:00.000Z",
        sourceName: "Engine Feed",
        category: "paper",
      },
    ],
  })}\n`);
  writeFileSync(join(engineDir, "events", "2026-10-21-demo.json"), `${JSON.stringify({
    publicId: "2026-10-21-demo",
    title: "Engine event demo",
    summary: "From events file.",
    latestAt: "2026-10-20T20:00:00.000Z",
    developments: [{
      representative: {
        summary: "From events file.",
        source: { name: "Tech Desk" },
        originalUrl: "https://techcrunch.com/2026/10/20/demo",
      },
    }],
  })}\n`);
  writeFileSync(join(engineDir, "hot.json"), `${JSON.stringify({
    computedAt: "2026-10-21T05:20:00.000Z",
    entries: [
      {
        story: { publicId: "2026-10-21-hot-story", title: "Engine hot story" },
        summary: "From hot.json.",
        sourceNames: ["Desk A", "Desk B"],
      },
    ],
  })}\n`);

  const index = buildSearchIndex({
    contentDir: tmp,
    builtAt: "2026-10-21T12:00:00Z",
    dataAsOf: "2026-10-21T19:25:52+08:00",
    engineDir,
  });

  const xhs = index.docs.filter((d) => d.source === "小红书");
  assert.equal(xhs.length, 1, "indexes xiaohongshu pubs");
  assert.equal(xhs[0].id, "xhs-6ad132870000000018007ca1");
  assert.match(xhs[0].title, /PR-OPD/);
  assert.equal(xhs[0].url, "https://www.xiaohongshu.com/explore/6ad132870000000018007ca1");

  const xDocs = index.docs.filter((d) => d.id.startsWith("x-"));
  assert.equal(xDocs.length, 2, "keeps two papers from the same X handle");
  assert.deepEqual(xDocs.map((d) => d.id).sort(), [
    "x-status-1111111111111111111",
    "x-status-2222222222222222222",
  ]);
  assert.ok(xDocs.every((d) => d.source === "@paperbot"));

  assert.ok(index.docs.some((d) => d.id === "sha256:feeditem1"), "folds selected.json");
  assert.ok(index.docs.some((d) => d.id === "2026-10-21-demo"), "folds events/*.json");
  assert.ok(index.docs.some((d) => d.id === "2026-10-21-hot-story"), "folds hot.json");

  const xhsHits = searchHits(index.docs, "小红书");
  assert.ok(xhsHits.some((d) => d.source === "小红书"), "query 小红书 hits source field");
  assert.ok(searchHits(index.docs, "opd").some((d) => /PR-OPD/i.test(d.title)), "query opd includes PR-OPD");

  const branded = buildSearchIndex({
    contentDir: tmp,
    builtAt: "t",
    dataAsOf: "d",
    engineDir: null,
  });
  assert.equal(branded.docs.filter((d) => /AIHOT|MyHOT/i.test(JSON.stringify(d))).length, 0);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log("static_export.search.test.mjs ok");
