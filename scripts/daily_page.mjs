/** Build-time newspaper for /daily/ from live.html cards. Does not edit live.html. */
import { formatZhDate } from "./live_cards.mjs";

const SECTION_ORDER = ["大模型", "生图/生视频", "产品和工具", "研究论文"];
const CHARS_PER_MINUTE = 400;
const WEEK_HEADS = ["一", "二", "三", "四", "五", "六", "日"];
const CN_MONTH = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];

function pad(n) {
  return String(n).padStart(2, "0");
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function mondayLead(year, month) {
  return (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
}

function charCount(card) {
  return `${card.title || ""}${card.summary || ""}`.replace(/\s+/g, "").length;
}

function readingMinutes(cards) {
  const chars = cards.reduce((sum, card) => sum + charCount(card), 0);
  return Math.max(1, Math.round(chars / CHARS_PER_MINUTE) || 1);
}

function storyMinutes(card) {
  return Math.max(1, Math.round(charCount(card) / CHARS_PER_MINUTE) || 1);
}

function isModelRelease(card) {
  if (card.section !== "大模型") return false;
  if (card.firstParty || card.tags?.some((tag) => tag.includes("新闻"))) return true;
  return /开源权重|上线|发布|落地|预训练/.test(card.title);
}

function uniqueSources(cards) {
  const hosts = new Set();
  for (const card of cards) {
    for (const source of card.sources) hosts.add(source.host || source.name);
  }
  return hosts.size;
}

export function latestDay(cards) {
  return cards.reduce((max, card) => (card.day > max ? card.day : max), "");
}

export function editionDays(cards) {
  return [...new Set(cards.map((card) => card.day))].sort().reverse();
}

export function deriveStats(cards) {
  const models = cards.filter(isModelRelease).length;
  const firstParty = cards.filter((card) => card.firstParty).length;
  return {
    events: cards.length,
    sources: uniqueSources(cards),
    firstParty,
    models,
    minutes: readingMinutes(cards),
  };
}

function scoreCard(card) {
  return (
    card.sourceCount * 10 +
    (card.focus ? 6 : 0) +
    (card.firstParty ? 4 : 0) +
    (card.summary ? 2 : 0) +
    (card.old ? -6 : 0)
  );
}

function sortStories(list) {
  return [...list].sort(
    (a, b) =>
      scoreCard(b) - scoreCard(a) ||
      b.day.localeCompare(a.day) ||
      a.title.localeCompare(b.title, "zh"),
  );
}

export function buildEdition(cards, day) {
  const dayCards = sortStories(cards.filter((card) => card.day === day));
  const lead = dayCards[0] || null;
  const rest = dayCards.slice(1);
  const highlights = rest.slice(0, 3);
  const used = new Set([lead?.id, ...highlights.map((card) => card.id)].filter(Boolean));
  const bySection = new Map();
  for (const card of rest.filter((item) => !used.has(item.id))) {
    const label = card.section || "其它";
    if (!bySection.has(label)) bySection.set(label, []);
    bySection.get(label).push(card);
  }
  const sections = [
    ...SECTION_ORDER.filter((label) => bySection.has(label)).map((label) => ({
      label,
      items: bySection.get(label),
    })),
    ...[...bySection.keys()]
      .filter((label) => !SECTION_ORDER.includes(label))
      .map((label) => ({ label, items: bySection.get(label) })),
  ];
  return {
    day,
    cards: dayCards,
    lead,
    highlights,
    sections,
    stats: deriveStats(dayCards),
    date: formatZhDate(day),
  };
}

function sourceRole(card, index) {
  const tags = (card.tags || []).join(" ");
  if (card.firstParty && index === 0) return "一手";
  if (/转述/.test(tags)) return "转述";
  return "来源";
}

const HEAT_KEY = /热度|heat|基准|跑分|benchmark/i;

export function extractSummaryFacts(summary) {
  const text = String(summary || "").trim();
  if (!text) return [];
  const rows = [];
  const seen = new Set();
  const push = (key, value) => {
    const k = String(key || "").replace(/\s+/g, " ").trim();
    const v = String(value || "").replace(/\s+/g, " ").trim();
    if (!k || !v || k.length > 16 || v.length > 48) return;
    if (HEAT_KEY.test(k) || HEAT_KEY.test(v)) return;
    if (!text.includes(k) || !text.includes(v)) return;
    const id = `${k}\0${v}`;
    if (seen.has(id)) return;
    seen.add(id);
    rows.push({ key: k, value: v });
  };

  const colonRe = /(?:^|[、；。\n])\s*([^、；。:\n：]{1,16}?)\s*[：:]\s*([^、；。\n]{1,48})/g;
  let match;
  while ((match = colonRe.exec(text))) push(match[1], match[2]);

  const aboutRe =
    /(?:^|[、；。\s])([A-Za-z\u4e00-\u9fff][A-Za-z0-9\u4e00-\u9fff./-]{0,12})\s*(约\s*[0-9][0-9A-Za-z./%+]{0,24})/g;
  while ((match = aboutRe.exec(text))) push(match[1], match[2]);

  const pctRe =
    /(?:^|[、；。\s])([A-Za-z\u4e00-\u9fff][A-Za-z0-9\u4e00-\u9fff.+/-]{1,16})\s*(\d+(?:\.\d+)?%(?:\s*[（(][^）)]{0,24}[）)])?)/g;
  while ((match = pctRe.exec(text))) push(match[1], match[2]);

  return rows.slice(0, 4);
}

export function factRows(card) {
  const rows = [];
  if (card.section) rows.push({ key: "栏目", value: card.section });
  if (card.tags?.length) rows.push({ key: "标签", value: card.tags.join("、") });
  if (card.sourceCount > 0) rows.push({ key: "独立来源", value: String(card.sourceCount) });
  if (card.firstParty === true || card.firstParty === false) {
    rows.push({ key: "一手", value: card.firstParty ? "是" : "否" });
  }
  if (card.sources?.[0]?.host) rows.push({ key: "主链", value: card.sources[0].host });
  for (const fact of extractSummaryFacts(card.summary)) {
    if (rows.some((row) => row.key === fact.key && row.value === fact.value)) continue;
    rows.push(fact);
  }
  return rows.filter((row) => !HEAT_KEY.test(row.key) && row.value);
}

function vizTable(headers, rows, caption, escapeHtml) {
  if (!rows.length) return "";
  const head = headers.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("");
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("");
  return `<div class="ft-daily-item-viz-wrap"><table>
      <caption class="ft-daily-sr">${escapeHtml(caption)}</caption>
      <thead><tr>${head}</tr></thead>
      <tbody>${body}</tbody>
    </table></div>`;
}

function factTable(card, escapeHtml) {
  const rows = factRows(card);
  if (rows.length < 2) return "";
  return vizTable(
    ["项", "值"],
    rows.map((row) => [row.key, row.value]),
    "本条要点",
    escapeHtml,
  );
}

function sourceTable(card, escapeHtml) {
  if (!card.sources?.length) return "";
  return vizTable(
    ["来源名", "host", "角色"],
    card.sources.map((source, index) => [source.name || source.host, source.host || "", sourceRole(card, index)]),
    "本条来源",
    escapeHtml,
  );
}

function fallbackTable(card, escapeHtml) {
  return factTable(card, escapeHtml) || sourceTable(card, escapeHtml);
}

function coverFigure(card, escapeHtml) {
  const src = card.cover || card.image;
  if (!src) return "";
  return `<figure class="ft-daily-item-fig">
      <img src="${escapeHtml(src)}" alt="" loading="lazy" decoding="async" onerror="var f=this.closest('figure'); if(f) f.hidden=true;">
    </figure>`;
}

export function itemVizKind(card) {
  if (card.tablesHtml?.length) return card.cover || card.image ? "table+image" : "table";
  if (card.cover || card.image) return factRows(card).length >= 2 || card.sources?.length ? "image+table" : "image";
  if (factRows(card).length >= 2) return "facts";
  if (card.sources?.length) return "sources";
  return "";
}

export function itemViz(card, escapeHtml) {
  const parts = [];
  if (card.tablesHtml?.length) {
    parts.push(
      card.tablesHtml
        .map((html) => `<div class="ft-daily-item-viz-wrap ft-daily-item-live">${html}</div>`)
        .join(""),
    );
  }
  const figure = coverFigure(card, escapeHtml);
  if (figure) parts.push(figure);
  if (!card.tablesHtml?.length) {
    const fallback = fallbackTable(card, escapeHtml);
    if (fallback) parts.push(fallback);
  }
  if (!parts.length) return "";
  const kind = itemVizKind(card);
  return `<div class="ft-daily-item-viz" data-viz="${escapeHtml(kind)}" data-id="${escapeHtml(card.id)}">${parts.join("")}</div>`;
}

export function editionVisibleItems(edition) {
  return [edition.lead, ...edition.sections.flatMap((section) => section.items)].filter(Boolean);
}

export function editionVizReport(edition) {
  const items = editionVisibleItems(edition);
  const missing = items.filter((card) => !itemVizKind(card)).map((card) => card.id);
  return {
    total: items.length,
    withViz: items.length - missing.length,
    missing,
    ratio: items.length ? (items.length - missing.length) / items.length : 1,
  };
}

function sourceChips(card, escapeHtml) {
  if (!card.sources.length) return "";
  const primary = card.sources[0];
  const rest = card.sources.slice(1);
  const mark = card.firstParty ? '<span class="ft-daily-hand">一手</span>' : "";
  const primaryChip = `<a class="ft-daily-chip" href="${escapeHtml(primary.href)}" target="_blank" rel="noopener">${escapeHtml(primary.name)}${mark}</a>`;
  const more = rest.length
    ? `<span class="ft-daily-chip is-more" title="${escapeHtml(rest.map((source) => source.name).join("、"))}">另外 ${rest.length} 家</span>`
    : "";
  const orig = `<a class="ft-daily-chip is-orig" href="${escapeHtml(primary.href)}" target="_blank" rel="noopener">原文</a>`;
  return `${primaryChip}${more}${orig}`;
}

function storyLink(card, escapeHtml) {
  const href = card.sources[0]?.href;
  if (!href) return escapeHtml(card.title);
  return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener">${escapeHtml(card.title)}</a>`;
}

function monthGrid(day, issueDays) {
  const [year, month] = day.split("-").map(Number);
  const total = daysInMonth(year, month);
  const lead = mondayLead(year, month);
  const have = new Set(issueDays);
  const cells = [];
  for (let i = 0; i < lead; i += 1) cells.push({ state: "pad" });
  for (let n = 1; n <= total; n += 1) {
    const iso = `${year}-${pad(month)}-${pad(n)}`;
    cells.push({
      iso,
      n,
      state: iso === day ? "current" : have.has(iso) ? "issue" : "none",
    });
  }
  return {
    title: `${year} 年 ${month} 月`,
    monthWord: `${CN_MONTH[month]}月`,
    note: `本月 ${have.size} 个存档日`,
    cells,
  };
}

function kindSwitch({ hrefBetween }) {
  return `<nav class="ft-daily-kinds" aria-label="成刊">
    <a class="is-on" href="./" aria-current="page">日报</a>
    <a href="${hrefBetween("/daily/", "/weekly/")}">周报</a>
    <span class="is-off" title="尚无月报存档">月报</span>
  </nav>`;
}

function pastRow(iso, current, editions, escapeHtml) {
  const edition = editions.find((item) => item.day === iso);
  const mark = formatZhDate(iso);
  const title = edition?.lead?.title || `${mark.short} 日报`;
  const currentCls = iso === current ? " is-current" : "";
  const curAttr = iso === current ? ' aria-current="true"' : "";
  return `<a class="ft-daily-past${currentCls}" data-ft-cal="${escapeHtml(iso)}" href="#d-${iso}"${curAttr}>
        <span class="ft-daily-past-n">${Number(iso.slice(8, 10))}</span>
        <span class="ft-daily-past-meta">
          <span class="ft-daily-past-w">星期${mark.long.slice(-1)}</span>
          <span class="ft-daily-past-t">${escapeHtml(title)}</span>
        </span>
      </a>`;
}

function pastList(current, days, editions, escapeHtml) {
  const groups = [];
  for (const iso of days) {
    const key = iso.slice(0, 7);
    let group = groups.find((item) => item.key === key);
    if (!group) {
      const [year, month] = key.split("-");
      group = { key, label: `${Number(year)} 年 ${Number(month)} 月`, items: [] };
      groups.push(group);
    }
    group.items.push(iso);
  }
  return groups
    .map((group) => {
      const rows = group.items.map((iso) => pastRow(iso, current, editions, escapeHtml)).join("");
      return `<div class="ft-daily-month">
      <p class="ft-daily-monthhead"><span>${escapeHtml(group.label)}</span><em>${group.items.length}</em></p>
      <div class="ft-daily-pasts">${rows}</div>
    </div>`;
    })
    .join("");
}

function chromeHtml(current, days, editions, ctx) {
  const { escapeHtml } = ctx;
  return `<aside class="ft-daily-chrome" aria-label="往期">
    ${kindSwitch(ctx)}
    <p class="ft-daily-kicker">往期</p>
    ${pastList(current, days, editions, escapeHtml)}
  </aside>`;
}

function calendarCard(edition, days, escapeHtml) {
  const grid = monthGrid(edition.day, days);
  const [year, month, dom] = edition.day.split("-");
  const heads = WEEK_HEADS.map((d) => `<span>${d}</span>`).join("");
  const dots = grid.cells
    .map((cell) => {
      if (cell.state === "pad") return `<span class="ft-daily-dot is-pad" aria-hidden="true"></span>`;
      if (cell.state === "none") {
        return `<span class="ft-daily-dot is-none" title="${Number(month)}月${cell.n}日"></span>`;
      }
      const cls = cell.state === "current" ? "is-current" : "is-issue";
      const label = escapeHtml(formatZhDate(cell.iso).short);
      const cur = cell.state === "current" ? ' aria-current="true"' : "";
      return `<a class="ft-daily-dot ${cls}" data-ft-cal="${escapeHtml(cell.iso)}" href="#d-${cell.iso}" title="${label}" aria-label="${label}"${cur}></a>`;
    })
    .join("");
  return `<div class="ft-daily-card" aria-label="${escapeHtml(grid.title)}">
    <p class="ft-daily-card-day">${Number(dom)}</p>
    <p class="ft-daily-card-month">${escapeHtml(grid.monthWord)} · 星期${escapeHtml(formatZhDate(edition.day).long.slice(-1))}</p>
    <div class="ft-daily-cal">
      <div class="ft-daily-week">${heads}</div>
      <div class="ft-daily-dots">${dots}</div>
    </div>
    <p class="ft-daily-card-date">${Number(year)} 年 ${Number(month)} 月 ${Number(dom)} 日</p>
  </div>`;
}

function masthead(edition, days, escapeHtml) {
  const { day, date, stats } = edition;
  const [year, month, dom] = day.split("-");
  const week = date.long.slice(-1);
  const metrics = [
    { value: stats.events, unit: "件大事" },
    { value: stats.sources, unit: "个来源" },
    { value: stats.firstParty, unit: "件一手" },
  ];
  if (stats.models > 0) metrics.push({ value: stats.models, unit: "个新模型" });
  const metricHtml = metrics
    .map((item) => `<span class="ft-daily-metric"><b>${item.value}</b>${escapeHtml(item.unit)}</span>`)
    .join("");

  return `<header class="ft-daily-mast">
    <p class="ft-daily-dateline">
      <span>${Number(year)} 年 ${Number(month)} 月 ${Number(dom)} 日星期${escapeHtml(week)}</span>
      <span>前沿热点看板</span>
      <span>按存档日整理</span>
    </p>
    <div class="ft-daily-nameplate">
      <div class="ft-daily-name">
        <h1>日报</h1>
        <p class="ft-daily-imprint">前沿趋势日报</p>
      </div>
      ${calendarCard(edition, days, escapeHtml)}
    </div>
    <p class="ft-daily-stats">${metricHtml}<span class="ft-daily-read">约 ${stats.minutes} 分钟读完</span></p>
  </header>`;
}

function frontPage(edition, { escapeHtml, hrefBetween }) {
  const { lead, highlights, sections } = edition;
  if (!lead) return `<p class="ft-empty">这一天还没有可整理的条目。</p>`;

  const index = sections.map((section, i) => ({
    n: pad(i + 1),
    label: section.label,
    count: `${section.items.length} 件`,
    href: `#s-${edition.day}-${i + 1}`,
  }));

  const highlightHtml = highlights
    .map((card, i) => {
      const href = card.sources[0]?.href || `${hrefBetween("/daily/", "/live/")}#c-${card.id}`;
      return `<li>
        <span class="ft-daily-num">${i + 1}</span>
        <div>
          <a href="${escapeHtml(href)}"${card.sources[0] ? ' target="_blank" rel="noopener"' : ""}>${escapeHtml(card.title)}</a>
          <p>${escapeHtml(card.sources[0]?.name || card.section || "")}${card.section ? ` · ${escapeHtml(card.section)}` : ""}</p>
        </div>
      </li>`;
    })
    .join("");

  const indexHtml = index
    .map(
      (item) => `<a href="${escapeHtml(item.href)}">
        <span>${escapeHtml(item.n)}</span>
        <strong>${escapeHtml(item.label)}</strong>
        <em>${escapeHtml(item.count)}</em>
      </a>`,
    )
    .join("");

  return `<section class="ft-daily-front" id="d-${escapeHtml(edition.day)}-front">
    <div class="ft-daily-lead" data-id="${escapeHtml(lead.id)}">
      <p class="ft-daily-kicker">头条</p>
      <h2>${storyLink(lead, escapeHtml)}</h2>
      ${lead.summary ? `<p class="ft-daily-dek">${escapeHtml(lead.summary)}</p>` : ""}
      ${itemViz(lead, escapeHtml)}
      <p class="ft-daily-lead-meta">
        ${sourceChips(lead, escapeHtml)}
        <span class="ft-daily-mins">约 ${storyMinutes(lead)} 分钟</span>
      </p>
    </div>
    <aside class="ft-daily-rail">
      ${
        highlights.length
          ? `<p class="ft-daily-kicker">今日看点</p><ol class="ft-daily-look">${highlightHtml}</ol>`
          : ""
      }
      ${
        index.length
          ? `<p class="ft-daily-kicker">本期版面</p><nav class="ft-daily-index" aria-label="本期版面">${indexHtml}</nav>`
          : ""
      }
    </aside>
  </section>`;
}

function sectionPage(edition, section, index, escapeHtml) {
  const no = pad(index + 1);
  const rows = [];
  for (let i = 0; i < section.items.length; i += 2) {
    rows.push(section.items.slice(i, i + 2));
  }
  const rowHtml = rows
    .map((row) => {
      const cells = row
        .map((card) => {
          return `<article class="ft-daily-story" id="c-${escapeHtml(card.id)}" data-id="${escapeHtml(card.id)}">
            <h3>${storyLink(card, escapeHtml)}</h3>
            ${card.summary ? `<p>${escapeHtml(card.summary)}</p>` : ""}
            ${itemViz(card, escapeHtml)}
            <p class="ft-daily-story-meta">
              ${sourceChips(card, escapeHtml)}
              <span class="ft-daily-mins">约 ${storyMinutes(card)} 分钟</span>
            </p>
          </article>`;
        })
        .join("");
      return `<div class="ft-daily-row">${cells}</div>`;
    })
    .join("");

  return `<section class="ft-daily-page" id="s-${escapeHtml(edition.day)}-${index + 1}">
    <h2 class="ft-daily-pagehead"><span>${escapeHtml(no)}</span>${escapeHtml(section.label)}</h2>
    ${rowHtml}
  </section>`;
}

function neighbours(edition, days, escapeHtml) {
  const i = days.indexOf(edition.day);
  const newer = i > 0 ? days[i - 1] : "";
  const older = i >= 0 && i < days.length - 1 ? days[i + 1] : "";
  const cell = (iso, label) => {
    if (!iso) return `<span class="ft-daily-nb is-empty"></span>`;
    return `<a class="ft-daily-nb" href="#d-${iso}">
      <span>${escapeHtml(label)} · ${escapeHtml(formatZhDate(iso).short)}</span>
    </a>`;
  };
  if (!newer && !older) return "";
  return `<nav class="ft-daily-nbs" aria-label="相邻存档日">${cell(older, "前一日")}${cell(newer, "后一日")}</nav>`;
}

function issueHtml(edition, days, ctx, { hidden = false } = {}) {
  const { escapeHtml } = ctx;
  const pages = edition.sections.map((section, i) => sectionPage(edition, section, i, escapeHtml)).join("");
  return `<article class="ft-daily-issue" data-ft-issue="${escapeHtml(edition.day)}" id="d-${escapeHtml(edition.day)}"${hidden ? " hidden" : ""}>
    ${masthead(edition, days, escapeHtml)}
    ${frontPage(edition, ctx)}
    ${pages}
    ${neighbours(edition, days, escapeHtml)}
    <p class="ft-daily-end">（本期完）</p>
    <p class="ft-daily-colo">前沿趋势日报根据公开报道整理，每条都附原文。材料来自当前看板存档日，不另写事实。</p>
  </article>`;
}

const SWITCH_JS = `<script data-ds-injected="daily">
(function () {
  var issues = document.querySelectorAll("[data-ft-issue]");
  if (!issues.length) return;
  function dayFromHash() {
    var h = location.hash;
    var m = h.match(/^#d-(\\d{4}-\\d{2}-\\d{2})/);
    if (m) return m[1];
    if (h && h.length > 1) {
      try {
        var target = document.querySelector(h);
        var issue = target && target.closest("[data-ft-issue]");
        if (issue) return issue.getAttribute("data-ft-issue");
      } catch (e) {}
    }
    var visible = document.querySelector("[data-ft-issue]:not([hidden])");
    return (visible || issues[0]).getAttribute("data-ft-issue");
  }
  function show(day) {
    var known = false;
    issues.forEach(function (el) {
      var on = el.getAttribute("data-ft-issue") === day;
      el.hidden = !on;
      if (on) known = true;
    });
    if (!known) {
      issues[0].hidden = false;
      day = issues[0].getAttribute("data-ft-issue");
    }
    document.querySelectorAll("[data-ft-cal]").forEach(function (el) {
      var on = el.getAttribute("data-ft-cal") === day;
      el.classList.toggle("is-current", on);
      if (on) el.setAttribute("aria-current", "true");
      else el.removeAttribute("aria-current");
      if (el.classList.contains("ft-daily-dot")) {
        el.classList.toggle("is-issue", !on);
      }
    });
  }

  show(dayFromHash());
  window.addEventListener("hashchange", function () { show(dayFromHash()); });
})();
</script>`;

export function dailyPageBody(cards, meta, { escapeHtml, hrefBetween }) {
  const days = editionDays(cards);
  const editions = days.map((day) => buildEdition(cards, day));
  const current = editions[0];
  if (!current) {
    return `<div class="ft-daily"><p class="ft-empty">这一期还没有可整理的日报条目。</p></div>`;
  }

  const papers = editions
    .map((edition, index) => issueHtml(edition, days, { escapeHtml, hrefBetween }, { hidden: index > 0 }))
    .join("");
  const updated = meta.updatedAt ? `看板更新于 ${escapeHtml(meta.updatedAt)}` : "";

  return `<div class="ft-daily" data-ds-generated="daily">
  <div class="ft-daily-phonekinds">${kindSwitch({ escapeHtml, hrefBetween })}</div>
  <div class="ft-daily-frame">
    ${chromeHtml(current.day, days, editions, { escapeHtml, hrefBetween })}
    <div class="ft-daily-paper">
      ${papers}
      <p class="ft-daily-foot">
        ${updated}
        · <a href="${hrefBetween("/daily/", "/live/")}">精选</a>
        · <a href="${hrefBetween("/daily/", "/hot/")}">热点榜</a>
      </p>
    </div>
  </div>
  ${SWITCH_JS}
</div>`;
}
