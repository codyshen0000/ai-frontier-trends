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

function sourceChips(card, escapeHtml) {
  if (!card.sources.length) return "";
  return card.sources
    .map((source) => {
      const mark = card.firstParty ? '<span class="ft-daily-hand">一手</span>' : "";
      return `<a class="ft-daily-chip" href="${escapeHtml(source.href)}" target="_blank" rel="noopener">${escapeHtml(source.name)}${mark}</a>`;
    })
    .join("");
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

function calendarHtml(current, days, editions, { escapeHtml }) {
  const grid = monthGrid(current, days);
  const heads = WEEK_HEADS.map((d) => `<span>${d}</span>`).join("");
  const cells = grid.cells
    .map((cell) => {
      if (cell.state === "pad") return `<span class="ft-daily-cell is-pad" aria-hidden="true"></span>`;
      if (cell.state === "none") return `<span class="ft-daily-cell is-none">${cell.n}</span>`;
      const href = `#d-${cell.iso}`;
      const cls = cell.state === "current" ? "is-current" : "is-issue";
      return `<a class="ft-daily-cell ${cls}" data-ft-cal="${escapeHtml(cell.iso)}" href="${href}">${cell.n}</a>`;
    })
    .join("");

  const list = days
    .map((iso) => {
      const edition = editions.find((item) => item.day === iso);
      const mark = formatZhDate(iso);
      const title = edition?.lead?.title || `${mark.short} 日报`;
      const currentCls = iso === current ? " is-current" : "";
      return `<a class="ft-daily-past${currentCls}" data-ft-cal="${escapeHtml(iso)}" href="#d-${iso}">
        <span class="ft-daily-past-n">${Number(iso.slice(8, 10))}</span>
        <span class="ft-daily-past-w">星期${mark.long.slice(-1)}</span>
        <span class="ft-daily-past-t">${escapeHtml(title)}</span>
      </a>`;
    })
    .join("");

  return `<aside class="ft-daily-cal" aria-label="往期">
    <p class="ft-daily-cal-kicker">往期</p>
    <p class="ft-daily-cal-month">${escapeHtml(grid.title)}</p>
    <div class="ft-daily-grid" aria-label="${escapeHtml(grid.monthWord)}">
      <div class="ft-daily-week">${heads}</div>
      <div class="ft-daily-days">${cells}</div>
    </div>
    <p class="ft-daily-cal-note">${escapeHtml(grid.note)}</p>
    <div class="ft-daily-pasts">${list}</div>
  </aside>`;
}

function masthead(edition, escapeHtml) {
  const { day, date, stats } = edition;
  const [year, month, dom] = day.split("-");
  const week = date.long.slice(-1);
  const line = `前沿趋势日报 · ${Number(year)} 年 ${Number(month)} 月 ${Number(dom)} 日 · 星期${week}`;
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
    <p class="ft-daily-dateline">${escapeHtml(line)}</p>
    <div class="ft-daily-nameplate">
      <div class="ft-daily-name">
        <p class="ft-daily-brand">前沿趋势</p>
        <h1>日报</h1>
        <p class="ft-daily-imprint">前沿热点看板 · 按存档日整理</p>
      </div>
      <div class="ft-daily-eye" aria-hidden="true">
        <p class="ft-daily-eye-fig">${Number(dom)}</p>
        <p class="ft-daily-eye-top">${Number(year)} 年 ${Number(month)} 月</p>
        <p class="ft-daily-eye-bot">星期${week}</p>
      </div>
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
    <div class="ft-daily-lead">
      <p class="ft-daily-kicker">头条</p>
      <h2>${storyLink(lead, escapeHtml)}</h2>
      ${lead.summary ? `<p class="ft-daily-dek">${escapeHtml(lead.summary)}</p>` : ""}
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
          return `<article class="ft-daily-story" id="c-${escapeHtml(card.id)}">
            <h3>${storyLink(card, escapeHtml)}</h3>
            ${card.summary ? `<p>${escapeHtml(card.summary)}</p>` : ""}
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

function issueHtml(edition, ctx, { hidden = false } = {}) {
  const { escapeHtml } = ctx;
  const pages = edition.sections.map((section, i) => sectionPage(edition, section, i, escapeHtml)).join("");
  return `<article class="ft-daily-issue" data-ft-issue="${escapeHtml(edition.day)}" id="d-${escapeHtml(edition.day)}"${hidden ? " hidden" : ""}>
    ${masthead(edition, escapeHtml)}
    ${frontPage(edition, ctx)}
    ${pages}
    <p class="ft-daily-end">（本期完）</p>
    <p class="ft-daily-colo">前沿趋势日报根据公开报道整理，每条都附原文。材料来自当前看板存档日，不另写事实。</p>
  </article>`;
}

const SWITCH_JS = `<script data-ds-injected="daily">
(function () {
  var issues = document.querySelectorAll("[data-ft-issue]");
  if (!issues.length) return;
  function dayFromHash() {
    var m = location.hash.match(/^#d-(\\d{4}-\\d{2}-\\d{2})/);
    return m ? m[1] : issues[0].getAttribute("data-ft-issue");
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
      el.classList.toggle("is-current", el.getAttribute("data-ft-cal") === day);
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
    .map((edition, index) => issueHtml(edition, { escapeHtml, hrefBetween }, { hidden: index > 0 }))
    .join("");
  const updated = meta.updatedAt ? `看板更新于 ${escapeHtml(meta.updatedAt)}` : "";

  return `<div class="ft-daily" data-ds-generated="daily">
  <div class="ft-daily-frame">
    ${calendarHtml(current.day, days, editions, { escapeHtml })}
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
