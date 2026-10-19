/** Sparkline window, matching AIHOT `packages/backend/src/publication/stories.ts`. */
export const SPARK_HOURS = 24;
/** Hot ranking window (`loadHot` `windowHours`), not the sparkline. */
export const RANK_WINDOW_HOURS = 48;
/** First in-article image must be this wide; unknown width counts as UNKNOWN_WIDTH. */
export const MIN_COVER_WIDTH = 480;
/** Product-approved deviation: skip covers with a known height below this. */
export const MIN_COVER_HEIGHT = 240;
export const UNKNOWN_WIDTH = 800;
export const MAX_MEDIA_CONSIDERED = 12;

/** AIHOT `packages/backend/src/media/renditions.ts` IMAGE_WIDTHS used by the image proxy. */
export const IMAGE_WIDTHS = {
  avatar: 96,
  card: 336,
  thumb: 720,
  full: 1600,
  og: 1200,
  "avatar-48": 48,
  "image-1200": 1200,
} as const;

/** AIHOT `RESPONSIVE_MODES.hero` — hot lead + daily headline srcSet. */
export const HERO_MODES = ["thumb", "image-1200", "full"] as const;
