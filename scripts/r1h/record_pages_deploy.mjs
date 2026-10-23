#!/usr/bin/env node
/**
 * Shared Pages-deploy counter for R1 and R1h (Task #58).
 *
 * R1 publish-no-wait should call this AFTER a successful repository_dispatch
 * (or after it knows the Pages run id). R1h live push records the same JSONL
 * automatically (source=r1h) so Max N=4 includes both rings. Does not push
 * or dispatch itself.
 *
 *   node scripts/r1h/record_pages_deploy.mjs --source r1 --kind success --pages-run-id 39822780150
 *   node scripts/r1h/record_pages_deploy.mjs --source r1 --kind failure
 */
import { pathToFileURL } from "node:url";
import {
  appendDeployEvent,
  parseArgs,
  resolveCounterPath,
} from "./lib.mjs";

export function recordPagesDeploy(rawArgv = process.argv.slice(2), env = process.env, { now = Date.now(), cwd = process.cwd() } = {}) {
  const args = parseArgs(rawArgv, {});
  const source = args.source || "r1";
  const kind = args.kind || "success";
  if (!["r1", "r1h"].includes(source)) {
    throw new Error(`--source must be r1 or r1h (got ${source})`);
  }
  if (!["success", "failure"].includes(kind)) {
    throw new Error(`--kind must be success or failure (got ${kind})`);
  }
  const pagesRunId = args["pages-run-id"] || args.pagesRunId || null;
  const event = {
    at: args.at || new Date(now).toISOString(),
    source,
    kind,
    pages_run_id: pagesRunId,
  };
  const counterPath = args.counter || resolveCounterPath(env, cwd);
  appendDeployEvent(counterPath, event);
  return { counterPath, event };
}

const isMain =
  !process.env.NODE_TEST_CONTEXT &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  try {
    const result = recordPagesDeploy();
    process.stdout.write(`${JSON.stringify(result.event)}\n`);
    process.stdout.write(`recorded → ${result.counterPath}\n`);
  } catch (err) {
    process.stderr.write(`record_pages_deploy: ${err.message}\n`);
    process.exit(2);
  }
}
