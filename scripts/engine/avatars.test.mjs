import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { candidateKeys, copyAvatarCache, publicIconFor, sourceKey } from "../avatar_icons.mjs";
import { collectSources } from "../avatars.mjs";
import { publicizeBundle, publicizeHotEntry } from "./publicize.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");

function tmpDir(prefix = "a6-avatars-") {
  return mkdtempSync(join(tmpdir(), prefix));
}

describe("A6 avatar keys and collectSources", () => {
  it("derives host keys and reads engine sources + hot participants", () => {
    const dir = tmpDir();
    try {
      writeFileSync(
        join(dir, "sources.json"),
        JSON.stringify({
          sources: [
            { sourceId: "rss-hf-blog", name: "Hugging Face Blog", homepage: "https://huggingface.co" },
            { sourceId: "rss-qbitai", name: "量子位", homepage: "https://www.qbitai.com" },
          ],
        }),
      );
      writeFileSync(
        join(dir, "hot.json"),
        JSON.stringify({
          entries: [
            {
              participants: [
                { name: "Hugging Face Blog", kind: "editorial" },
                { name: "The Decoder", kind: "editorial", homepage: "https://the-decoder.com" },
              ],
            },
          ],
        }),
      );
      const sources = collectSources({
        contentDir: join(root, "content"),
        engineDirs: [dir],
      });
      const keys = new Set(sources.map((row) => row.key));
      assert.equal(keys.has("huggingface-co"), true);
      assert.equal(keys.has("qbitai-com"), true);
      assert.equal(keys.has("the-decoder-com"), true);
      assert.equal(sourceKey("Hugging Face Blog"), "hugging-face-blog");
      assert.deepEqual(
        candidateKeys({ name: "量子位" }, new Map([["量子位", { homepage: "https://www.qbitai.com" }]])),
        ["qbitai-com"],
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("candidateKeys prefers homepage host over the display name", () => {
    const keys = candidateKeys(
      { name: "TechCrunch · AI", homepage: "https://techcrunch.com" },
      new Map(),
    );
    assert.equal(keys[0], "techcrunch-com");
    assert.equal(keys.includes("techcrunch-ai"), true);
  });
});

describe("A6 publicIconFor + publicize attach", () => {
  it("returns same-origin paths only when file32 exists on disk", () => {
    const dir = tmpDir();
    try {
      const manifest = { "huggingface-co": { file32: "huggingface-co-32.webp", file64: "huggingface-co-64.webp", width: 32, height: 32 } };
      writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest));
      const miss = publicIconFor(
        { name: "Hugging Face Blog", homepage: "https://huggingface.co" },
        { cacheDir: dir, manifest },
      );
      assert.equal(miss, null);
      writeFileSync(join(dir, "huggingface-co-32.webp"), "real");
      writeFileSync(join(dir, "huggingface-co-64.webp"), "real64");
      const hit = publicIconFor(
        { name: "Hugging Face Blog", homepage: "https://huggingface.co" },
        { cacheDir: dir, manifest },
      );
      assert.equal(hit.iconUrl, "assets/avatars/huggingface-co-32.webp");
      assert.equal(hit.iconSrcSet, "assets/avatars/huggingface-co-32.webp 32w, assets/avatars/huggingface-co-64.webp 64w");
      assert.equal(/^https?:/i.test(hit.iconUrl), false);
      assert.equal(publicIconFor({ name: "missing-source" }, { cacheDir: dir, manifest }), null);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("publicizeBundle fills iconUrl only for cached keys and strips remote icons", () => {
    const dir = tmpDir();
    try {
      writeFileSync(join(dir, "the-decoder-com-32.webp"), "ok");
      const manifest = { "the-decoder-com": { file32: "the-decoder-com-32.webp", width: 32, height: 32 } };
      const site = publicizeBundle(
        {
          data_as_of: "2026-10-20T00:00:00.000Z",
          built_at: "2026-10-20T00:00:00.000Z",
          sources: [{ sourceId: "rss-the-decoder", name: "The Decoder", homepage: "https://the-decoder.com" }],
          hot: {
            computedAt: "2026-10-20T00:00:00.000Z",
            windowHours: 48,
            entries: [
              {
                rank: 1,
                story: { publicId: "2026-10-19-minimax-m31-flash", title: "MiniMax" },
                heat: 10.9,
                trend: "down",
                trendPct: -16.2,
                badges: [],
                participantCount: 2,
                sourceCount: 2,
                sourceNames: ["The Decoder", "量子位"],
                participants: [
                  { name: "The Decoder", kind: "editorial" },
                  { name: "量子位", kind: "editorial", iconUrl: "https://cdn.example.invalid/q.png" },
                ],
                spark: [1, 2],
                summary: "摘要",
                latest: null,
                cover: null,
              },
            ],
          },
          hotStrip: [],
          daily: {
            kind: "daily",
            key: "2026-10-20",
            issueNumber: 2,
            title: "日报",
            generatedAt: "2026-10-20T00:00:00.000Z",
            lead: null,
            leadItemId: null,
            overview: null,
            highlights: [
              {
                itemId: null,
                title: "t",
                summary: null,
                sourceName: "The Decoder",
                sourceUrl: "https://the-decoder.com/x",
                sourceIconUrl: null,
                firstParty: false,
                publishedAt: null,
                available: true,
              },
            ],
            sections: [],
            flashes: [],
            cover: null,
            metrics: {},
            readingMinutes: 1,
            prev: null,
            next: null,
          },
          dailyIndex: [],
          dailies: [],
          feedItems: [],
          events: [],
          timeline: { filters: { channel: "all", category: null, tag: null }, cards: [], nextCursor: null, hot: [], dayCounts: {} },
          redirects: [],
        },
        { avatarDir: dir, avatarManifest: manifest },
      );
      const [decoder, qbit] = site.hot.entries[0].participants;
      assert.equal(decoder.iconUrl, "assets/avatars/the-decoder-com-32.webp");
      assert.equal(decoder.iconSrcSet.includes("32w"), true);
      assert.equal(qbit.iconUrl, undefined);
      assert.equal(qbit.iconSrcSet, undefined);
      assert.equal(site.daily.highlights[0].sourceIconUrl, "assets/avatars/the-decoder-com-32.webp");
      const text = JSON.stringify(site);
      assert.equal(/src="http|iconUrl":"http/i.test(text), false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("copyAvatarCache is offline and copies webp + manifest", () => {
    const cache = tmpDir("a6-cache-");
    const destRoot = tmpDir("a6-dest-");
    try {
      writeFileSync(join(cache, "manifest.json"), "{}\n");
      writeFileSync(join(cache, "huggingface-co-32.webp"), "x");
      const { count } = copyAvatarCache(destRoot, cache);
      assert.equal(count, 1);
      assert.equal(publicIconFor({ name: "nope" }, { cacheDir: cache, manifest: {} }), null);
    } finally {
      rmSync(cache, { recursive: true, force: true });
      rmSync(destRoot, { recursive: true, force: true });
    }
  });

  it("publicizeHotEntry still drops remote covers (avatars do not reopen that path)", () => {
    const entry = publicizeHotEntry({
      rank: 1,
      story: { publicId: "2026-10-19-synthetic-alpha", title: "SYNTHETIC" },
      heat: 4,
      trend: "flat",
      trendPct: 0,
      badges: [],
      participantCount: 1,
      sourceCount: 1,
      sourceNames: ["公开实验室"],
      participants: [{ name: "公开实验室", kind: "editorial" }],
      spark: [1, 2],
      summary: "摘要",
      latest: "进展",
      cover: { url: "https://cdn.example.com/x.png", width: 1200, height: 800, alt: "x", valueClass: "model_sample" },
    });
    assert.equal(entry.cover, null);
  });
});
