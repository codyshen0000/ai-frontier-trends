import assert from "node:assert/strict";
import { leadCover } from "../cover_rules.mjs";
import {
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

console.log("materialize_covers tests passed");
