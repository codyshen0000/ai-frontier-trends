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
  const bgOf = (el) => {
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
    const [l1] = lum(cs.color);
    const bg = bgOf(el);
    const [l2] = lum(bg);
    const r = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    return { ratio: +r.toFixed(2), color: cs.color, bg, size: cs.fontSize, weight: cs.fontWeight };
  };
})()`;

const HEAD_BODY = "h1,h2,h3,h4,h5,h6,p,li,td,th,blockquote,figcaption,summary,body";
const STAR = '[{"id":"x-bfl-klein","title":"t","url":"","source":"s","date":""}]';

function vp(w) {
  return w === 375
    ? { viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }
    : { viewport: { width: 1280, height: 900 } };
}

async function snap(page) {
  return page.evaluate(() => {
    const m = document.querySelector("main") || document.body;
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
    return {
      url: location.href,
      theme: document.documentElement.getAttribute("data-theme"),
      pref: localStorage.getItem("ft:theme"),
      dom: h,
      y: Math.round(scrollY),
      stars: localStorage.getItem("ft:starred:v1"),
      nojs: document.documentElement.classList.contains("no-js"),
      js: document.documentElement.classList.contains("js"),
    };
  });
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
    if (strip(t) === strip(home) && pageName !== "/" && !/精选|首页|前沿趋势|home/i.test(text || "")) return "首页兜底?";
  } catch {
    return "";
  }
  return "";
}

const pages = walkHtml(distDir)
  .map(pagePath)
  .filter((p) => !p.includes("hot-empty") && !p.includes("daily-empty"))
  .sort();

const phonePages = new Set(["", "hot/", "daily/", "more/", "weekly/2026-10-18/", "timeline/", "flux3/cases/"]);

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
      if (x.ratio < 4.5) bad.push({ txt: own.slice(0, 24), tag: el.tagName, ...x });
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
  const toClick = els.filter((e) => {
    if (!e.zoom) return true;
    zoomSeen += 1;
    return zoomSeen <= 4;
  });

  for (const e of toClick) {
    const { ctx: c, page: p } = await visit(path, w, theme, js);
    let popup = null;
    c.on("page", (np) => {
      popup = np;
    });
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
      await p.waitForTimeout(250);
      const b2 = await snap(p);
      before.y = b2.y;
    }
    try {
      await p.locator(`[data-qa-i="${e.i}"]`).click({ timeout: 2500 });
    } catch (x) {
      err = String(x).split("\n")[0].slice(0, 140);
    }
    await p.waitForTimeout(350);
    let after;
    try {
      after = await snap(p);
    } catch {
      after = { url: p.url() };
    }
    const changes = [];
    if (after.url !== before.url) changes.push("URL");
    if (after.theme !== before.theme || after.pref !== before.pref) changes.push("主题");
    if (after.dom !== before.dom && after.url === before.url) changes.push("DOM");
    if (after.y !== before.y && after.url === before.url) changes.push("滚动");
    if (after.stars !== before.stars) changes.push("收藏");
    if (popup) changes.push("新标签");
    const absHref = e.href ? new URL(e.href, p.url()).href : "";
    if (!popup && e.tag === "a" && /^https?:/.test(absHref) && !absHref.startsWith(BASE.replace(/\/ai-frontier-trends\/$/, ""))) {
      changes.push("外链");
    }
    const r4 = e.tag === "a" ? r4For(e.href, absHref, BASE + path, pname, e.text) : "";
    const ok = changes.length > 0 && !r4;
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
    await c.close();
  }
  console.log(JSON.stringify({ t: "clicks", path: pname, w, js: js ? "on" : "off", controls: toClick.length }));
}

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

for (const path of pages) {
  for (const js of [true, false]) {
    for (const w of [1280, 375]) {
      if (w === 375 && !phonePages.has(path)) continue;
      await clickControls(path, w, js);
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
