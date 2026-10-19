/** B-4 + R-5: scan all dist text including .map; fail root-absolute in-site URLs. */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertNoBannedPublicCopyInDir,
  assertNoRootAbsoluteUrls,
  collectBannedPublicCopyHits,
  collectRootAbsoluteUrlHits,
  walkPublicCopyFiles,
} from "../story_digest.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const distDir = join(root, "dist");

const files = walkPublicCopyFiles(distDir);
assert.ok(files.length > 20, `walked ${files.length} dist text files`);
assert.ok(
  files.some((file) => file.endsWith(".html")) && files.some((file) => file.endsWith(".json")),
  "all-text walk includes html and json",
);

const banned = collectBannedPublicCopyHits(distDir, { prefix: "dist/" });
assert.equal(banned.length, 0, banned.map((hit) => `${hit.file} «${hit.word}»`).join("\n"));

const rootAbs = collectRootAbsoluteUrlHits(distDir, { prefix: "dist/" });
assert.equal(rootAbs.length, 0, rootAbs.map((hit) => `${hit.file} «${hit.value}»`).join("\n"));

{
  const tmp = mkdtempSync(join(tmpdir(), "verify-map-"));
  try {
    writeFileSync(join(tmp, "app.js.map"), '{"note":"本批"}');
    assert.ok(walkPublicCopyFiles(tmp).some((file) => file.endsWith(".map")));
    assert.throws(
      () => assertNoBannedPublicCopyInDir(tmp, { prefix: "dist/" }),
      /app\.js\.map[\s\S]*本批/,
    );
    console.log("verify/scan-all-text negative: banned word in .map exits non-zero");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
{
  const tmp = mkdtempSync(join(tmpdir(), "verify-root-abs-"));
  try {
    writeFileSync(join(tmp, "page.html"), '<img src="/weekly/2026-10-18/charts/x.png">');
    assert.throws(
      () => assertNoRootAbsoluteUrls(tmp, { prefix: "dist/" }),
      /\/weekly\/2026-10-18\//,
    );
    console.log("verify/scan-all-text negative: root-absolute path exits non-zero");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
{
  const tmp = mkdtempSync(join(tmpdir(), "verify-root-xml-"));
  try {
    writeFileSync(join(tmp, "feed.xml"), "<rss><item><link>/weekly/2026-10-18/</link></item></rss>");
    assert.throws(() => assertNoRootAbsoluteUrls(tmp, { prefix: "dist/" }), /\/weekly\/2026-10-18\//);
    console.log("verify/scan-all-text negative: RSS <link> text exits non-zero");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
{
  const tmp = mkdtempSync(join(tmpdir(), "verify-root-md-"));
  try {
    writeFileSync(join(tmp, "a.md"), "[x](/weekly/2026-10-18/)");
    assert.throws(() => assertNoRootAbsoluteUrls(tmp, { prefix: "dist/" }), /\/weekly\/2026-10-18\//);
    console.log("verify/scan-all-text negative: Markdown link exits non-zero");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
{
  const tmp = mkdtempSync(join(tmpdir(), "verify-root-js-"));
  try {
    writeFileSync(join(tmp, "x.js"), 'const u = "/ai-frontier-trends/hot/";');
    assert.throws(() => assertNoRootAbsoluteUrls(tmp, { prefix: "dist/" }), /\/ai-frontier-trends\/hot\//);
    console.log("verify/scan-all-text negative: JS string literal exits non-zero");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

console.log(`verify/scan-all-text: B-4/R-5 ${files.length} text files, banned=0, root-absolute=0`);
