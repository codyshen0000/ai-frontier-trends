import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../../..");
const layout = readFileSync(join(root, "vendor/mit/apps/web/app/features/report/ReportLayout.tsx"), "utf8");
const pages = readFileSync(join(here, "pages.tsx"), "utf8");
const css = readFileSync(join(here, "app.css"), "utf8");

assert.doesNotMatch(layout, /lg:-mb-\[72px\]/, "report-shell must not cancel main padding over the footer");
assert.match(layout, /footer\?: ReactNode/, "ReportLayout accepts a footer slot in the paper column");
assert.match(pages, /footer=\{rss\}/, "DailyScreen passes as-of into ReportLayout, not after it");
assert.match(css, /\.report-shell\s*\{\s*margin-bottom:\s*0;/, "lg report-shell keeps margin-bottom: 0");
assert.match(css, /\.ft-asof\s*\{[\s\S]*z-index:\s*1;/, ".ft-asof stays above sticky archive stacking");

console.log("report-footer-layout.test.ts ok");
