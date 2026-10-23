/** v5 cover rules: MIT borrow order, then valuable-or-none. Never auto-pick first ≥480. */

export const SPARK_HOURS = 24;
export const RANK_WINDOW_HOURS = 48;
export const MIN_COVER_WIDTH = 480;
export const MIN_COVER_HEIGHT = 240;
export const UNKNOWN_WIDTH = 800;
export const MAX_MEDIA_CONSIDERED = 12;

export const IMAGE_WIDTHS = {
  avatar: 96,
  card: 336,
  thumb: 720,
  full: 1600,
  og: 1200,
  "avatar-48": 48,
  "image-1200": 1200,
};

export const HERO_MODES = ["thumb", "image-1200", "full"];

/** Public cover classes. `official_diagram` and `official_explainer` are the same valid class. */
export const VALUABLE_COVER_CLASSES = new Set([
  "model_sample",
  "paper_figure",
  "product_screenshot",
  "product_ui",
  "official_diagram",
  "official_explainer",
]);

export function isOfficialDiagramClass(category) {
  return category === "official_diagram" || category === "official_explainer";
}

export function isValuableCoverClass(category) {
  return VALUABLE_COVER_CLASSES.has(category);
}

const TRACKING_HOSTS = new Set([
  "ids4.ad.gt",
  "ids.ad.gt",
  "secure.adnxs.com",
  "sync.1rx.io",
  "ssum-sec.casalemedia.com",
  "sync.smartadserver.com",
  "token.rubiconproject.com",
  "image2.pubmatic.com",
  "sync.go.sonobi.com",
  "onetag-sys.com",
]);

function hostOf(src) {
  try {
    return new URL(src).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function pathOf(src) {
  try {
    return decodeURIComponent(new URL(src, "https://example.invalid").pathname || "").toLowerCase();
  } catch {
    return String(src || "").toLowerCase();
  }
}

function decodeCamoPayload(pathname) {
  const last = String(pathname).split("/").filter(Boolean).at(-1) || "";
  if (!/^[0-9a-f]+$/i.test(last) || last.length % 2) return "";
  try {
    return Buffer.from(last, "hex").toString("utf8");
  } catch {
    return "";
  }
}

export function isBadgeProxy(src) {
  const url = String(src || "");
  if (!url) return false;
  if (/camo\.githubusercontent\.com/i.test(url) || /shields\.io/i.test(url)) return true;
  const host = hostOf(url);
  if (host === "camo.githubusercontent.com") return true;
  if (host === "shields.io" || host.endsWith(".shields.io")) return true;
  try {
    const inner = decodeCamoPayload(new URL(url).pathname);
    if (inner && /shields\.io/i.test(inner)) return true;
  } catch {
    /* keep */
  }
  return false;
}

export function isNonArticleImage(src, width, height) {
  if (/^data:/i.test(src) && !/^data:image\/[a-z0-9.+-]+[;,]/i.test(src)) return true;
  if (width !== undefined && height !== undefined && Number(width) <= 1 && Number(height) <= 1) return true;
  if (isBadgeProxy(src)) return true;
  try {
    if (TRACKING_HOSTS.has(new URL(src).hostname)) return true;
  } catch {
    return false;
  }
  return false;
}

export function coalesceWidth(width) {
  return width == null || Number.isNaN(Number(width)) ? UNKNOWN_WIDTH : Number(width);
}

export function isSvgCover(item) {
  const url = String(item?.url || "");
  const mime = String(item?.mime || item?.type || item?.contentType || "").toLowerCase();
  if (mime.includes("svg")) return true;
  if (/^data:image\/svg\+xml/i.test(url)) return true;
  try {
    const parsed = new URL(url, "https://example.invalid");
    if (/\.svg$/i.test(parsed.pathname)) return true;
  } catch {
    if (/\.svg(\?|#|$)/i.test(url)) return true;
  }
  return false;
}

export function isTooShort(item) {
  const height = item?.height;
  if (height == null || Number.isNaN(Number(height))) return false;
  return Number(height) < MIN_COVER_HEIGHT;
}

/** Obvious logo / badge URLs dropped before the value gate. */
export function isObviousLogoOrBadgeUrl(src) {
  if (isBadgeProxy(src)) return true;
  const host = hostOf(src);
  const path = pathOf(src);
  const blob = `${host}${path}`;
  if (/(?:^|\/)(?:logo|wordmark|brandmark|favicon|apple-touch-icon)(?:[-_.]|\.|$)/i.test(path)) return true;
  if (/(?:^|\/)(?:badge|shield|camo)s?(?:[-_./]|$)/i.test(path)) return true;
  if (/\/icons?\/|\/sprites?\/|icon[-_](?:\d+|mark|logo)/i.test(path)) return true;
  if (host === "img.shields.io" || host.endsWith(".shields.io")) return true;
  if (/badgen\.net|forthebadge\.com|badge\.fury\.io/.test(blob)) return true;
  return false;
}

function isClassicOgSize(width, height) {
  if (width == null || height == null) return false;
  const w = Number(width);
  const h = Number(height);
  if (!w || !h) return false;
  const classic = [
    [1200, 630],
    [1200, 600],
    [1200, 628],
    [1024, 512],
    [800, 418],
  ];
  return classic.some(([cw, ch]) => Math.abs(w - cw) <= 8 && Math.abs(h - ch) <= 8);
}

function looksSquareLogo(width, height) {
  if (width == null || height == null) return false;
  const w = Number(width);
  const h = Number(height);
  if (!w || !h) return false;
  const ratio = w / h;
  return ratio > 0.85 && ratio < 1.18 && Math.max(w, h) <= 640;
}

const OG_URL_RE =
  /(?:^|\/)(?:og[-_]?image|open[-_]?graph|twitter[-_]?card|social[-_]?card|sharing[-_]?card|default[-_]?og|default[-_]?social)(?:[-_.]|\.|$)/i;
const AVATAR_URL_RE =
  /(?:^|\/)(?:avatar|portrait|headshot|profile[-_]?pic|profile[-_]?image|userpic|head[-_]?shot)(?:[-_.]|\.|$)/i;
const DECOR_URL_RE =
  /unsplash\.com|pexels\.com|pixabay\.com|stock(image|photo)|\/mood\/|\/texture\/|\/gradient\/|hero[-_]?bg|background[-_]?only/i;
const KEEP_URL_RE =
  /arena|lmarena|leaderboard|benchmark|ablation|figure|\/fig[-_.]|screenshot|screen[-_]?shot|comparison|side[-_]?by[-_]?side|architecture|diagram|explainer|flowchart|generations?|sample[-_]?output|model[-_]?sample|bbox[-_]?edit|demo[-_]?ui|(?:^|[^a-z])(?:eval(?:uation)?|chart|plot)(?:[^a-z]|$)/i;
const KEEP_ALT_RE =
  /评测|对照|对比|截图|样张|架构|示意|figure|chart|benchmark|arena|leaderboard|screenshot|diagram|ablation|eval/i;
const REJECT_ALT_RE = /^(logo|avatar|icon|badge|wordmark|brand)$/i;
const TOPIC_RE = /模型|权重|评测|论文|figure|arena|benchmark|api|ui|截图|开源|发布|flux|llm|agent|产品/i;

function sameUrl(a, b) {
  if (!a || !b) return false;
  try {
    const left = new URL(a);
    const right = new URL(b);
    return left.hostname.replace(/^www\./, "") === right.hostname.replace(/^www\./, "") && left.pathname === right.pathname;
  } catch {
    return String(a) === String(b);
  }
}

/**
 * Value gate. Unsure → empty.
 * Width is not a keep signal. Unknown width is only coalesced to 800 after keep.
 */
export function classifyValue(item, ctx = {}) {
  const url = String(item?.url || "");
  const alt = String(item?.alt || ctx.alt || "");
  const title = String(ctx.title || "");
  const summary = String(ctx.summary || "");
  const pageUrl = String(ctx.pageUrl || "");
  const ogImage = ctx.ogImage || null;
  const firstParty = Boolean(ctx.firstParty);
  const host = hostOf(url);
  const path = pathOf(url);
  const blob = `${host} ${path} ${alt}`.toLowerCase();

  if (isObviousLogoOrBadgeUrl(url) || isBadgeProxy(url)) {
    return { verdict: "reject", category: "badge", reason: "logo/徽章 URL，无用" };
  }
  if (OG_URL_RE.test(path) || /opengraph\.githubassets\.com|repository-images\.githubusercontent\.com/.test(host)) {
    return { verdict: "reject", category: "og", reason: "OG/社交预览图，无用" };
  }
  if (ogImage && sameUrl(url, ogImage) && (isClassicOgSize(item.width, item.height) || OG_URL_RE.test(pathOf(ogImage)))) {
    return { verdict: "reject", category: "og", reason: "与页面 og:image 同址的默认社交卡，无用" };
  }
  if (AVATAR_URL_RE.test(path) || REJECT_ALT_RE.test(alt.trim())) {
    return { verdict: "reject", category: alt && REJECT_ALT_RE.test(alt.trim()) && /avatar|portrait|headshot/.test(blob) ? "avatar" : "logo", reason: "头像或纯标识，无用" };
  }
  if (DECOR_URL_RE.test(url) || DECOR_URL_RE.test(path)) {
    return { verdict: "reject", category: "decor", reason: "装饰/库存/氛围图，无用" };
  }
  if (looksSquareLogo(item.width, item.height) && !KEEP_URL_RE.test(blob) && !KEEP_ALT_RE.test(alt)) {
    return { verdict: "reject", category: "logo", reason: "近方形小图，按 Logo 拒收" };
  }
  if (isClassicOgSize(item.width, item.height) && !KEEP_URL_RE.test(blob) && !KEEP_ALT_RE.test(alt)) {
    return { verdict: "reject", category: "og", reason: "经典 OG 尺寸且无正文图信号，无用" };
  }

  if (KEEP_URL_RE.test(blob) || KEEP_ALT_RE.test(alt) || KEEP_ALT_RE.test(title)) {
    if (/arena|lmarena|leaderboard|benchmark|eval|chart|plot|ablation/.test(blob) || /评测|对照|arena/i.test(`${title} ${alt}`)) {
      return { verdict: "keep", category: "eval_chart", reason: "评测图/Arena 榜图，有用" };
    }
    if (/figure|\/fig[-_.]|arxiv\.org/.test(blob) || /论文|figure/i.test(`${title} ${alt}`)) {
      return { verdict: "keep", category: "paper_figure", reason: "论文/研究图，有用" };
    }
    if (/screenshot|screen[-_]?shot|demo[-_]?ui|bbox/.test(blob) || /截图|界面/i.test(`${title} ${alt}`)) {
      return { verdict: "keep", category: "product_ui", reason: "产品功能截图，有用" };
    }
    if (/architecture|diagram|explainer|flowchart|示意|架构/.test(blob) || /架构|示意/.test(`${title} ${alt}`)) {
      return { verdict: "keep", category: "official_explainer", reason: "官方解说图/架构图，有用" };
    }
    if (/sample|generation|model[-_]?sample/.test(blob) || /样张|生成效果/.test(`${title} ${alt}`)) {
      return { verdict: "keep", category: "model_sample", reason: "模型样张/对比图，有用" };
    }
    return { verdict: "keep", category: "official_explainer", reason: "正文说明图信号，有用" };
  }

  if (host === "arxiv.org" && /\/html\/|\/src\//.test(path) && !/logo|icon/.test(path)) {
    return { verdict: "keep", category: "paper_figure", reason: "arXiv HTML 正文图，有用" };
  }

  const topicHit = TOPIC_RE.test(`${title} ${summary}`);
  const largeEnough =
    (item.width == null && item.height == null) ||
    (Number(item.width) >= 800 && (item.height == null || Number(item.height) >= 400));
  const officialHost =
    firstParty &&
    /\/blog\/|\/docs\/|\/news\/|huggingface\.co|bfl\.ai|arxiv\.org|openai\.com|anthropic\.com|deepmind\.google/.test(
      `${host}${pathOf(pageUrl)}${pageUrl}`,
    );
  if (officialHost && topicHit && largeEnough && !isClassicOgSize(item.width, item.height) && !looksSquareLogo(item.width, item.height)) {
    if (/样张|生成|image|flux|扩散|collage|outputs?|illustration/.test(`${title} ${summary} ${path} ${alt}`)) {
      return { verdict: "keep", category: "model_sample", reason: "官方博客正文大图，按模型样张放行" };
    }
    if (/ui|界面|产品|agent|协议/.test(`${title} ${summary}`)) {
      return { verdict: "keep", category: "product_ui", reason: "官方产品正文大图，按功能截图放行" };
    }
    return { verdict: "keep", category: "official_explainer", reason: "官方正文大图且主题匹配，按解说图放行" };
  }

  return { verdict: "empty", category: "unsure", reason: "边界拿不准，默认不放" };
}

function skipEngineering(item) {
  if (!item || item.kind !== "image") return "not_image";
  if (isBadgeProxy(item.url) || isObviousLogoOrBadgeUrl(item.url)) return "badge";
  if (isNonArticleImage(item.url, item.width ?? undefined, item.height ?? undefined)) return "non_article";
  if (isSvgCover(item)) return "svg";
  if (isTooShort(item)) return "below_240";
  return null;
}

/**
 * v4 auto-pick (first coalesce(width,800) ≥ 480), with v4.1 engineering skips.
 * Used only to document “would have shown under v4, empty under v5”.
 */
export function firstQualifyingImageV4(media, { listed = true, bodyMode = "full" } = {}) {
  if (!listed) return { image: null, reason: "not_listed" };
  if (bodyMode === "summary") return { image: null, reason: "summary_only" };
  const images = (media || []).filter((m) => m && m.kind === "image").slice(0, MAX_MEDIA_CONSIDERED);
  if (images.length === 0) return { image: null, reason: "no_image" };
  let sawSvg = false;
  let sawShort = false;
  let sawNarrow = false;
  let sawBadge = false;
  for (const item of images) {
    if (isBadgeProxy(item.url)) {
      sawBadge = true;
      continue;
    }
    if (isNonArticleImage(item.url, item.width ?? undefined, item.height ?? undefined)) continue;
    if (isSvgCover(item)) {
      sawSvg = true;
      continue;
    }
    if (isTooShort(item)) {
      sawShort = true;
      continue;
    }
    if (coalesceWidth(item.width) >= MIN_COVER_WIDTH) {
      return {
        image: {
          url: item.url,
          width: typeof item.width === "number" ? item.width : null,
          height: typeof item.height === "number" ? item.height : null,
          alt: item.alt || "",
        },
        reason: item.width == null ? "ok_unknown_width_as_800" : "ok",
      };
    }
    sawNarrow = true;
  }
  if (sawNarrow) return { image: null, reason: "below_480" };
  if (sawShort) return { image: null, reason: "below_240" };
  if (sawSvg) return { image: null, reason: "svg" };
  if (sawBadge) return { image: null, reason: "badge" };
  return { image: null, reason: "no_image" };
}

function asCoverImage(item) {
  return {
    url: item.url,
    width: typeof item.width === "number" ? item.width : null,
    height: typeof item.height === "number" ? item.height : null,
    alt: item.alt || "",
  };
}

/**
 * v5: drop summary/svg/h<240/logo-badge URLs, value-gate the rest, take first keep.
 * Unknown width is treated as 800 only after the value gate passes.
 */
export function pickFirstValuableImage(media, { listed = true, bodyMode = "full", title = "", summary = "", pageUrl = "", ogImage = null, firstParty = false } = {}) {
  if (!listed) return { image: null, reason: "not_listed", category: null, value: null };
  if (bodyMode === "summary") return { image: null, reason: "summary_only", category: null, value: null };
  const images = (media || []).filter((m) => m && m.kind === "image").slice(0, MAX_MEDIA_CONSIDERED);
  if (images.length === 0) return { image: null, reason: "no_image", category: null, value: null };

  const dropped = [];
  for (const item of images) {
    const skip = skipEngineering(item);
    if (skip) {
      dropped.push(skip);
      continue;
    }
    const value = classifyValue(item, { title, summary, pageUrl, ogImage, firstParty, alt: item.alt });
    if (value.verdict !== "keep") {
      dropped.push(value.category === "unsure" ? "unsure" : value.category);
      continue;
    }
    if (coalesceWidth(item.width) < MIN_COVER_WIDTH) {
      dropped.push("below_480");
      continue;
    }
    return {
      image: asCoverImage(item),
      reason: item.width == null ? "valuable_unknown_width_as_800" : "valuable",
      category: value.category,
      value,
    };
  }
  const priority = ["og", "logo", "badge", "avatar", "decor", "unrelated", "unsure", "below_480", "below_240", "svg", "badge"];
  const reason = priority.find((key) => dropped.includes(key)) || (dropped.length ? dropped[0] : "no_image");
  return { image: null, reason, category: null, value: null };
}

function cmpBoolDesc(a, b) {
  return Number(Boolean(b)) - Number(Boolean(a));
}

export function sortHotPublications(publications, representativeId) {
  return [...publications].sort((a, b) => {
    const rep = cmpBoolDesc(a.articleId === representativeId, b.articleId === representativeId);
    if (rep) return rep;
    const first = cmpBoolDesc(a.firstParty, b.firstParty);
    if (first) return first;
    const selected = cmpBoolDesc(a.selected, b.selected);
    if (selected) return selected;
    const score = (b.score ?? 0) - (a.score ?? 0);
    if (score) return score;
    return String(a.articleId).localeCompare(String(b.articleId));
  });
}

export function sortLeadPublications(publications, leadItemId) {
  return [...publications].sort((a, b) => {
    const self = cmpBoolDesc(a.articleId === leadItemId, b.articleId === leadItemId);
    if (self) return self;
    const first = cmpBoolDesc(a.firstParty, b.firstParty);
    if (first) return first;
    const score = (b.score ?? 0) - (a.score ?? 0);
    if (score) return score;
    return String(a.articleId).localeCompare(String(b.articleId));
  });
}

function rollupReason(log) {
  if (log.find((row) => row.reason === "summary_only") && log.every((row) => row.reason === "summary_only" || row.reason === "not_listed")) {
    return "summary_only";
  }
  const keys = ["og", "logo", "badge", "avatar", "decor", "unsure", "below_480", "below_240", "svg", "no_image"];
  return keys.find((key) => log.some((row) => row.reason === key)) || "no_image";
}

export function pickCover(publications, { representativeId, leadItemId, mode, title = "", summary = "" } = {}) {
  const sorted =
    mode === "lead"
      ? sortLeadPublications(publications, leadItemId)
      : sortHotPublications(publications, representativeId);
  const log = [];
  for (const pub of sorted) {
    const ctx = {
      listed: pub.listed !== false,
      bodyMode: pub.bodyMode || "full",
      title: pub.title || title,
      summary: pub.summary || summary,
      pageUrl: pub.url,
      ogImage: pub.ogImage || null,
      firstParty: Boolean(pub.firstParty),
    };
    const v4 = firstQualifyingImageV4(pub.media, ctx);
    const hit = pickFirstValuableImage(pub.media, ctx);
    log.push({
      articleId: pub.articleId,
      url: pub.url,
      bodyMode: pub.bodyMode || "full",
      listed: pub.listed !== false,
      firstParty: Boolean(pub.firstParty),
      selected: Boolean(pub.selected),
      score: pub.score ?? 0,
      representative: pub.articleId === representativeId,
      isLead: pub.articleId === leadItemId,
      reason: hit.reason,
      category: hit.category,
      value: hit.value,
      v4Reason: v4.reason,
      v4Image: v4.image,
      image: hit.image,
    });
    if (hit.image) {
      return {
        cover: hit.image,
        reason: hit.reason,
        category: hit.category,
        value: hit.value,
        articleId: pub.articleId,
        log,
      };
    }
  }
  return { cover: null, reason: rollupReason(log), category: null, value: null, articleId: null, log };
}

export function queryHotCovers(story) {
  return pickCover(story.publications || [], {
    mode: "hot",
    representativeId: story.representativeItemId,
    title: story.title,
    summary: story.summary,
  });
}

function asMediaItem(image) {
  if (!image) return null;
  if (image.kind === "image" && image.url) return image;
  if (image.url) {
    return {
      kind: "image",
      url: image.url,
      width: typeof image.width === "number" ? image.width : null,
      height: typeof image.height === "number" ? image.height : null,
      alt: image.alt || "",
    };
  }
  return null;
}

export function leadCover(leadItemId, publications, extra = {}) {
  const pubs = Array.isArray(publications) ? [...publications] : [];
  const extras = [];
  const extraImage = asMediaItem(extra.image);
  if (extraImage) extras.push(extraImage);
  for (const item of extra.candidates || []) {
    const media = asMediaItem(item);
    if (media && !extras.some((row) => row.url === media.url)) extras.push(media);
  }
  if (extras.length && !pubs.some((pub) => (pub.media || []).some((row) => extras.some((ex) => ex.url === row.url)))) {
    pubs.push({
      articleId: leadItemId || extra.itemId || extra.articleId || "daily-lead",
      firstParty: Boolean(extra.firstParty),
      selected: true,
      score: extra.score ?? 0,
      listed: extra.listed !== false,
      bodyMode: extra.bodyMode || "full",
      url: extra.pageUrl || extra.sourceUrl || "",
      ogImage: extra.ogImage || null,
      title: extra.title || "",
      summary: extra.summary || "",
      media: extras,
    });
  }
  return pickCover(pubs, {
    mode: "lead",
    leadItemId: leadItemId || undefined,
    title: extra.title,
    summary: extra.summary,
  });
}

export function srcSetFor(urlForMode) {
  return HERO_MODES.map((mode) => `${urlForMode(mode)} ${IMAGE_WIDTHS[mode]}w`).join(", ");
}

/** Fixture items: v4 ≥480 auto would hang a cover; v5 must be 无图. */
export const V5_OG_LOGO_SAMPLES = [
  {
    id: "sample-og-default",
    title: "某实验室发布说明",
    summary: "官方博客同步了模型卡。",
    publications: [
      {
        articleId: "sample-og-default",
        firstParty: true,
        selected: true,
        score: 10,
        bodyMode: "full",
        listed: true,
        url: "https://ex.example/blog/release",
        ogImage: "https://ex.example/og-image.png",
        media: [{ kind: "image", url: "https://ex.example/og-image.png", width: 1200, height: 630, alt: "share card" }],
      },
    ],
    v4: "ok",
    v5: "og",
    note: "站点默认 OG 社交卡，v4 因宽 1200 会挂图",
  },
  {
    id: "sample-github-opengraph",
    title: "开源仓库周更",
    summary: "README 顶部是仓库社交预览。",
    publications: [
      {
        articleId: "sample-github-opengraph",
        firstParty: false,
        selected: false,
        score: 4,
        bodyMode: "full",
        listed: true,
        url: "https://github.com/ex/repo",
        media: [
          {
            kind: "image",
            url: "https://opengraph.githubassets.com/abc/ex/repo",
            width: 1280,
            height: 640,
            alt: "ex/repo",
          },
        ],
      },
    ],
    v4: "ok",
    v5: "og",
    note: "GitHub Open Graph 预览图",
  },
  {
    id: "sample-logo-png",
    title: "品牌方块出现在正文第一张",
    summary: "文章第一张是 800px Logo。",
    publications: [
      {
        articleId: "sample-logo-png",
        firstParty: true,
        selected: true,
        score: 8,
        bodyMode: "full",
        listed: true,
        url: "https://ex.example/about",
        media: [{ kind: "image", url: "https://ex.example/assets/logo.png", width: 800, height: 800, alt: "logo" }],
      },
    ],
    v4: "ok",
    v5: "badge",
    note: "纯 Logo 方图（文件名 logo.png）；v4 ≥480 会挂，v5 在工程剔除明显 logo URL",
  },
  {
    id: "sample-unsplash-decor",
    title: "产业评论没有正文图",
    summary: "配的是一张库存氛围图。",
    publications: [
      {
        articleId: "sample-unsplash-decor",
        firstParty: false,
        selected: false,
        score: 3,
        bodyMode: "full",
        listed: true,
        url: "https://ex.example/opinion",
        media: [
          {
            kind: "image",
            url: "https://images.unsplash.com/photo-000?w=1600",
            width: 1600,
            height: 900,
            alt: "abstract lights",
          },
        ],
      },
    ],
    v4: "ok",
    v5: "decor",
    note: "Unsplash 装饰/库存图",
  },
  {
    id: "sample-twitter-card",
    title: "媒体转载只有分享卡",
    summary: "正文第一张是 twitter-card.jpg。",
    publications: [
      {
        articleId: "sample-twitter-card",
        firstParty: false,
        selected: false,
        score: 2,
        bodyMode: "full",
        listed: true,
        url: "https://news.example/story",
        ogImage: "https://news.example/images/twitter-card.jpg",
        media: [
          {
            kind: "image",
            url: "https://news.example/images/twitter-card.jpg",
            width: 1200,
            height: 628,
            alt: "twitter card",
          },
        ],
      },
    ],
    v4: "ok",
    v5: "og",
    note: "社交分享卡文件名 + 经典 OG 尺寸",
  },
];
