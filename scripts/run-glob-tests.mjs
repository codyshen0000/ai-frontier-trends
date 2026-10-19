/**
 * Run `node --test` on *.test.mjs under the given dirs.
 * Zero matches → exit 0 (B1/B2 test folders may not exist yet).
 */
import { spawn } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function walkTests(dir, acc = []) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return acc;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkTests(full, acc);
    else if (/\.test\.m?js$/.test(name)) acc.push(full);
  }
  return acc;
}

const roots = process.argv.slice(2);
if (!roots.length) {
  console.error("usage: node scripts/run-glob-tests.mjs <dir>…");
  process.exit(2);
}

const files = [...new Set(roots.flatMap((dir) => walkTests(dir)))].sort();
if (!files.length) {
  console.log(`no tests matched under ${roots.join(" ")}`);
  process.exit(0);
}

const child = spawn(process.execPath, ["--test", ...files], { stdio: "inherit" });
child.on("exit", (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 1);
});
