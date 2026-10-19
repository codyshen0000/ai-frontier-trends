/** B-1: /starred/ weekly links are site-root-relative via cfg.base. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const hydrateSrc = readFileSync(join(root, "scripts", "mit-static", "src", "client", "hydrate.ts"), "utf8");
const hydrate = readFileSync(join(root, "dist", "assets", "hydrate.js"), "utf8");
const starred = readFileSync(join(root, "dist", "starred", "index.html"), "utf8");

assert.match(hydrateSrc, /function siteRel/);
assert.match(hydrateSrc, /function siteHref/);
assert.match(hydrateSrc, /replace\(\/\^\\\.\//);
assert.match(hydrateSrc, /url: siteRel\(/);
assert.match(hydrate, /replace\(\/\^\\\.\//);
assert.match(hydrate, /replace\(\/\^\//);
assert.match(starred, /"base":"\.\.\/"/);
assert.doesNotMatch(hydrateSrc, /url: item\.url \|\| "\.\/weekly\//);

console.log("verify/starred-base: B-1 site-root-relative starred urls");
