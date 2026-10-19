import type {
  FeedItemSummary,
  HotEntryView,
  HotResponse,
  HotStripEntry,
  ReportCitation,
  ReportDetail,
  ReportNavigationEntry,
  TimelineCard,
  TimelineResponse,
} from "@aihot/contracts/site";
import { RANK_WINDOW_HOURS } from "./constants";
import generated from "./covers.generated.json";

function spark(peak: number, shape: number[]): Array<number | null> {
  const max = Math.max(...shape, 1);
  return shape.map((v) => Math.round((v / max) * peak));
}

const RISE = [18, 20, 22, 28, 35, 40, 48, 55, 62, 70, 78, 88, 95, 100, 92, 90, 88, 85, 86, 90, 94, 97, 99, 100];

function item(partial: Omit<FeedItemSummary, "channel" | "tags" | "x"> & Partial<Pick<FeedItemSummary, "channel" | "tags" | "x">>): FeedItemSummary {
  return { channel: "news", tags: [], x: null, ...partial };
}

function card(key: string, it: FeedItemSummary, extra = 0): TimelineCard {
  return {
    key,
    anchorAt: it.timelineAt,
    item: it,
    group: extra > 0 ? { factId: `fact-${key}`, additionalSourceCount: extra, reportCount: extra + 1 } : null,
  };
}

export const cards: TimelineCard[] = [
  card("flash", item({
    id: "flash-api",
    title: "Flash 变体发布：检索 API 开放，多榜单分数抬升且定价不变",
    summary: "官方同步放出权重与 API。社区对照跑分显示阅读理解与长上下文稳定提升；检索接口可直接挂到现有 RAG 链路。本稿汇总发布说明与首轮第三方复测要点。",
    reason: "一手发布 + 多源跟进，适合作为今日头条事件入口。",
    source: { name: "数字前沿观察" },
    publishedAt: "2026-10-18T10:53:00.000Z",
    timelineAt: "2026-10-18T10:53:00.000Z",
    category: "model",
    selected: true,
  }), 12),
  card("mm816", item({
    id: "mm-816b",
    title: "开源 816B 级多模态权重：训练配方与评测协议一并公开",
    summary: "团队同时释出预训练与对齐阶段配置。首批社区复现集中在视觉定位与长视频理解；算力门槛仍高，但权重许可对二次开发友好。",
    reason: "权重 + 配方双公开，便于对照现有开源基线。",
    source: { name: "Frontier Digest" },
    publishedAt: "2026-10-18T10:37:00.000Z",
    timelineAt: "2026-10-18T10:37:00.000Z",
    category: "model",
    selected: true,
  }), 8),
  card("edge", item({
    id: "edge-nb",
    title: "边缘 AI 笔记本开售：本地 70B 量化推理成为零售卖点",
    summary: "新品强调静音与续航下的本地助手场景。评测口径仍不统一，本稿只摘录厂商声明与两家媒体的同等任务对照。",
    reason: "消费级本地推理叙事升温，适合跟进产品向。",
    source: { name: "硬件周报" },
    publishedAt: "2026-10-18T08:19:00.000Z",
    timelineAt: "2026-10-18T08:19:00.000Z",
    category: "product",
    selected: true,
  }), 6),
  card("agent", item({
    id: "agent-2",
    title: "Agent 编排框架 2.0：工具调用、长任务与沙箱默认开启",
    summary: "更新把多文件编辑与工具权限拆成可审计步骤。演示仓库给出可复用的专家流程，适合对照现有 IDE Agent。",
    reason: "框架默认项变化会影响本周落地清单。",
    source: { name: "工具体验" },
    publishedAt: "2026-10-18T06:02:00.000Z",
    timelineAt: "2026-10-18T06:02:00.000Z",
    category: "product",
    selected: true,
  }), 5),
  card("price", item({
    id: "api-price",
    title: "推理成本再降：新一批 API 调价与缓存策略同步生效",
    summary: "输入缓存命中后单价下探。多家评测用同一套长上下文任务对照，价格与时延需分开读。",
    reason: "定价变动可直接用于是否切换供应商的判断。",
    source: { name: "API 更新日志" },
    publishedAt: "2026-10-18T04:40:00.000Z",
    timelineAt: "2026-10-18T04:40:00.000Z",
    category: "industry",
    selected: false,
  }), 4),
  card("eval", item({
    id: "longctx-eval",
    title: "长上下文评测新协议：避免单一指标误导",
    summary: "新协议把检索、引用与生成分开记分。论文附带公开脚本，社区可复现。",
    reason: "评测口径变化会改写后续模型对比。",
    source: { name: "论文速递" },
    publishedAt: "2026-10-18T02:11:00.000Z",
    timelineAt: "2026-10-18T02:11:00.000Z",
    category: "paper",
    selected: true,
  }), 3),
  card("x-bfl-klein", item({
    id: "x-bfl-klein",
    title: "BFL FLUX 3 Image Klein：开源权重落地（5.6B）",
    summary: "BFL FLUX 3 Image Klein：开源权重落地（5.6B）",
    source: { name: "BFL" },
    publishedAt: "2026-10-16T12:00:00.000Z",
    timelineAt: "2026-10-16T12:00:00.000Z",
    category: "model",
    selected: false,
    channel: "x",
    x: {
      authorName: "BFL",
      handle: "bfl_ai",
      avatarUrl: null,
      media: [],
      quoted: null,
    },
  })),
];

const faces = (names: string[]): HotStripEntry["participants"] =>
  names.map((name, i) => ({ name, kind: i === 0 ? "editorial" : "signal" as const }));

const fixtureHotStrip: HotStripEntry[] = [
  { rank: 1, title: "开源模型侧发布 Flash 变体并开放检索 API", heat: 333, trend: "up", storyPublicId: "st-flash", itemId: "flash-api", participants: faces(["数字前沿", "DeepSeek", "评测组", "X 观察"]), participantCount: 47 },
  { rank: 2, title: "超大参数多模态模型开源，社区复现评测启动", heat: 150, trend: "down", storyPublicId: "st-mm", itemId: "mm-816b", participants: faces(["Frontier", "实验室", "GitHub"]), participantCount: 39 },
  { rank: 3, title: "边缘 AI 笔记本开售，本地推理成为卖点", heat: 86, trend: "up", storyPublicId: "st-edge", itemId: "edge-nb", participants: faces(["硬件周报", "零售观察"]), participantCount: 17 },
  { rank: 4, title: "Agent 编排框架发布 2.0：工具调用与长任务", heat: 80, trend: "up", storyPublicId: "st-agent", itemId: "agent-2", participants: faces(["工具体验", "IDE 插件"]), participantCount: 14 },
  { rank: 5, title: "推理成本再降：新一批 API 调价与缓存策略", heat: 74, trend: "flat", storyPublicId: "st-price", itemId: "api-price", participants: faces(["API 日志", "采购指南"]), participantCount: 11 },
];

function pictureOf(
  row: { coverOurs?: { url: string; srcSet?: string; width: number | null; height: number | null; alt?: string } | null },
) {
  const pic = row.coverOurs;
  if (!pic?.url) return null;
  const alt = String(pic.alt || "").trim();
  if (!alt) throw new Error("coverOurs is missing a public alt");
  return { url: pic.url, srcSet: pic.srcSet, width: pic.width ?? null, height: pic.height ?? null, alt };
}

function generatedHot(): HotResponse {
  const rows = generated.hotEntries ?? [];
  return {
    computedAt: generated.asOf,
    windowHours: RANK_WINDOW_HOURS,
    entries: rows.map((row) => ({
      rank: row.rank,
      story: { publicId: row.storyPublicId, title: row.title },
      heat: row.heat,
      trend: row.trend as HotEntryView["trend"],
      trendPct: row.trendPct,
      badges: row.badges as HotEntryView["badges"],
      participantCount: row.participantCount,
      sourceCount: row.sourceCount,
      sourceNames: row.sourceNames,
      participants: row.participants as HotEntryView["participants"],
      spark: row.spark,
      summary: row.summary,
      latest: row.latest,
      cover: row.rank === 1 ? pictureOf(row) : null,
    })),
  };
}

function hotEntry(rank: number, title: string, heat: number, trend: HotEntryView["trend"], trendPct: number | null, sources: number, people: number, summary: string, latest: string | null, names: string[], badges: HotEntryView["badges"] = []): HotEntryView {
  return {
    rank,
    story: { publicId: `st-${rank}`, title },
    heat,
    trend,
    trendPct,
    badges,
    participantCount: people,
    sourceCount: sources,
    sourceNames: names.slice(0, 2),
    participants: faces(names),
    spark: spark(heat, RISE),
    summary,
    latest,
    cover: null,
  };
}

const fixtureHot: HotResponse = {
  computedAt: "2026-10-18T00:20:00.000Z",
  windowHours: RANK_WINDOW_HOURS,
  entries: [
    hotEntry(1, "开源模型侧发布 Flash 变体并开放检索 API", 333, "down", 11, 15, 47,
      "官方将 Flash 升级为检索增强变体，网页端与 API 同步替换，调用方式与价格不变。社区对照显示阅读与长上下文抬升。",
      "第三方复测称该变体约 1/3 成本达到更强基线的编码表现。",
      ["数字前沿观察", "Yuchen Jin", "Nathan Lambert", "GitHub", "评测组"], ["rising"]),
    hotEntry(2, "超大参数多模态模型开源，社区复现评测启动", 150, "down", 29, 9, 39,
      "权重、配方与评测协议一并公开。社区复现集中在视觉定位与长视频理解。",
      null, ["Frontier Digest", "实验室", "GitHub"]),
    hotEntry(3, "边缘 AI 笔记本开售，本地推理成为卖点", 86, "up", 11, 7, 17,
      "新品强调静音与续航下的本地助手。评测口径尚未统一。",
      null, ["硬件周报", "零售观察", "评测室"]),
    hotEntry(4, "Agent 编排框架发布 2.0：工具调用与长任务", 80, "up", 709, 6, 14,
      "工具权限拆成可审计步骤，演示仓库给出可复用专家流程。",
      null, ["工具体验", "IDE 插件"]),
    hotEntry(5, "推理成本再降：新一批 API 调价与缓存策略", 74, "down", 16, 5, 11,
      "输入缓存命中后单价下探；价格与时延需分开读。",
      null, ["API 更新日志", "采购指南"]),
    hotEntry(6, "长上下文评测新协议：避免单一指标误导", 71, "up", 8, 4, 9,
      "检索、引用与生成分开记分，附带公开脚本。",
      null, ["论文速递", "评测联盟"]),
    hotEntry(7, "开源 ASR 新基线：方言与噪声场景提升", 64, "flat", null, 4, 8,
      "噪声与方言测试集上的字错误率下降，权重可商用。",
      null, ["语音实验室", "开源镜像"]),
    hotEntry(8, "企业知识库采购指南更新：权限与审计条款", 58, "down", 4, 3, 6,
      "新增数据驻留与审计导出要求，适合对照现有合同。",
      null, ["产业观察", "法务摘录"]),
    hotEntry(9, "扩散模型采样加速：一步蒸馏新论文", 52, "up", 6, 3, 7,
      "一步蒸馏在公开基准上接近多步采样，代码待复现。",
      null, ["论文速递", "生成模型组"]),
    hotEntry(10, "开源 IDE Agent 插件周更：多文件编辑稳定", 48, "flat", null, 3, 5,
      "多文件补丁应用成功率提升，适合作为本周工具更新。",
      null, ["工具体验", "插件日志"]),
  ],
};

const fixtureDailyIndex: ReportNavigationEntry[] = [
  { key: "2026-10-18", issueNumber: 18, title: "Flash 变体发布，检索 API 开放", count: 6 },
  { key: "2026-10-17", issueNumber: 17, title: "多模态开源与边缘本对齐", count: 5 },
  { key: "2026-10-16", issueNumber: 16, title: "Agent 工具沙箱成为默认", count: 4 },
  { key: "2026-10-15", issueNumber: 15, title: "长上下文评测口径改写", count: 4 },
  { key: "2026-10-14", issueNumber: 14, title: "推理缓存策略落地", count: 3 },
];

const fixtureDaily: ReportDetail = {
  kind: "daily",
  key: "2026-10-18",
  issueNumber: 18,
  title: "Flash 变体发布，检索 API 开放",
  generatedAt: "2026-10-18T00:00:00.000Z",
  lead: {
    title: "Flash 变体发布，多基准成绩提升且 API 价格不变",
    leadParagraph: "官方将上一版 Flash 升级为检索增强变体，网页端与 API 同步更新，调用方式与价格不变。社区首轮对照显示阅读理解与长上下文稳定抬升，检索接口可直接挂到现有 RAG 链路。",
  },
  leadItemId: "flash-api",
  overview: "今天的主线是开源侧一次可复现的模型升级，其次是多模态权重公开与消费级本地推理硬件开售。",
  highlights: [
    {
      itemId: "flash-api",
      title: "Flash 变体发布，检索 API 开放",
      summary: "权重与 API 同步放出，价格不变。",
      sourceName: "数字前沿观察",
      sourceUrl: "https://example.com/flash",
      sourceIconUrl: null,
      firstParty: true,
      publishedAt: "2026-10-18T10:53:00.000Z",
      available: true,
      otherSources: 12,
    },
    {
      itemId: "mm-816b",
      title: "816B 级多模态权重与配方公开",
      summary: "预训练与对齐配置一并释出。",
      sourceName: "Frontier Digest",
      sourceUrl: "https://example.com/mm",
      sourceIconUrl: null,
      firstParty: false,
      publishedAt: "2026-10-18T10:37:00.000Z",
      available: true,
      otherSources: 8,
    },
  ],
  sections: [
    {
      label: "模型",
      summary: "开源权重与评测口径同步更新。",
      items: [
        {
          itemId: "flash-api",
          title: "Flash 变体：检索增强且定价不变",
          summary: "官方同步网页、App 与 API。首轮第三方复测集中在编码与长上下文。",
          sourceName: "数字前沿观察",
          sourceUrl: "https://example.com/flash",
          sourceIconUrl: null,
          firstParty: true,
          publishedAt: "2026-10-18T10:53:00.000Z",
          available: true,
          otherSources: 12,
        },
        {
          itemId: "mm-816b",
          title: "超大参数多模态开源",
          summary: "配方公开有利于复现，但算力门槛仍高。",
          sourceName: "Frontier Digest",
          sourceUrl: "https://example.com/mm",
          sourceIconUrl: null,
          firstParty: false,
          publishedAt: "2026-10-18T10:37:00.000Z",
          available: true,
          otherSources: 8,
        },
      ],
    },
    {
      label: "产品",
      summary: "本地推理硬件与 Agent 框架默认项变化。",
      items: [
        {
          itemId: "edge-nb",
          title: "边缘 AI 笔记本开售",
          summary: "本地 70B 量化成为零售卖点，评测口径未统一。",
          sourceName: "硬件周报",
          sourceUrl: "https://example.com/edge",
          sourceIconUrl: null,
          firstParty: false,
          publishedAt: "2026-10-18T08:19:00.000Z",
          available: true,
          otherSources: 6,
        },
        {
          itemId: "agent-2",
          title: "Agent 编排 2.0 默认开启沙箱",
          summary: "工具调用拆成可审计步骤。",
          sourceName: "工具体验",
          sourceUrl: "https://example.com/agent",
          sourceIconUrl: null,
          firstParty: false,
          publishedAt: "2026-10-18T06:02:00.000Z",
          available: true,
          otherSources: 5,
        },
      ],
    },
  ],
  flashes: [
    {
      itemId: "api-price",
      title: "API 调价与缓存策略同步生效",
      summary: null,
      sourceName: "API 更新日志",
      sourceUrl: "https://example.com/price",
      sourceIconUrl: null,
      firstParty: true,
      publishedAt: "2026-10-18T04:40:00.000Z",
      available: true,
    },
  ],
  cover: null,
  metrics: { totalEvents: 6, sourcesCount: 15, firstPartyEvents: 2, modelsReleased: 1 },
  readingMinutes: 4,
  prev: "2026-10-17",
  next: null,
};

function applyDailyLead(base: ReportDetail): ReportDetail {
  const d = generated.daily;
  if (!d?.itemId) return { ...base, cover: null };
  const pic = pictureOf(d);
  const cover = pic ? { ...pic, caption: null as string | null } : null;
  const cite: ReportCitation = {
    itemId: d.itemId,
    title: d.title,
    summary: d.leadParagraph,
    sourceName: d.sourceName,
    sourceUrl: d.sourceUrl,
    sourceIconUrl: null,
    firstParty: d.firstParty,
    publishedAt: d.publishedAt,
    available: true,
    otherSources: d.otherSources,
  };
  const restHighlights = base.highlights.filter((h) => h.itemId !== cite.itemId);
  return {
    ...base,
    title: d.title,
    lead: { title: d.title, leadParagraph: d.leadParagraph },
    leadItemId: d.itemId,
    cover,
    highlights: [cite, ...restHighlights].slice(0, 2),
    sections: base.sections.map((section, i) =>
      i === 0
        ? { ...section, items: [cite, ...section.items.filter((item) => item.itemId !== cite.itemId)] }
        : section,
    ),
  };
}

function isPublicHttpUrl(url: string | null | undefined): url is string {
  return !!url && /^https?:\/\//i.test(url) && !/example\.com/i.test(url);
}

function publicDaily(): ReportDetail {
  const d = generated.daily;
  const day = generated.day || (d?.publishedAt ? d.publishedAt.slice(0, 10) : "2026-10-16");
  if (!d?.itemId || !isPublicHttpUrl(d.sourceUrl)) {
    return {
      kind: "daily",
      key: day,
      issueNumber: 1,
      title: "过去 24 小时没有达到上榜条件的事件",
      generatedAt: generated.asOf,
      lead: { title: "过去 24 小时没有达到上榜条件的事件", leadParagraph: "" },
      leadItemId: null,
      overview: null,
      highlights: [],
      sections: [],
      flashes: [],
      cover: null,
      metrics: { totalEvents: 0, sourcesCount: 0, firstPartyEvents: 0, modelsReleased: 0 },
      readingMinutes: 1,
      prev: null,
      next: null,
    };
  }
  const cite: ReportCitation = {
    itemId: d.itemId,
    title: d.title,
    summary: d.leadParagraph,
    sourceName: d.sourceName,
    sourceUrl: d.sourceUrl,
    sourceIconUrl: null,
    firstParty: d.firstParty,
    publishedAt: d.publishedAt,
    available: true,
    otherSources: d.otherSources,
  };
  const pic = pictureOf(d);
  return {
    kind: "daily",
    key: day,
    issueNumber: 1,
    title: d.title,
    generatedAt: generated.asOf,
    lead: { title: d.title, leadParagraph: d.leadParagraph },
    leadItemId: d.itemId,
    overview: null,
    highlights: [cite],
    sections: [{ label: "模型", summary: null, items: [cite] }],
    flashes: [],
    cover: pic ? { ...pic, caption: null } : null,
    metrics: {
      totalEvents: 1,
      sourcesCount: (d.otherSources || 0) + 1,
      firstPartyEvents: d.firstParty ? 1 : 0,
      modelsReleased: 1,
    },
    readingMinutes: 2,
    prev: null,
    next: null,
  };
}

/** Public MIT pages: generated covers / real URLs only. Fixture cards stay exported for tests, not rendered. */
export const hot: HotResponse = generated.hotEntries?.length ? generatedHot() : { computedAt: generated.asOf, windowHours: RANK_WINDOW_HOURS, entries: [] };

export const hotStrip: HotStripEntry[] = hot.entries.slice(0, 5).map((e) => ({
  rank: e.rank,
  title: e.story.title,
  heat: e.heat,
  trend: e.trend === "unknown" ? "flat" : e.trend,
  storyPublicId: e.story.publicId,
  itemId: generated.hotEntries?.find((row) => row.rank === e.rank)?.itemId ?? e.story.publicId,
  participants: e.participants,
  participantCount: e.participantCount,
}));

export const daily: ReportDetail = publicDaily();

export const dailyIndex: ReportNavigationEntry[] = daily.leadItemId
  ? [{ key: daily.key, issueNumber: daily.issueNumber, title: daily.title, count: 1 }]
  : [];

export const timeline: TimelineResponse = {
  filters: { channel: "all", category: null, tag: null },
  cards: [],
  nextCursor: null,
  hot: hotStrip,
  dayCounts: {},
};

export const today = daily.key;
