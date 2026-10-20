import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { cardHref, pageHref, siteHref } from "../mit-static/src/client/site-href.mjs";
import { writeTimelinePages } from "../static_export.mjs";

describe("pageHref directory URLs", () => {
  it("with base ./ does not end with .html and resolves like ./hot/", () => {
    for (const name of ["hot", "daily", "search", "starred", "more", "weekly"]) {
      const href = pageHref("./", name);
      assert.equal(href.endsWith(".html"), false, `${name} must not be a .html fallback`);
      assert.doesNotMatch(href, /\.html(?:[?#]|$)/);
      assert.equal(href, `./${name}/`);
    }
    assert.equal(pageHref("./", "index"), "./");
    assert.equal(pageHref("", "hot"), "./hot/");
    assert.equal(pageHref("../", "search"), "../search/");
  });

  it("siteHref rewrites leftover hot.html#s-… to a pretty directory", () => {
    assert.equal(siteHref("./", "hot.html#s-sha256:abc"), "./hot/#s-sha256:abc");
    assert.equal(siteHref("../", "hot.html#s-sha256:abc"), "../hot/#s-sha256:abc");
    assert.equal(siteHref("./", "https://the-decoder.com/x"), "https://the-decoder.com/x");
  });

  it("cardHref prefers originalUrl and never emits hot.html", () => {
    const href = cardHref("./", {
      id: "sha256:abc",
      url: "hot.html#s-sha256:abc",
      originalUrl: "https://the-decoder.com/kling-ai-drops-version-4-0/",
    });
    assert.equal(href, "https://the-decoder.com/kling-ai-drops-version-4-0/");
    const fallback = cardHref("./", { id: "sha256:abc", url: "hot.html#s-sha256:abc" });
    assert.equal(fallback, "./hot/#s-sha256:abc");
    assert.doesNotMatch(fallback, /\.html/);
    const bare = cardHref("./", { id: "sha256:abc" });
    assert.equal(bare, "./hot/#s-sha256:abc");
  });
});

describe("writeTimelinePages card urls", () => {
  it("writes originalUrl, not hot.html#s- fallbacks", () => {
    const dir = mkdtempSync(join(tmpdir(), "tl-url-"));
    try {
      writeTimelinePages(
        dir,
        [
          {
            key: "k1",
            anchorAt: "2026-10-19T17:36:26.000Z",
            item: {
              id: "sha256:abc",
              title: "Kling",
              url: "hot.html#s-sha256:abc",
              originalUrl: "https://the-decoder.com/kling",
              category: "model",
              selected: true,
            },
            group: null,
          },
        ],
        { builtAt: "2026-10-20T02:59:00.000Z", dataAsOf: "2026-10-20T10:55:12+08:00" },
      );
      const page = JSON.parse(readFileSync(join(dir, "data", "timeline", "all", "page-1.json"), "utf8"));
      assert.equal(page.cards[0].item.url, "https://the-decoder.com/kling");
      assert.doesNotMatch(JSON.stringify(page), /hot\.html/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

void dirname;
void fileURLToPath;
