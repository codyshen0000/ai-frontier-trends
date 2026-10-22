/** Public signals/weights pages stay aligned with store-digest facts. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { signalRows, weightsStatus } from "../charts.mjs";
import { assertNoInternalMeta } from "../story_digest.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const signalsMd = readFileSync(join(root, "content", "signals-tracker.md"), "utf8");
const weightsMd = readFileSync(join(root, "content", "weights-tracker.md"), "utf8");
const signalsHtml = readFileSync(join(root, "dist", "signals", "index.html"), "utf8");
const weightsHtml = readFileSync(join(root, "dist", "weights", "index.html"), "utf8");

assertNoInternalMeta(signalsMd, "content/signals-tracker.md");
assertNoInternalMeta(weightsMd, "content/weights-tracker.md");

const signals = signalRows(signalsMd);
assert.equal(signals.length, 4, "signals tracker has four ## tables");
assert.equal(signals.filter((row) => row.value > 0).length, 3, "three of four signals have evidence rows");
assert.match(signalsMd, /2610\.02967/, "Arena T2I row from store");
assert.match(signalsMd, /2610\.11498/, "PTD row from store");
assert.match(signalsMd, /2610\.22192/, "Terminal-RSI stays in observation");
assert.match(signalsHtml, /4 个信号里 3 个已出现证据/);
assert.match(signalsHtml, /2610\.02967/);
assert.match(signalsHtml, /2610\.11498/);

const weights = weightsStatus(weightsMd);
assert.equal(weights.total, 6, "weights tracker has six announced rows");
assert.equal(weights.by["已交付"], 3, "Klein / Kling / Step 5 count as delivered");
assert.equal(weights.by["未交付"], 3, "Praxis / Mistral Large 4 / Reflection still open");
assert.match(weightsMd, /2026-10-15（Klein）/);
assert.match(weightsMd, /2026-10-15（产品全量）/);
assert.match(weightsMd, /Step-5-Preview/);
assert.match(weightsHtml, /已宣布的 6 个模型里 3 个已交付/);
assert.match(weightsHtml, /Klein/);
assert.match(weightsHtml, /Kling 4\.0/);
assert.match(weightsHtml, /Step-5-Preview/);
assert.doesNotMatch(weightsHtml, /产品本身未上线/);

console.log("verify/trackers: signals 4/3 evidence; weights 6 announced / 3 delivered");
