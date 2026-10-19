/** MIT-verbatim cover rules (AIHOT stories.ts queryHotCovers / reports.ts leadCover / extract.ts). */

export const SPARK_HOURS = 24;
export const RANK_WINDOW_HOURS = 48;
export const MIN_COVER_WIDTH = 480;
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

export function isNonArticleImage(src, width, height) {
  if (/^data:/i.test(src) && !/^data:image\/[a-z0-9.+-]+[;,]/i.test(src)) return true;
  if (width !== undefined && height !== undefined && Number(width) <= 1 && Number(height) <= 1) return true;
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

/**
 * Picture of an article = first media item of kind image (in-article <img> order, max 12)
 * whose coalesce(width, 800) >= 480.
 */
export function firstQualifyingImage(media, { listed = true, bodyMode = "full" } = {}) {
  if (!listed) return { image: null, reason: "not_listed" };
  if (bodyMode === "summary") return { image: null, reason: "summary_only" };
  const images = (media || []).filter((m) => m && m.kind === "image").slice(0, MAX_MEDIA_CONSIDERED);
  if (images.length === 0) return { image: null, reason: "no_image" };
  for (const item of images) {
    if (isNonArticleImage(item.url, item.width ?? undefined, item.height ?? undefined)) continue;
    if (coalesceWidth(item.width) >= MIN_COVER_WIDTH) {
      return {
        image: {
          url: item.url,
          width: typeof item.width === "number" ? item.width : null,
          height: typeof item.height === "number" ? item.height : null,
        },
        reason: item.width == null ? "ok_unknown_width_as_800" : "ok",
      };
    }
  }
  return { image: null, reason: "below_480" };
}

function cmpBoolDesc(a, b) {
  return Number(Boolean(b)) - Number(Boolean(a));
}

/**
 * queryHotCovers ORDER BY:
 * representative → first_party → selected → score desc → article_id asc
 */
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

/**
 * leadCover ORDER BY:
 * the lead item itself → first_party → score desc → article_id asc
 * (no `selected` key)
 */
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

export function pickCover(publications, { representativeId, leadItemId, mode }) {
  const sorted =
    mode === "lead"
      ? sortLeadPublications(publications, leadItemId)
      : sortHotPublications(publications, representativeId);
  const log = [];
  for (const pub of sorted) {
    const hit = firstQualifyingImage(pub.media, { listed: pub.listed !== false, bodyMode: pub.bodyMode || "full" });
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
      image: hit.image,
    });
    if (hit.image) {
      return { cover: hit.image, reason: hit.reason, articleId: pub.articleId, log };
    }
  }
  const reason = log.find((row) => row.reason === "summary_only") && log.every((row) => row.reason === "summary_only" || row.reason === "not_listed")
    ? "summary_only"
    : log.some((row) => row.reason === "below_480")
      ? "below_480"
      : "no_image";
  return { cover: null, reason, articleId: null, log };
}

export function queryHotCovers(story) {
  return pickCover(story.publications || [], {
    mode: "hot",
    representativeId: story.representativeItemId,
  });
}

export function leadCover(leadItemId, publications) {
  return pickCover(publications || [], { mode: "lead", leadItemId });
}

export function srcSetFor(urlForMode) {
  return HERO_MODES.map((mode) => `${urlForMode(mode)} ${IMAGE_WIDTHS[mode]}w`).join(", ");
}
