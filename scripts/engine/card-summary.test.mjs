import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isTitleEcho,
  pickCardSummary,
  thickenCards,
  thickenFeedItems,
  indexDailyCites,
  indexEvents,
} from "./card-summary.mjs";
import { publicizeBundle, publicizeCard } from "./publicize.mjs";
import { groupByEvent } from "./groupByEvent.mjs";

const LONG =
  "The Verge 与 IT之家称 Anthropic 推出面向专业人士与小企业的 Claude Duet 智能体（研究预览），提供 iOS/Android 独立应用与网页入口，定位 24 小时在线助理，对标 Meta Muse 等。官方新闻室暂未见同名稿。";

describe("card-summary picker", () => {
  it("rejects title / reason / one_line echoes", () => {
    const title = "报道：Anthropic 推出 Claude Duet 智能体，对标 Muse 与 Dots";
    assert.equal(isTitleEcho(title, title), true);
    assert.equal(isTitleEcho("报道：Anthropic 推 Claude Duet 智能体迎战 Muse", "报道：Anthropic 推 Claude Duet 智能体迎战 Muse"), true);
    assert.equal(isTitleEcho(LONG, title), false);
  });

  it("prefers event.digest over short item.summary and never uses reason", () => {
    const item = {
      id: "sha256:duet",
      title: "报道：Anthropic 推出 Claude Duet 智能体，对标 Muse 与 Dots",
      summary: "Verge：Claude Duet 研究预览，iOS/Android/Web。",
      reason: "报道：Anthropic 推 Claude Duet 智能体迎战 Muse",
      one_line: "Anthropic 推 Claude Duet",
    };
    const event = {
      publicId: "2026-10-22-anthropic-claude-duet",
      title: item.title,
      digest: LONG,
      summary: "较短的事件摘要。",
      recommendReason: item.reason,
    };
    assert.equal(pickCardSummary({ item, event }), LONG);
    assert.equal(pickCardSummary({ item, event: { ...event, digest: null } }), event.summary);
  });

  it("does not invent text when only a title echo exists", () => {
    const item = {
      id: "sha256:empty",
      title: "OpenAI 客户故事：Terminal X 用 GPT-6.1 做投资判断评测",
      summary: "OpenAI 客户故事：Terminal X 用 GPT-6.1 做投资判断评测",
      reason: "Terminal X：GPT-6.1 投资判断一致率约 88.6%",
    };
    assert.equal(pickCardSummary({ item, event: { digest: null, summary: null, title: item.title } }), null);
  });

  it("uses an existing daily cite when it is the longest real summary", () => {
    const item = {
      id: "sha256:kls",
      title: "微软研究院：宣布解决数学界 31 年难题 KLS 猜想",
      summary: "MSR 称解决 KLS 猜想，移除高维随机算法理论障碍。",
    };
    const event = { publicId: "2026-10-22-msr-kls-conjecture", summary: "微软研究院博客称解决 KLS 猜想，移除一项理论障碍。" };
    const dailyCite = {
      itemId: "sha256:kls",
      summary:
        "微软研究院与合作者证明 1995 年提出的 Kannan–Lovász–Simonovits（KLS）猜想：对数凹分布上，最优平面切割与任意形状切割的差距由与维度无关的普适常数界定。",
    };
    const picked = pickCardSummary({ item, event, dailyCite });
    assert.equal(picked, dailyCite.summary);
    assert.ok(picked.length >= 80);
  });

  it("groupByEvent overlays event.summary onto the representative card", () => {
    const at = "2026-10-22T03:53:00.000Z";
    const cards = [
      {
        key: "duet",
        anchorAt: at,
        item: {
          id: "sha256:duet",
          title: "报道：Anthropic 推出 Claude Duet 智能体，对标 Muse 与 Dots",
          summary: "Verge：Claude Duet 研究预览，iOS/Android/Web。",
          reason: "报道：Anthropic 推 Claude Duet 智能体迎战 Muse",
          source: { name: "The Verge · AI" },
          publishedAt: at,
          timelineAt: at,
          category: "product",
          tags: [],
          selected: true,
          channel: "news",
          x: null,
          storyPublicId: "2026-10-22-anthropic-claude-duet",
        },
        group: null,
      },
    ];
    const out = groupByEvent(cards, {
      events: [{ publicId: "2026-10-22-anthropic-claude-duet", digest: null, summary: LONG }],
    });
    assert.equal(out.length, 1);
    assert.equal(out[0].item.summary, LONG);
  });

  it("re-running groupByEvent without dailyByItemId keeps a longer publicized summary", () => {
    const at = "2026-10-22T03:53:00.000Z";
    const shorterEvent = "微软研究院博客称解决 KLS 猜想，移除一项理论障碍。";
    const cards = [
      {
        key: "kls",
        anchorAt: at,
        item: {
          id: "sha256:kls",
          title: "微软研究院：宣布解决数学界 31 年难题 KLS 猜想",
          summary: LONG,
          reason: "微软研究院宣布解决 KLS 猜想（31 年）",
          source: { name: "Microsoft Research Blog" },
          publishedAt: at,
          timelineAt: at,
          category: "paper",
          tags: [],
          selected: true,
          channel: "news",
          x: null,
          storyPublicId: "2026-10-22-msr-kls-conjecture",
        },
        group: null,
      },
    ];
    const again = groupByEvent(cards, {
      events: [{ publicId: "2026-10-22-msr-kls-conjecture", digest: null, summary: shorterEvent }],
    });
    assert.equal(again[0].item.summary, LONG);
    assert.ok(again[0].item.summary.length > shorterEvent.length);
  });

  it("publicizeBundle maps digest/long summary onto timeline + selected feed", () => {
    const at = "2026-10-22T03:53:00.000Z";
    const site = publicizeBundle({
      dir: "",
      meta: { data_as_of: at, generated_at: at },
      data_as_of: at,
      built_at: at,
      hot: { computedAt: null, windowHours: 48, entries: [] },
      hotStrip: [],
      daily: {
        kind: "daily",
        key: "2026-10-22",
        issueNumber: 1,
        title: "日报",
        generatedAt: at,
        lead: null,
        leadItemId: null,
        overview: null,
        highlights: [],
        sections: [
          {
            label: "产品",
            summary: null,
            items: [{ itemId: "sha256:abcdabcdabcdabcd", title: "Duet", summary: LONG, sourceName: "The Verge", sourceUrl: "https://www.theverge.com/duet", firstParty: false, publishedAt: at, available: true }],
          },
        ],
        flashes: [],
        cover: null,
        metrics: {},
        readingMinutes: 5,
        prev: null,
        next: null,
      },
      dailyIndex: [],
      dailies: [],
      feed: null,
      feedItems: [
        {
          guid: "sha256:abcdabcdabcdabcd",
          title: "报道：Anthropic 推出 Claude Duet 智能体，对标 Muse 与 Dots",
          summary: "Verge：Claude Duet 研究预览，iOS/Android/Web。",
          eventPublicId: "2026-10-22-anthropic-claude-duet",
        },
      ],
      events: [
        {
          publicId: "2026-10-22-anthropic-claude-duet",
          title: "报道：Anthropic 推出 Claude Duet 智能体，对标 Muse 与 Dots",
          digest: null,
          summary: LONG,
        },
      ],
      eventsIndex: [],
      timeline: {
        filters: { channel: "all", category: null, tag: null },
        cards: [
          {
            key: "duet",
            anchorAt: at,
            item: {
              id: "sha256:abcdabcdabcdabcd",
              title: "报道：Anthropic 推出 Claude Duet 智能体，对标 Muse 与 Dots",
              summary: "Verge：Claude Duet 研究预览，iOS/Android/Web。",
              reason: "报道：Anthropic 推 Claude Duet 智能体迎战 Muse",
              source: { name: "The Verge · AI" },
              publishedAt: at,
              timelineAt: at,
              category: "product",
              tags: [],
              selected: true,
              channel: "news",
              x: null,
              originalUrl: "https://www.theverge.com/duet",
              storyPublicId: "2026-10-22-anthropic-claude-duet",
            },
            group: null,
          },
        ],
        nextCursor: null,
        hot: [],
        dayCounts: { "2026-10-22": 1 },
      },
      timelineIndex: null,
      redirects: [],
      sources: [],
      search: null,
      items: [],
      topics: [],
      allTimeline: null,
      weeklyIndex: [],
      monthlyIndex: [],
    });
    assert.equal(site.timeline.cards[0].item.summary, LONG);
    assert.equal(site.feedItems[0].summary, LONG);
    assert.ok(!isTitleEcho(site.timeline.cards[0].item.summary, site.timeline.cards[0].item.title));
    assert.notEqual(site.timeline.cards[0].item.summary, site.timeline.cards[0].item.reason);
  });

  it("publicizeCard without an event keeps a non-echo item.summary", () => {
    const card = publicizeCard({
      key: "k",
      anchorAt: "2026-10-19T00:00:00.000Z",
      item: {
        id: "sha256:abcabcabcabcabca",
        title: "标题",
        summary: "这是一条独立的事实摘要，不是标题回声。",
        reason: "",
        source: { name: "公开实验室" },
        publishedAt: "2026-10-19T00:00:00.000Z",
        timelineAt: "2026-10-19T00:00:00.000Z",
        category: "model",
        tags: [],
        selected: true,
        channel: "news",
        x: null,
      },
      group: null,
    });
    assert.equal(card.item.summary, "这是一条独立的事实摘要，不是标题回声。");
  });

  it("thicken helpers index dailies by itemId", () => {
    const dailyByItemId = indexDailyCites([
      { sections: [{ items: [{ itemId: "sha256:a", summary: "短" }] }], highlights: [{ itemId: "sha256:a", summary: LONG }] },
    ]);
    assert.equal(dailyByItemId.get("sha256:a").summary, LONG);
    const eventsById = indexEvents([{ publicId: "ev-a", digest: null, summary: "事件摘要。" }]);
    const cards = thickenCards(
      [{ key: "k", item: { id: "sha256:a", title: "T", summary: "one line", storyPublicId: "ev-a" } }],
      { eventsById, dailyByItemId },
    );
    assert.equal(cards[0].item.summary, LONG);
    const feed = thickenFeedItems([{ guid: "sha256:a", title: "T", summary: "one line", eventPublicId: "ev-a" }], {
      eventsById,
      dailyByItemId,
    });
    assert.equal(feed[0].summary, LONG);
  });
});
