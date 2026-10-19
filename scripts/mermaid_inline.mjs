/** Build-time mermaid → inline SVG. No runtime, no CDN in the dest file. */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const mermaidMin = join(here, "..", "node_modules", "mermaid", "dist", "mermaid.min.js");
const CHROME = process.env.CHROME || "/usr/bin/google-chrome";

function decodeMermaid(text) {
  return String(text)
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .trim();
}

function extractBlocks(html) {
  return [...String(html).matchAll(/<pre class="mermaid">([\s\S]*?)<\/pre>/gi)].map((m) => decodeMermaid(m[1]));
}

function renderSvgs(sources) {
  if (!sources.length) return [];
  const dir = mkdtempSync(join(tmpdir(), "mm-"));
  const page = join(dir, "render.html");
  const payload = JSON.stringify(sources);
  const bundle = readFileSync(mermaidMin, "utf8");
  writeFileSync(
    page,
    `<!doctype html><meta charset="utf-8"><body>
<script>${bundle}</script>
<script>
(async function () {
  var sources = ${payload};
  mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "neutral" });
  var out = [];
  for (var i = 0; i < sources.length; i++) {
    var r = await mermaid.render("m" + i, sources[i]);
    out.push(r.svg);
  }
  var json = JSON.stringify(out);
  var b64 = btoa(unescape(encodeURIComponent(json)));
  document.documentElement.setAttribute("data-svgs-b64", b64);
  document.documentElement.setAttribute("data-done", "1");
})();
</script>
</body>`,
  );
  const result = spawnSync(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--virtual-time-budget=20000",
      "--dump-dom",
      `file://${page}`,
    ],
    { encoding: "utf8", maxBuffer: 32 * 1024 * 1024, timeout: 60000 },
  );
  rmSync(dir, { recursive: true, force: true });
  if (result.status !== 0) {
    throw new Error(`mermaid chrome failed: ${result.stderr || result.stdout || result.status}`);
  }
  const dumped = result.stdout || "";
  const attr = dumped.match(/data-svgs-b64="([^"]*)"/);
  if (!attr) throw new Error("mermaid render produced no SVGs");
  const b64 = attr[1].replaceAll("&#x3D;", "=").replaceAll("&quot;", '"');
  const json = Buffer.from(b64, "base64").toString("utf8");
  const svgs = JSON.parse(json);
  if (svgs.length !== sources.length) throw new Error(`mermaid svg count ${svgs.length} != ${sources.length}`);
  return svgs.map((svg) => String(svg).replace(/<script[\s\S]*?<\/script>/gi, ""));
}

export function stripMermaidRuntime(html) {
  return String(html)
    .replace(/<script type="module">[\s\S]*?mermaid[\s\S]*?<\/script>\s*/gi, "")
    .replace(/<script[^>]+src="https?:\/\/[^"]*mermaid[^"]*"[^>]*>\s*<\/script>\s*/gi, "");
}

/** Light plate so mermaid node labels stay ≥4.5:1 in both themes. */
export const MERMAID_WRAP_CSS =
  ".mermaid-wrap{background:#f5f5f7;color:#1d1d1f;border-radius:12px;padding:12px 8px;overflow-x:auto}" +
  ".mermaid-wrap svg text,.mermaid-wrap svg tspan,.mermaid-wrap svg .nodeLabel,.mermaid-wrap svg .edgeLabel," +
  ".mermaid-wrap svg foreignObject,.mermaid-wrap svg foreignObject *{color:#1d1d1f!important;fill:#1d1d1f!important;background:transparent!important}";

export function wrapMermaidSvg(svg) {
  const markup = String(svg);
  if (markup.includes("mermaid-wrap")) return markup;
  return `<div class="mermaid-wrap">${markup}</div>`;
}

export function ensureMermaidWrapCss(html) {
  const out = String(html);
  if (out.includes(".mermaid-wrap{") || out.includes(".mermaid-wrap {")) return out;
  if (/<\/style>/i.test(out)) return out.replace(/<\/style>/i, `${MERMAID_WRAP_CSS}</style>`);
  if (/<\/head>/i.test(out)) return out.replace(/<\/head>/i, `<style>${MERMAID_WRAP_CSS}</style></head>`);
  return `<style>${MERMAID_WRAP_CSS}</style>${out}`;
}

export function ensureReportImageFlex(html) {
  let out = ensureMermaidWrapCss(html);
  if (!/figure\s+(?:picture\s+)?img[^}]*height\s*:\s*auto/.test(out) && !/img\{[^}]*height:\s*auto/.test(out)) {
    out = out.replace(/<\/style>/i, "figure img,figure picture img,img,svg{max-width:100%;height:auto}</style>");
  } else if (!/svg\{[^}]*height:\s*auto/.test(out)) {
    out = out.replace(/<\/style>/i, "svg{max-width:100%;height:auto}</style>");
  }
  return out;
}

export async function replaceMermaidWithSvg(html) {
  const sources = extractBlocks(html);
  let out = String(html);
  if (sources.length) {
    const svgs = renderSvgs(sources);
    let i = 0;
    out = out.replace(/<pre class="mermaid">[\s\S]*?<\/pre>/gi, () => wrapMermaidSvg(svgs[i++]));
  }
  out = out.replace(/<svg\b[^>]*(?:class="flowchart"|aria-roledescription="flowchart-v2")[^>]*>[\s\S]*?<\/svg>/gi, (svg, offset) => {
    const before = out.slice(Math.max(0, offset - 80), offset);
    if (before.includes("mermaid-wrap")) return svg;
    return wrapMermaidSvg(svg);
  });
  return ensureMermaidWrapCss(stripMermaidRuntime(out));
}
