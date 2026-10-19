/** B-3: /api/v1/index.json and weekly/*.json paths are not root-absolute. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const apiDir = join(root, "dist", "api", "v1");
const index = JSON.parse(readFileSync(join(apiDir, "index.json"), "utf8"));
const weeklyIndex = JSON.parse(readFileSync(join(apiDir, "weekly", "index.json"), "utf8"));

assert.ok(Array.isArray(index.files) && index.files.length, "api index lists files");
for (const file of index.files) {
  assert.ok(file.path, `${file.note || "file"} has path`);
  assert.ok(!String(file.path).startsWith("/"), `api index path is relative: ${file.path}`);
}
assert.equal(index.files[0].path, "index.json");
assert.ok(index.files.some((file) => file.path === "weekly/index.json"));

for (const item of weeklyIndex.items || []) {
  assert.ok(!String(item.path).startsWith("/"), `weekly item path is relative: ${item.path}`);
  const issue = JSON.parse(readFileSync(join(apiDir, "weekly", `${item.date}.json`), "utf8"));
  assert.ok(!String(issue.path).startsWith("/"), `weekly/${item.date}.json path is relative: ${issue.path}`);
}

console.log("verify/api-paths: B-3 API paths are relative");
