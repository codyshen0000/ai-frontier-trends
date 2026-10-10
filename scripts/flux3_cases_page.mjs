import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";

const CAT_DIR = {
  t2i: "text-to-image",
  edit: "edit",
  multi_ref: "multi-reference",
  layout: "layout",
};

const CAT_LABEL = {
  t2i: "文生图",
  edit: "编辑",
  multi_ref: "多参考",
  layout: "布局",
};

const IMAGE_EXT = /\.(webp|png|jpe?g|gif)$/i;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function copyImages(from, to) {
  if (!existsSync(from)) return 0;
  let n = 0;
  for (const name of readdirSync(from)) {
    const src = join(from, name);
    const dest = join(to, name);
    if (statSync(src).isDirectory()) {
      n += copyImages(src, dest);
      continue;
    }
    if (!IMAGE_EXT.test(name)) continue;
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest);
    n += 1;
  }
  return n;
}

function readPrompt(casesRoot, rec) {
  const files = rec.image_files || [];
  const dir = files.length ? join(casesRoot, dirname(files[0])) : join(casesRoot, CAT_DIR[rec.category] || "", rec.id);
  const txtPath = join(dir, "prompt.txt");
  if (existsSync(txtPath)) {
    const text = readFileSync(txtPath, "utf8").replace(/^\uFEFF/, "");
    if (text.trim()) return text.replace(/\s+$/, "");
  }
  const fromMeta = String(rec.prompt || "").trim();
  if (fromMeta) return fromMeta;
  const caption = String(rec.caption || "").trim();
  if (caption) return caption;
  return "";
}

function findLocalImages(casesRoot, rec) {
  const files = rec.image_files || [];
  const listed = files.filter((f) => existsSync(join(casesRoot, f)));
  const roles = rec.roles || [];
  const byRole = {};
  listed.forEach((f, i) => {
    const role = roles[i] || "";
    const base = f.split("/").pop() || "";
    if (role) byRole[role] = f;
    else if (/^before\./i.test(base)) byRole.before = f;
    else if (/^after\./i.test(base)) byRole.after = f;
    else if (/^result\./i.test(base)) byRole.result = f;
    else if (/^ref/i.test(base)) {
      byRole.refs = byRole.refs || [];
      byRole.refs.push(f);
    }
  });
  if (!byRole.refs) {
    const extras = listed.filter((f) => /^ref\d*\./i.test(f.split("/").pop() || ""));
    if (extras.length) byRole.refs = extras;
  }
  return { listed, byRole };
}

function imgTag(rel, alt) {
  const src = `./${escapeHtml(rel)}`;
  return `<button type="button" class="zoom" data-full="${src}" aria-label="查看大图：${escapeHtml(alt)}"><img src="${src}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async"></button>`;
}

function renderMedia(rec, byRole, listed) {
  const title = rec.title || rec.id;
  if (rec.category === "edit" && (byRole.before || byRole.after)) {
    const before = byRole.before ? `<figure>${imgTag(byRole.before, `${title} · 编辑前`)}<figcaption>编辑前</figcaption></figure>` : "";
    const after = byRole.after ? `<figure>${imgTag(byRole.after, `${title} · 编辑后`)}<figcaption>编辑后</figcaption></figure>` : "";
    return `<div class="ba-row">${before}${after}</div>`;
  }
  const result = byRole.result || listed.find((f) => /result\./i.test(f)) || listed[listed.length - 1];
  const refs = byRole.refs || [];
  let html = "";
  if (result) html += `<figure class="case-result">${imgTag(result, title)}</figure>`;
  if (refs.length) {
    html += `<div class="ref-row">${refs
      .map((f, i) => `<figure>${imgTag(f, `${title} · 参考 ${i + 1}`)}<figcaption>参考 ${i + 1}</figcaption></figure>`)
      .join("")}</div>`;
  }
  return html;
}

function renderPrompt(prompt, title) {
  if (!prompt) {
    return `<p class="ex-meta">文档未提供独立 prompt；案例标题为官方英文说明。</p>
<p class="case-title-as-prompt">${escapeHtml(title)}</p>`;
  }
  const block = `<pre class="case-prompt"><code>${escapeHtml(prompt)}</code></pre>`;
  if (prompt.length > 280) {
    return `<details class="case-prompt-wrap"><summary>官方 prompt（英文原文，${prompt.length} 字）</summary>${block}</details>`;
  }
  return `<div class="case-prompt-wrap"><p class="ex-meta">官方 prompt（英文原文）</p>${block}</div>`;
}

export function copyCaseAssets(root, distDir) {
  const src = join(root, "flux3-official-cases");
  const dest = join(distDir, "flux3", "cases");
  return copyImages(src, dest);
}

export function casesGalleryBody(root) {
  const casesRoot = join(root, "flux3-official-cases");
  const records = readFileSync(join(casesRoot, "manifest.jsonl"), "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  const counts = { t2i: 0, edit: 0, multi_ref: 0, layout: 0 };
  for (const rec of records) counts[rec.category] = (counts[rec.category] || 0) + 1;
  const total = records.length;

  const cards = records
    .map((rec) => {
      const { listed, byRole } = findLocalImages(casesRoot, rec);
      const prompt = readPrompt(casesRoot, rec);
      const title = rec.title || rec.id;
      const source = rec.source_page && String(rec.source_page).startsWith("https://docs.bfl.ml")
        ? rec.source_page
        : "";
      const cat = rec.category;
      return `<article class="ds-card case-card" data-cat="${escapeHtml(cat)}" id="${escapeHtml(rec.id)}">
  <p class="ex-meta"><span class="badge">${escapeHtml(CAT_LABEL[cat] || cat)}</span>${
    source ? ` · <a href="${escapeHtml(source)}">来源</a>` : ""
  }</p>
  <h3>${escapeHtml(title)}</h3>
  ${renderMedia(rec, byRole, listed)}
  ${renderPrompt(prompt, title)}
</article>`;
    })
    .join("\n");

  return `<article class="cases-doc">
  <h1 class="ds-section-title">FLUX 3 Image 官方案例</h1>
  <p class="lede"><strong>一句话结论：官方文档共 ${total} 条 FLUX 3 Image 有图案例——文生图 ${counts.t2i}、编辑 ${counts.edit}、多参考 ${counts.multi_ref}、布局 ${counts.layout}——均为文档原图与英文 prompt，未改像素。</strong></p>
  <p class="sister-nav">相关页：<a href="../">FLUX 3 提示词速查表</a> · <a href="../examples/">官方示例库</a> · <a href="../camera-terms/">相机术语表</a> · <a href="../../">首页</a></p>
  <p class="ex-meta">抓取自 <a href="https://docs.bfl.ml/flux_3/flux3_image_overview">BFL FLUX 3 Image</a> 文档（2026-10-09）。图片按原文件提供，未重编码。</p>
  <div class="case-filters" role="tablist" aria-label="案例类别">
    <button type="button" data-filter="all" aria-selected="true">全部 ${total}</button>
    <button type="button" data-filter="t2i">文生图 ${counts.t2i}</button>
    <button type="button" data-filter="edit">编辑 ${counts.edit}</button>
    <button type="button" data-filter="multi_ref">多参考 ${counts.multi_ref}</button>
    <button type="button" data-filter="layout">布局 ${counts.layout}</button>
  </div>
  <div class="case-grid" id="case-grid">${cards}</div>
  <script>
    (function () {
      var tabs = document.querySelectorAll(".case-filters button");
      var cards = document.querySelectorAll(".case-card");
      tabs.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var f = btn.getAttribute("data-filter");
          tabs.forEach(function (b) { b.setAttribute("aria-selected", b === btn ? "true" : "false"); });
          cards.forEach(function (c) {
            c.hidden = f !== "all" && c.getAttribute("data-cat") !== f;
          });
        });
      });
    })();
  </script>
</article>`;
}

export function casesSummary(root) {
  const casesRoot = join(root, "flux3-official-cases");
  const records = readFileSync(join(casesRoot, "manifest.jsonl"), "utf8")
    .split("\n")
    .filter(Boolean);
  return `官方文档 ${records.length} 条 FLUX 3 Image 案例：文生图、编辑、多参考与布局原图。`;
}
