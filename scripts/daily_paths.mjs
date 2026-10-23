/** Dated daily issue paths. Shared by MIT routes, build rewrite, and hash-compat. */

export const DAILY_ISSUE_KEY = /^(\d{4}-\d{2}-\d{2})$/;

export function isDailyIssueKey(key) {
  return DAILY_ISSUE_KEY.test(String(key || ""));
}

export function dailyIssueFile(key) {
  if (!isDailyIssueKey(key)) throw new Error(`invalid daily issue key: ${key}`);
  return `daily-${key}.html`;
}

export function dailyIssuePath(key) {
  if (!isDailyIssueKey(key)) throw new Error(`invalid daily issue key: ${key}`);
  return `/daily/${key}/`;
}

export function parseDailyIssueKey(path) {
  const raw = String(path || "");
  const m = raw.match(/\/daily\/(\d{4}-\d{2}-\d{2})\/?$/);
  if (m) return m[1];
  const file = raw.match(/daily-(\d{4}-\d{2}-\d{2})\.html$/);
  return file ? file[1] : null;
}

/** Runs after SSR markup so `#d-YYYY-MM-DD` can redirect to `/daily/YYYY-MM-DD/`. */
export const DAILY_HASH_REDIRECT_JS = `(function(){try{var m=location.hash.match(/^#d-(\\d{4}-\\d{2}-\\d{2})/);if(!m)return;if(document.getElementById("d-"+m[1]))return;var path=location.pathname.replace(/index\\.html$/,"");if(/\\/daily\\/\\d{4}-\\d{2}-\\d{2}\\/?$/.test(path)){location.replace(path.replace(/\\/\\d{4}-\\d{2}-\\d{2}\\/?$/,"/"+m[1]+"/"));return;}if(/\\/daily\\/?$/.test(path))location.replace(path.replace(/\\/?$/,"/")+m[1]+"/");}catch(e){}})();`;
