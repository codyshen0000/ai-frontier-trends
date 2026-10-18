/** Idempotent live.html → 精选 homepage transform. Source markup is not edited. */
import { extractLiveSpotlight } from "./extract.mjs";
import { extractLiveCards, formatZhDate, groupByDay, rankHot, selectPins } from "./live_cards.mjs";

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

function sourceLine(card, escapeHtml) {
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

function pinCard(card, { escapeHtml, hrefBetween }) {
  const href = `${hrefBetween("/live/", "/hot/")}#h-${encodeURIComponent(card.id)}`;
  const count = card.sourceCount || 1;
  return `<a class="ft-pin" href="${href}">
      <p class="ft-pin-kicker">${escapeHtml(String(count))} 家独立源</p>
      <h3>${escapeHtml(card.title)}</h3>
      <p class="ft-pin-meta">${escapeHtml(formatZhDate(card.day).short)} · ${escapeHtml(sourceLine(card, escapeHtml))}</p>
    </a>`;
}

function storyCard(card, escapeHtml) {
  const primary = card.sources[0]?.href || `#c-${card.id}`;
  return `<article class="ft-story" id="c-${escapeHtml(card.id)}" data-ft-card data-id="${escapeHtml(card.id)}" data-day="${escapeHtml(card.day)}" data-sources="${card.sourceCount}">
      <p class="ft-story-kicker">${card.section ? `<span>${escapeHtml(card.section)}</span>` : ""}${card.focus ? `<span class="ft-focus">重点</span>` : ""}</p>
      <h3><a href="${escapeHtml(primary)}"${card.sources[0] ? ' target="_blank" rel="noopener"' : ""}>${escapeHtml(card.title)}</a></h3>
      ${card.summary ? `<p class="ft-story-sum">${escapeHtml(card.summary)}</p>` : ""}
      <p class="ft-story-meta">
        <span>来源：${sourceLinks(card, escapeHtml)}</span>
        <span>${escapeHtml(card.time || formatZhDate(card.day).short)}</span>
        <span class="ft-heat">${card.sourceCount} 源</span>
      </p>
    </article>`;
}

export function renderCuratedHome(cards, meta, { escapeHtml, hrefBetween }) {
  const pins = selectPins(cards, 4);
  const pinIds = new Set(pins.map((card) => card.id));
  const groups = groupByDay(cards, pinIds);
  const pinHtml = pins.map((card) => pinCard(card, { escapeHtml, hrefBetween })).join("");
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
  return `${CURATE_START}<div class="ft-curate" data-ds-injected="live-curate">
  <header class="ft-pagehead">
    <div>
      <p class="ft-kicker">当前热点</p>
      <h1>前沿热点看板</h1>
    </div>
    ${updated ? `<p class="ft-updated">${updated}</p>` : ""}
  </header>
  <section class="ft-pins" aria-label="当前热点">
    <div class="ft-pin-grid">${pinHtml}</div>
    <p class="ft-pins-foot"><a href="${hrefBetween("/live/", "/hot/")}">查看热点榜</a></p>
  </section>
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

export function hotPageBody(cards, meta, { escapeHtml }) {
  const ranked = rankHot(cards);
  const max = Math.max(1, ...ranked.map((card) => card.sourceCount));
  const rows = ranked
    .map((card, index) => {
      const width = Math.max(12, Math.round((card.sourceCount / max) * 100));
      return `<li class="ft-rank" id="h-${escapeHtml(card.id)}">
        <span class="ft-rank-n">${index + 1}</span>
        <div class="ft-rank-body">
          <h2>${escapeHtml(card.title)}</h2>
          <p class="ft-rank-meta">${card.sourceCount} 源${card.section ? ` · ${escapeHtml(card.section)}` : ""} · ${escapeHtml(formatZhDate(card.day).short)}</p>
          ${card.summary ? `<p class="ft-rank-sum">${escapeHtml(card.summary)}</p>` : ""}
          <p class="ft-story-meta">来源：${sourceLinks(card, escapeHtml)}</p>
        </div>
        <div class="ft-rank-heat" title="独立来源 ${card.sourceCount}">
          <span style="width:${width}%"></span>
          <em>${card.sourceCount}</em>
        </div>
      </li>`;
    })
    .join("");

  return `<header class="ft-pagehead">
    <div>
      <p class="ft-kicker">按独立来源数排序</p>
      <h1>热点榜</h1>
    </div>
    ${meta.updatedAt ? `<p class="ft-updated">更新于 ${escapeHtml(meta.updatedAt)}</p>` : ""}
  </header>
  <p class="ft-lede">取自当前看板存档窗，热度只计独立来源，不使用可刷的点赞或转发。</p>
  <ol class="ft-rank-list">${rows || `<li class="ft-empty">这一期还没有可排名的条目。</li>`}</ol>`;
}

export function morePageBody({ hrefBetween, escapeHtml }) {
  const groups = [
    {
      title: "研究资产",
      items: [
        { label: "研究主页 · 本周主线", href: hrefBetween("/more/", "/"), note: "结论先行的主线与读法" },
        { label: "时间线", href: hrefBetween("/more/", "/timeline/"), note: "主线修订史" },
        { label: "推翻信号", href: hrefBetween("/more/", "/signals/"), note: "让判断加强或翻盘的证据" },
        { label: "权重待交付", href: hrefBetween("/more/", "/weights/"), note: "已宣布、尚未放出的权重" },
        { label: "周报", href: hrefBetween("/more/", "/weekly/"), note: "按周归纳升降与改写" },
      ],
    },
    {
      title: "工具与站点",
      items: [
        { label: "看板 Studio", href: "https://codyshen0000.github.io/studio/", note: "KPI / 表 / 图分析", external: true },
        { label: "FLUX 3 专题", href: hrefBetween("/more/", "/flux3/"), note: "速查表、案例与术语" },
        { label: "关于", href: hrefBetween("/more/", "/about/"), note: "材料来源与标签" },
        { label: "个人主页", href: "https://codyshen0000.github.io/", note: "学术主页入口", external: true },
        { label: "原始看板", href: hrefBetween("/more/", "/live/") + "#board", note: "Hub、分类过滤、待交付表" },
      ],
    },
  ];

  const blocks = groups
    .map((group) => {
      const links = group.items
        .map((item) => {
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
  </header>
  <p class="ft-lede">Studio 和专题不占首页。主线、信号、权重和时间线都从这里进。</p>
  ${blocks}`;
}

export { extractLiveCards, rankHot, selectPins };
