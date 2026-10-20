/**
 * B2-05 / B2-07: event_id + normalized URL uniqueness; merged_into ids must
 * not remain on the timeline or hot list. Picked up by `runVerifyRegistry`.
 * Missing engine dir → skip (fixture builds must not fail).
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { findDedupeIssues } from "../engine/dedupe.mjs";
import { groupByEvent } from "../engine/groupByEvent.mjs";
import { loadEngineData, resolveEngineDir } from "../engine/loader.mjs";

export const id = "b2-event-id";
export const owner = "B2";

function engineDirOf(ctx = {}) {
  return ctx.engineDir || resolveEngineDir(ctx.env || process.env);
}

/** @param {{ root?: string, distDir?: string, engineDir?: string, env?: NodeJS.ProcessEnv }} ctx */
export async function verify(ctx = {}) {
  const engineDir = engineDirOf(ctx);
  if (!existsSync(engineDir) || !existsSync(join(engineDir, "meta.json"))) {
    return { ok: true, skipped: true, message: `${id}: skip (no engine dir ${engineDir})` };
  }
  let bundle;
  try {
    bundle = loadEngineData({ dir: engineDir });
  } catch (err) {
    if (err?.code === "MISSING_DIR" || err?.code === "MISSING_META") {
      return { ok: true, skipped: true, message: `${id}: skip (${err.code})` };
    }
    return { ok: false, message: `${id}: ${err.message}` };
  }

  const cards = bundle.timeline?.cards || [];
  const grouped = groupByEvent(cards, bundle);
  const after = findDedupeIssues({
    timeline: { cards: grouped },
    hot: bundle.hot,
    search: bundle.search,
    redirects: bundle.redirects,
    events: bundle.events,
  });
  const before = findDedupeIssues({
    timeline: bundle.timeline,
    hot: bundle.hot,
    search: bundle.search,
    redirects: bundle.redirects,
    events: bundle.events,
  });

  const issues = [...after.issues];
  if (grouped.length !== new Set(grouped.map((card) => card.item?.storyPublicId || card.key)).size) {
    issues.push("groupByEvent left duplicate event keys");
  }

  if (issues.length) {
    return {
      ok: false,
      message: `${id}: ${issues.length} duplicate(s)\n${issues.join("\n")}`,
    };
  }

  const note = before.issues.length
    ? ` (input had ${before.issues.length} duplicate(s); groupByEvent collapsed them)`
    : "";
  return {
    ok: true,
    message: `${id}: ${after.eventCount} event_id(s), ${after.urlCount} URL(s), duplicates 0${note}`,
  };
}

const isMain =
  !process.env.NODE_TEST_CONTEXT &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const dir = process.argv[2];
  const result = await verify(dir ? { engineDir: dir } : {});
  console.log(result.message || (result.ok ? "ok" : "fail"));
  process.exit(result.ok ? 0 : 1);
}
