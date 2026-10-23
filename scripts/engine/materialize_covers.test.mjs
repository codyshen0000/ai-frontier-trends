import assert from "node:assert/strict";
import { leadCover } from "../cover_rules.mjs";
import {
  isDecorativeHero,
  isRemoteCover,
  isSameOriginCover,
  leadCitation,
  publicationsFromDaily,
} from "./materialize_covers.mjs";

assert.equal(isSameOriginCover({ url: "assets/covers/daily-2026-10-22-1600.webp" }), true);
assert.equal(isSameOriginCover({ url: "https://www.microsoft.com/x.png" }), false);
assert.equal(isRemoteCover({ url: "https://www.microsoft.com/x.png" }), true);
assert.equal(isRemoteCover({ url: "assets/covers/x.webp" }), false);

const emptyId = {
  key: "2026-10-22",
  title: "KLS",
  leadItemId: null,
  lead: { title: "微软研究院证明 KLS 猜想", leadParagraph: "论文图对照平面切割。" },
  cover: {
    url: "https://www.microsoft.com/en-us/research/wp-content/uploads/2026/10/KLS-illustration-scaled.png",
    width: null,
    height: null,
    alt: "平面切割与曲面切割同一凸几何体的对照示意图",
    valueClass: "paper_figure",
  },
  highlights: [
    {
      itemId: null,
      title: "微软研究院证明 KLS 猜想",
      summary: "论文图对照平面切割。",
      sourceUrl: "https://www.microsoft.com/en-us/research/blog/kls/",
      firstParty: true,
    },
  ],
  sections: [],
};

assert.equal(leadCitation(emptyId).sourceUrl.includes("microsoft.com"), true);
const pubs = publicationsFromDaily(emptyId);
assert.equal(pubs.length, 1);
assert.equal(pubs[0].articleId, "daily-lead");
assert.equal(pubs[0].media[0].url.includes("KLS-illustration"), true);

const picked = leadCover("", [], {
  title: emptyId.lead.title,
  summary: emptyId.lead.leadParagraph,
  pageUrl: emptyId.highlights[0].sourceUrl,
  firstParty: true,
  image: emptyId.cover,
});
assert.ok(picked.cover, "empty itemId still uses cover candidates");
assert.equal(picked.cover.url, emptyId.cover.url);
assert.ok(
  ["paper_figure", "official_explainer", "official_diagram", "eval_chart", "product_ui"].includes(picked.category),
  picked.category,
);

const alreadyLocal = {
  key: "2026-10-23",
  leadItemId: "sha256:abcd",
  cover: { url: "assets/covers/daily-2026-10-23-1600.webp", alt: "产品界面" },
  highlights: [],
  sections: [],
};
assert.equal(publicationsFromDaily(alreadyLocal).length, 0);

{
  const sharp = (await import("sharp")).default;
  const block = await sharp({
    create: { width: 1200, height: 675, channels: 3, background: { r: 8, g: 8, b: 8 } },
  })
    .composite([
      {
        input: await sharp({
          create: { width: 420, height: 420, channels: 3, background: { r: 20, g: 70, b: 210 } },
        })
          .png()
          .toBuffer(),
        left: 780,
        top: 0,
      },
    ])
    .png()
    .toBuffer();
  const figure = await sharp({
    create: { width: 1200, height: 700, channels: 3, background: { r: 250, g: 250, b: 250 } },
  })
    .composite(
      Array.from({ length: 12 }, (_, i) => ({
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="40"><rect width="1000" height="8" fill="#222"/><rect x="${40 + i * 70}" y="12" width="48" height="24" fill="#444"/></svg>`,
        ),
        left: 40,
        top: 30 + i * 54,
      })),
    )
    .png()
    .toBuffer();
  assert.equal(await isDecorativeHero(block, sharp), true, "synthetic color-block hero is decor");
  assert.equal(await isDecorativeHero(figure, sharp), false, "lined figure is not decor");
}

console.log("materialize_covers tests passed");
