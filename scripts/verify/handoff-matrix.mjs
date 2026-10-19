/** Pre-handoff gate: all site pages × light/dark × JS on/off. Reuses QA click + contrast ideas. */
import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");
const distDir = process.env.DIST_DIR || join(root, "dist");
const BASE = (process.env.BASE || "http://127.0.0.1:8261/ai-frontier-trends/").replace(/\/?$/, "/");
const OUT = process.env.OUT || join(root, "preview", "remaining-a", "handoff-matrix.json");
const CHROME = process.env.CHROME || "/usr/bin/google-chrome";

function walkHtml(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkHtml(full, acc);
    else if (name === "index.html" || name === "report.html") acc.push(full);
  }
  return acc;
}

function pagePath(file) {
  const rel = relative(distDir, file).split("\\").join("/");
  if (rel === "index.html") return "";
  if (rel.endsWith("/index.html")) return rel.slice(0, -"index.html".length);
  return rel;
}

const CONTRAST = `(() => {
  const chan = (c) => {
    const m = (c.match(/[\\d.]+/g) || []).map(Number);
    const srgb = /color\\(srgb/i.test(c);
    const rgb = m.slice(0, 3).map((v) => (srgb ? v : v / 255));
    const a = m.length > 3 ? m[3] : 1;
    return [...rgb, a];
  };
  const lum = (c) => {
    const [r, g, b, a] = chan(c);
    const f = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return [0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b), a];
  };
  const paint = (v) => v && v !== "none" && v !== "transparent" && !String(v).includes("0, 0, 0, 0") && !String(v).endsWith(", 0)");
  const bgOf = (el) => {
    const svgHost = el.closest?.("svg");
    if (svgHost && (el.closest("foreignObject") || el.tagName === "text" || el.tagName === "tspan" || el.closest(".nodeLabel") || el.closest(".edgeLabel"))) {
      const node = el.closest("g.node, g.cluster, g.edgeLabel, g.label") || el.closest("g");
      const shape = node?.querySelector("rect, polygon, circle, ellipse, path");
      if (shape) {
        const fill = getComputedStyle(shape).fill;
        if (paint(fill)) return fill;
        const attr = shape.getAttribute("fill");
        if (paint(attr)) return attr;
      }
      const plate = el.closest(".mermaid-wrap");
      if (plate) {
        const plateBg = getComputedStyle(plate).backgroundColor;
        if (lum(plateBg)[1] > 0.5) return plateBg;
      }
    }
    let e = el;
    while (e) {
      const b = getComputedStyle(e).backgroundColor;
      const a = lum(b)[1];
      if (a > 0.5) return b;
      e = e.parentElement;
    }
    const root = getComputedStyle(document.documentElement).backgroundColor;
    if (lum(root)[1] > 0.5) return root;
    return document.documentElement.dataset.theme === "dark" ? "rgb(20, 20, 19)" : "rgb(250, 249, 246)";
  };
  window.__ratio = (el) => {
    const cs = getComputedStyle(el);
    let color = cs.color;
    if (el instanceof SVGElement || el.tagName === "text" || el.tagName === "tspan") {
      if (paint(cs.fill)) color = cs.fill;
    }
    const [l1] = lum(color);
    const bg = bgOf(el);
    const [l2] = lum(bg);
    const r = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    return { ratio: +r.toFixed(2), color, bg, size: cs.fontSize, weight: cs.fontWeight };
  };
})()`;

const HEAD_BODY = "h1,h2,h3,h4,h5,h6,p,li,td,th,blockquote,figcaption,summary,body,a,svg text,svg tspan,svg foreignObject,svg foreignObject *";
const STAR = '[{"id":"x-bfl-klein","title":"t","url":"","source":"s","date":""}]';

function vp(w) {
  return w === 375
    ? { viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }
    : { viewport: { width: 1280, height: 900 } };
}

async function snap(page) {
  try {
  return await page.evaluate(() => {
    const m = document.querySelector("main") || document.body;
    if (!m) {
      return { url: location.href, theme: null, pref: null, dom: 0, y: 0, stars: null, nojs: false, js: false };
    }
    let h = 0;
    const s =
      m.innerHTML +
      "|exp" +
      document.querySelectorAll("[aria-expanded=true]").length +
      "|open" +
      [...document.querySelectorAll("details,dialog")].filter((d) => d.open).length +
      "|hiddenLb" +
      (document.getElementById("lightbox")?.hidden !== false) +
      "|hash" +
      location.hash;
    for (let i = 0; i < s.length; i++) h = ((h * 31 + s.charCodeAt(i)) | 0);
    const sel = [...document.querySelectorAll("[aria-pressed],[aria-current],[aria-selected],[aria-expanded]")]
      .map((el) => [el.getAttribute("data-ft-filter") || el.id || el.tagName, el.getAttribute("aria-pressed"), el.getAttribute("aria-current"), el.getAttribute("aria-selected"), el.getAttribute("aria-expanded")].join(":"))
      .join(";");
    const active = document.activeElement
      ? `${document.activeElement.tagName}:${document.activeElement.id || document.activeElement.getAttribute("name") || ""}`
      : "";
    return {
      url: location.href,
      theme: document.documentElement.getAttribute("data-theme"),
      pref: localStorage.getItem("ft:theme"),
      dom: h,
      y: Math.round(scrollY),
      stars: localStorage.getItem("ft:starred:v1"),
      sel,
      active,
      nojs: document.documentElement.classList.contains("no-js"),
      js: document.documentElement.classList.contains("js"),
    };
  });
  } catch {
    return { url: page.url(), theme: null, pref: null, dom: -1, y: 0, stars: null, nojs: false, js: false };
  }
}

function r4For(href, abs, pageUrl, pageName, text) {
  if (!abs || !href) return "";
  if (href.startsWith("#")) return "";
  try {
    const cur = new URL(pageUrl);
    const t = new URL(abs, cur);
    const strip = (u) => u.origin + u.pathname.replace(/index\.html$/, "");
    if (/example\.com/.test(t.host)) return "example.com";
    if (strip(t) === strip(cur) && !t.hash && !t.search) return "指向当前页";
    const home = new URL(BASE);
    if (strip(t) === strip(home) && pageName !== "/" && !t.search && !t.hash && !/精选|首页|前沿趋势|home/i.test(text || "")) return "首页兜底?";
  } catch {
    return "";
  }
  return "";
}

const pages = walkHtml(distDir)
  .map(pagePath)
  .filter((p) => !p.includes("hot-empty") && !p.includes("daily-empty"))
  .sort();

const phonePages = new Set(["", "live/", "hot/", "daily/", "more/", "weekly/2026-10-18/", "timeline/", "flux3/cases/"]);

const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
const rows = [];
const contrastRows = [];
const r4hits = [];
const r5hits = [];
let clickPass = 0;
let clickFail = 0;
let contrastPass = 0;
let contrastFail = 0;

async function visit(path, w, theme, js) {
  const ctx = await browser.newContext({ ...vp(w), javaScriptEnabled: js });
  if (theme && js) {
    await ctx.addInitScript((t) => {
      localStorage.setItem("ft:theme", t);
    }, theme);
  }
  await ctx.addInitScript((s) => {
    if (location.pathname.includes("/starred/") && !localStorage.getItem("ft:starred:v1")) {
      localStorage.setItem("ft:starred:v1", s);
    }
  }, STAR);
  const page = await ctx.newPage();
  const url = BASE + path;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(js ? 350 : 150);
  return { ctx, page };
}

async function scanContrastAndLinks(path, w, theme, js) {
  const pname = path === "" ? "/" : `/${path}`;
  const { ctx, page } = await visit(path, w, theme, js);
  await page.evaluate(CONTRAST);
  const afterBoot = await page.evaluate(() => ({
    nojs: document.documentElement.classList.contains("no-js"),
    js: document.documentElement.classList.contains("js"),
    theme: document.documentElement.getAttribute("data-theme"),
  }));
  if (js && afterBoot.nojs) {
    contrastRows.push({ path: pname, w, theme, js: js ? "on" : "off", ok: false, reason: "no-js stuck on" });
    contrastFail += 1;
  }
  const contrast = await page.evaluate((sel) => {
    const bad = [];
    let n = 0;
    for (const el of document.querySelectorAll(sel)) {
      const own = [...el.childNodes]
        .filter((x) => x.nodeType === 3 && x.textContent.trim())
        .map((x) => x.textContent.trim())
        .join("");
      if (!own) continue;
      const rc = el.getBoundingClientRect();
      if (rc.width < 1 || rc.height < 1) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none" || el.closest("[hidden]")) continue;
      n += 1;
      const x = __ratio(el);
      const themeNow = document.documentElement.getAttribute("data-theme") || "light";
      const min = el.tagName === "A" && themeNow !== "dark" ? 5.5 : 4.5;
      if (x.ratio < min) bad.push({ txt: own.slice(0, 24), tag: el.tagName, min, ...x });
    }
    return { checked: n, below: bad.length, worst: bad.sort((a, b) => a.ratio - b.ratio).slice(0, 5) };
  }, HEAD_BODY);
  const okC = contrast.below === 0 && !(js && afterBoot.nojs);
  if (okC) contrastPass += 1;
  else if (!(js && afterBoot.nojs)) contrastFail += 1;
  contrastRows.push({ path: pname, w, theme, js: js ? "on" : "off", ok: okC, ...contrast, boot: afterBoot });

  const links = await page.evaluate(() =>
    [...document.querySelectorAll("a[href]")].map((a) => ({
      text: (a.innerText || a.getAttribute("aria-label") || "").trim().slice(0, 40),
      href: a.getAttribute("href"),
      abs: a.href,
    })),
  );
  for (const link of links) {
    const hit = r4For(link.href, link.abs, page.url(), pname, link.text);
    if (hit) r4hits.push({ path: pname, w, theme, js: js ? "on" : "off", ...link, r4: hit });
    if (link.href && link.href.startsWith("/") && !link.href.startsWith("//")) {
      r5hits.push({ path: pname, href: link.href });
    }
  }
  await ctx.close();
  console.log(JSON.stringify({ t: "contrast", path: pname, w, theme, js: js ? "on" : "off", below: contrast.below, nojs: afterBoot.nojs }));
}

async function clickControls(path, w, js) {
  const pname = path === "" ? "/" : `/${path}`;
  const theme = "light";
  const { ctx, page } = await visit(path, w, theme, js);
  const els = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll("a[href], button, [role=button], summary, input:not([type=hidden]), select").forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (r.width < 1 || r.height < 1 || cs.visibility === "hidden" || cs.display === "none") return;
      if (el.closest("[hidden]")) return;
      out.push({
        i,
        tag: el.tagName.toLowerCase(),
        text: (el.innerText || el.getAttribute("aria-label") || el.title || "").trim().replace(/\s+/g, " ").slice(0, 40),
        href: el.getAttribute("href"),
        zoom: el.classList.contains("zoom"),
      });
    });
    return out;
  });
  await ctx.close();

  let zoomSeen = 0;
  const seenHref = new Set();
  const toClick = els.filter((e) => {
    if (e.zoom) {
      zoomSeen += 1;
      return zoomSeen <= 4;
    }
    if (e.tag === "a" && e.href) {
      if (seenHref.has(e.href)) return false;
      seenHref.add(e.href);
    }
    return true;
  });

  const { ctx: c, page: p } = await visit(path, w, theme, js);
  let popup = null;
  c.on("page", (np) => {
    popup = np;
  });
  const startUrl = p.url();
  for (const e of toClick) {
    if (p.url() !== startUrl) {
      await p.goto(startUrl, { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
      await p.waitForTimeout(js ? 200 : 80);
    }
    popup = null;
    await p.evaluate(() => {
      let i = 0;
      document.querySelectorAll("a[href], button, [role=button], summary, input:not([type=hidden]), select").forEach((el) => {
        el.setAttribute("data-qa-i", String(i++));
      });
    });
    const before = await snap(p);
    let err = null;
    if (/回到顶部|顶部/.test(e.text)) {
      await p.evaluate(() => window.scrollTo(0, 1600));
      await p.waitForTimeout(150);
      const b2 = await snap(p);
      before.y = b2.y;
    }
    try {
      await p.evaluate((i) => document.querySelector(`[data-qa-i="${i}"]`)?.click(), e.i);
    } catch (x) {
      err = String(x).split("\n")[0].slice(0, 140);
    }
    await p.waitForTimeout(180);
    let after;
    try {
      after = await snap(p);
    } catch {
      after = { url: p.url() };
    }
    const changes = [];
    let beforeU;
    let afterU;
    try {
      beforeU = new URL(before.url);
      afterU = new URL(after.url);
    } catch {
      beforeU = null;
      afterU = null;
    }
    const samePath = !!(beforeU && afterU && beforeU.pathname === afterU.pathname);
    const queryOnly = !!(beforeU && afterU && samePath && beforeU.search !== afterU.search && beforeU.hash === afterU.hash);
    const hashChanged = !!(beforeU && afterU && samePath && beforeU.hash !== afterU.hash);
    if (after.theme !== before.theme || after.pref !== before.pref) changes.push("主题");
    if (after.dom !== before.dom) changes.push("DOM");
    if (after.y !== before.y) changes.push("滚动");
    if (after.stars !== before.stars) changes.push("收藏");
    if (after.sel !== before.sel) changes.push("选中");
    if (after.active !== before.active) changes.push("焦点");
    if (popup) changes.push("新标签");
    if (after.url !== before.url) {
      if (!samePath) changes.push("URL");
      else if (hashChanged) changes.push("锚点");
      else if (queryOnly && (after.dom !== before.dom || after.sel !== before.sel)) changes.push("筛选");
    }
    const absHref = e.href ? new URL(e.href, startUrl).href : "";
    if (!popup && e.tag === "a" && /^https?:/.test(absHref) && !absHref.startsWith(BASE.replace(/\/ai-frontier-trends\/$/, ""))) {
      changes.push("外链");
    }
    const r4 = e.tag === "a" ? r4For(e.href, absHref, BASE + path, pname, e.text) : "";
    const urlOnly = queryOnly && !changes.length;
    const ok = changes.length > 0 && !r4 && !urlOnly;
    if (ok) clickPass += 1;
    else clickFail += 1;
    rows.push({
      path: pname,
      w,
      theme,
      js: js ? "on" : "off",
      tag: e.tag,
      text: e.text,
      href: e.href,
      changes: changes.join("+") || "无",
      ok,
      r4,
      err,
    });
  }
  await c.close();
  console.log(JSON.stringify({ t: "clicks", path: pname, w, js: js ? "on" : "off", controls: toClick.length, unique: toClick.length, raw: els.length }));
}

if (process.env.SKIP_CONTRAST !== "1") {
  for (const path of pages) {
    for (const theme of ["light", "dark"]) {
      for (const js of [true, false]) {
        for (const w of [1280, 375]) {
          if (w === 375 && !phonePages.has(path)) continue;
          await scanContrastAndLinks(path, w, theme, js);
        }
      }
    }
  }
} else {
  console.log(JSON.stringify({ t: "contrast", skipped: true, note: "reuse QA matrix-contrast 112/0" }));
}

if (process.env.SKIP_CLICKS === "1") {
  console.log(JSON.stringify({ t: "clicks", skipped: true }));
} else {
  for (const path of pages) {
    for (const js of [true, false]) {
      for (const w of [1280, 375]) {
        if (w === 375 && !phonePages.has(path)) continue;
        await clickControls(path, w, js);
      }
    }
  }
}

await browser.close();

const summary = {
  pages: pages.map((p) => (p === "" ? "/" : `/${p}`)),
  pageCount: pages.length,
  clickPass,
  clickFail,
  contrastPass,
  contrastFail,
  r4: r4hits.length,
  r5: r5hits.length,
  clickFailures: rows.filter((r) => !r.ok),
  contrastFailures: contrastRows.filter((r) => !r.ok),
  r4hits,
  r5hits,
  generatedAt: new Date().toISOString(),
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ summary, contrastRows, rows }, null, 2));
console.log(JSON.stringify(summary, null, 2));
if (clickFail || contrastFail || r4hits.length || r5hits.length) process.exit(1);
