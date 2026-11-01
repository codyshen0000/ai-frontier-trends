/** Idempotent live.html → 精选 homepage transform. Source markup is not edited. */
import { extractLiveSpotlight } from "./extract.mjs";
import { clipSummary, extractLiveCards, formatZhDate, groupByDay, rankHot, selectPins } from "./live_cards.mjs";
import { HEAT_METHOD_COPY } from "./engine/heat-copy.mjs";

const CURATE_START = "<!--ds-live-curate:start-->";
const CURATE_END = "<!--ds-live-curate:end-->";
const ARCHIVE_START = "<!--ds-live-archive:start-->";
const ARCHIVE_END = "<!--ds-live-archive:end-->";

export function stripLiveCurate(html) {
  return String(html)
    .replace(new RegExp(`${CURATE_START}[\\s\\S]*?${CURATE_END}\\s*`, "g"), "")
    .replace(new RegExp(`${ARCHIVE_START}\\s*<div[^>]*data-ds-injected="live-archive"[^>]*>\\s*(<p class="ft-board-back">[\\s\\S]*?<\\/p>)?`, "i"), "")
    .replace(new RegExp(`<\\/div>\\s*${ARCHIVE_END}`, "i"), "");
}

function sourceLine(card) {
  if (!card.sources.length) return "来源待核";
  const names = card.sources.map((source) => source.name);
  if (names.length === 1) return names[0];
  return `${names.slice(0, 3).join("、")}${names.length > 3 ? " 等" : ""}`;
}

function sourceLinks(card, escapeHtml) {
  if (!card.sources.length) return `<span>来源待核</span>`;
  return card.sources
    .map(
      (source) =>
        `<a href="${escapeHtml(source.href)}" target="_blank" rel="noopener">${escapeHtml(source.label || source.name)}</a>`,
    )
    .join('<span class="ft-dot" aria-hidden="true">·</span>');
}

function moreHint(card, escapeHtml) {
  const rest = card.sources.slice(1);
  if (!rest.length) return "";
  return `<span class="ft-also" title="${escapeHtml(rest.map((source) => source.name).join("、"))}">另外 ${rest.length} 家</span>`;
}

function padRank(n) {
  return String(n).padStart(2, "0");
}

function nowRow(card, index, { escapeHtml, hrefBetween }) {
  const href = `${hrefBetween("/live/", "/hot/")}#h-${encodeURIComponent(card.id)}`;
  const count = card.sourceCount || 1;
  return `<li>
      <a class="ft-now-item" href="${href}">
        <span class="ft-now-n">${padRank(index + 1)}</span>
        <span class="ft-now-body">
          <span class="ft-now-title">${escapeHtml(card.title)}</span>
          <span class="ft-now-meta">${count} 家独立源 · ${escapeHtml(sourceLine(card))}</span>
        </span>
      </a>
    </li>`;
}

function storyCard(card, escapeHtml) {
  const primary = card.sources[0]?.href || `#c-${card.id}`;
  const sourceName = card.sources[0]?.name || "来源待核";
  const sum = clipSummary(card.summary, 96);
  return `<article class="ft-story" id="c-${escapeHtml(card.id)}" data-ft-card data-id="${escapeHtml(card.id)}" data-day="${escapeHtml(card.day)}" data-sources="${card.sourceCount}">
      <p class="ft-story-kicker"><span class="ft-story-src">${escapeHtml(sourceName)}</span>${card.section ? `<span>${escapeHtml(card.section)}</span>` : ""}${card.focus ? `<span class="ft-focus">重点</span>` : ""}</p>
      <h3><a href="${escapeHtml(primary)}"${card.sources[0] ? ' target="_blank" rel="noopener"' : ""}>${escapeHtml(card.title)}</a></h3>
      ${sum ? `<p class="ft-story-sum">${escapeHtml(sum)}</p>` : ""}
      <p class="ft-story-meta">
        <span>${escapeHtml(formatZhDate(card.day).short)}</span>
        ${moreHint(card, escapeHtml)}
      </p>
    </article>`;
}

export function renderCuratedHome(cards, meta, { escapeHtml, hrefBetween }) {
  const pins = selectPins(cards, 5);
  const groups = groupByDay(cards);
  const nowHtml = pins.map((card, index) => nowRow(card, index, { escapeHtml, hrefBetween })).join("");
  const feed = groups
    .map(([day, list]) => {
      const label = formatZhDate(day);
      return `<section class="ft-day" data-day="${escapeHtml(day)}">
        <h2 class="ft-day-rule"><time datetime="${escapeHtml(day)}">${escapeHtml(label.short)}</time></h2>
        <div class="ft-day-list">${list.map((card) => storyCard(card, escapeHtml)).join("")}</div>
      </section>`;
    })
    .join("");

  const updated = meta.updatedAt ? `更新于 ${escapeHtml(meta.updatedAt)}` : "";
  const nowPanel = pins.length
    ? `<section class="ft-now" aria-label="当前热点">
    <div class="ft-now-head">
      <h2>当前热点</h2>
      <p class="ft-now-foot"><a href="${hrefBetween("/live/", "/hot/")}">进热点榜</a><span class="ft-dot" aria-hidden="true">·</span><a href="${hrefBetween("/live/", "/daily/")}">看日报</a></p>
    </div>
    <ol class="ft-now-list">${nowHtml}</ol>
  </section>`
    : "";
  return `${CURATE_START}<div class="ft-curate" id="curated" data-ds-injected="live-curate">
  <header class="ft-pagehead">
    <div>
      <p class="ft-kicker">精选</p>
      <h1>前沿热点看板</h1>
    </div>
    ${updated ? `<p class="ft-updated">${updated}</p>` : ""}
  </header>
  ${nowPanel}
  <div class="ft-feed">${feed || `<p class="ft-empty">这一期还没有可展开的精选条目。</p>`}</div>
  <p class="ft-board-link"><a href="#board">查看原始看板（Hub / 主线 / 待交付）</a></p>
</div>${CURATE_END}`;
}

export function curateLivePage(html, ctx) {
  const raw = stripLiveCurate(html);
  const cards = extractLiveCards(raw);
  const meta = extractLiveSpotlight(raw);
  const chrome = renderCuratedHome(cards, meta, ctx);
  if (!/<main\b/i.test(raw)) {
    return `${chrome}${ARCHIVE_START}<div class="ft-live-archive" data-ds-injected="live-archive" id="ft-board" hidden>${raw}</div>${ARCHIVE_END}`;
  }
  return raw
    .replace(/<main\b[^>]*>/i, (open) => `${open}${chrome}${ARCHIVE_START}<div class="ft-live-archive" data-ds-injected="live-archive" id="ft-board" hidden><p class="ft-board-back"><a href="#curated">返回精选</a></p>`)
    .replace(/<\/main>/i, `</div>${ARCHIVE_END}</main>`);
}

function hotHero(card, escapeHtml) {
  const sum = clipSummary(card.summary, 180);
  return `<article class="ft-hot-hero" id="h-${escapeHtml(card.id)}">
      <p class="ft-hot-badge"><span class="ft-hot-no">NO.01</span><span class="ft-heat">${card.sourceCount} 家独立源</span></p>
      <h2>${escapeHtml(card.title)}</h2>
      ${sum ? `<p class="ft-hot-sum">${escapeHtml(sum)}</p>` : ""}
      <p class="ft-story-meta">
        <span>${card.section ? `${escapeHtml(card.section)} · ` : ""}${escapeHtml(formatZhDate(card.day).short)}</span>
        <span>来源：${sourceLinks(card, escapeHtml)}</span>
        ${moreHint(card, escapeHtml)}
      </p>
    </article>`;
}

function hotRow(card, index, escapeHtml) {
  const sum = clipSummary(card.summary, 88);
  return `<li class="ft-rank ft-hot-row" id="h-${escapeHtml(card.id)}">
        <span class="ft-rank-n">NO.${padRank(index + 1)}</span>
        <div class="ft-rank-body">
          <h2>${escapeHtml(card.title)}</h2>
          ${sum ? `<p class="ft-rank-sum">${escapeHtml(sum)}</p>` : ""}
          <p class="ft-rank-meta"><span class="ft-heat">${card.sourceCount} 家独立源</span>${card.section ? ` · ${escapeHtml(card.section)}` : ""} · ${escapeHtml(formatZhDate(card.day).short)}${card.sourceCount > 1 ? ` · 另外 ${card.sourceCount - 1} 家` : ""}</p>
        </div>
      </li>`;
}

export function hotPageBody(cards, meta, { escapeHtml }) {
  const ranked = rankHot(cards, { limit: 10 });
  const hero = ranked[0] ? hotHero(ranked[0], escapeHtml) : "";
  const rest = ranked.slice(1).map((card, index) => hotRow(card, index + 1, escapeHtml)).join("");

  return `<header class="ft-pagehead">
    <div>
      <p class="ft-kicker">按独立来源数排序</p>
      <h1>热点榜</h1>
    </div>
    ${meta.updatedAt ? `<p class="ft-updated">更新于 ${escapeHtml(meta.updatedAt)}</p>` : ""}
  </header>
  <p class="ft-lede">取自当前看板存档窗的前 10 条。热度只计独立来源，没有 48 小时讨论热度引擎，不编造涨跌或热度分。</p>
  ${hero || `<p class="ft-empty">这一期还没有可排名的条目。</p>`}
  ${rest ? `<ol class="ft-rank-list" aria-label="NO.02 至 NO.10">${rest}</ol>` : ""}
  <aside class="ft-hot-note">
    <h2>热度怎么标的</h2>
    <p>同一条里每家独立域名只算一次。官方博客、仓库、论文页和社交帖分开计数。没有历史快照时不画走势，也不用讨论增速标签。</p>
  </aside>`;
}

export function morePageBody({ hrefBetween, escapeHtml, weeklyPath = "/weekly/" }) {
  const groups = [
    {
      title: "成刊",
      items: [
        { label: "日报", href: hrefBetween("/more/", "/daily/"), note: "按存档日整理的报纸版" },
        { label: "周报", href: hrefBetween("/more/", "/weekly/"), note: "按周归纳升降与改写" },
      ],
    },
    {
      title: "研究资产",
      items: [
        { label: "研究主页 · 本周主线", href: hrefBetween("/more/", weeklyPath), note: "结论先行的主线与读法" },
        { label: "时间线", href: hrefBetween("/more/", "/timeline/"), note: "主线修订史" },
        { label: "推翻信号", href: hrefBetween("/more/", "/signals/"), note: "让判断加强或翻盘的证据" },
        { label: "权重待交付", href: hrefBetween("/more/", "/weights/"), note: "已宣布、已交付与仍待交付的权重" },
      ],
    },
    {
      title: "工具与站点",
      items: [
        { label: "看板 Studio", href: "https://codyshen0000.github.io/studio/", note: "KPI / 表 / 图分析", external: true },
        { label: "FLUX 3 专题", href: hrefBetween("/more/", "/flux3/"), note: "速查表、案例与术语" },
        { label: "关于", href: hrefBetween("/more/", "/about/"), note: "材料来源与标签" },
        { label: "模型榜", href: hrefBetween("/more/", "/leaderboard/"), note: "静态占位，无付费榜数据" },
        { label: "Agent 接入", href: hrefBetween("/more/", "/agent/"), note: "静态占位，不是运营台" },
        { label: "更新日志", href: hrefBetween("/more/", "/changelog/"), note: "本仓库已落地的壳层" },
        { label: "反馈", href: hrefBetween("/more/", "/feedback/"), note: "走仓库 Issues" },
        { label: "RSS", href: "../feed/weekly.xml", note: "订阅周报" },
        { label: "个人主页", href: "https://codyshen0000.github.io/", note: "学术主页入口", external: true },
        { label: "原始看板", href: "", note: "Hub、分类过滤、待交付表已收进精选流，不再单独成页", textOnly: true },
      ],
    },
  ];

  const blocks = groups
    .map((group) => {
      const links = group.items
        .map((item) => {
          if (item.textOnly || !item.href) {
            return `<div class="ft-more-card is-static">
            <h3>${escapeHtml(item.label)}</h3>
            <p>${escapeHtml(item.note)}</p>
          </div>`;
          }
          const extra = item.external ? ' target="_blank" rel="noopener"' : "";
          return `<a class="ft-more-card" href="${escapeHtml(item.href)}"${extra}>
            <h3>${escapeHtml(item.label)}</h3>
            <p>${escapeHtml(item.note)}</p>
          </a>`;
        })
        .join("");
      return `<section class="ft-more-group"><h2>${escapeHtml(group.title)}</h2><div class="ft-more-grid">${links}</div></section>`;
    })
    .join("");

  return `<header class="ft-pagehead">
    <div>
      <p class="ft-kicker">更多</p>
      <h1>研究资产与工具</h1>
    </div>
    <div class="ft-more-theme">
      <p class="ft-kicker">外观</p>
      <button type="button" class="ft-theme-toggle" aria-label="切换配色">☾</button>
    </div>
  </header>
  <p class="ft-lede">时间线、周报、信号和权重收在这里。Studio 和专题不占首页。</p>
  ${blocks}
  <aside class="ft-hot-note">
    <h2>热度怎么算</h2>
    <p data-ft-heat-method>${HEAT_METHOD_COPY}</p>
  </aside>`;
}

export { extractLiveCards, rankHot, selectPins };
