/** QA-only timeline cards. Used by `--dataset=test-paging`. Must not enter the public dist. */

const CATEGORIES = ["model", "product", "industry", "paper", "tutorial", "opinion"];
const COUNT = 85;

export function buildTestPagingCards() {
  const cards = [];
  const start = Date.parse("2026-10-12T02:00:00.000Z");
  for (let i = 1; i <= COUNT; i++) {
    const category = CATEGORIES[(i - 1) % CATEGORIES.length];
    const dayOffset = Math.floor((i - 1) / 12);
    const at = new Date(start + dayOffset * 86400000 + (i % 12) * 3600000).toISOString();
    const isX = i % 17 === 0;
    const handle = isX ? `labnote${i}` : "";
    cards.push({
      key: `qa-page-${String(i).padStart(3, "0")}`,
      anchorAt: at,
      item: {
        id: `qa-page-${String(i).padStart(3, "0")}`,
        title: isX
          ? `开源对照 ${i}：社区在讨论 FLUX 与评测口径`
          : `开源对照 ${i}：${labelOf(category)}进展与复现笔记`,
        summary: i % 5 === 1
          ? `两字词「开源」出现在摘要里，便于检索。条目 ${i} 属于 ${labelOf(category)}。`
          : `条目 ${i} 记录公开进展，便于分页与筛选。`,
        source: { name: isX ? handle : `公开笔记 ${i}` },
        url: `weekly/2026-10-18/`,
        publishedAt: at,
        category,
        selected: i % 4 === 0,
        channel: isX ? "x" : "news",
        x: isX
          ? {
            authorName: `笔记作者${i}`,
            handle,
            avatarUrl: null,
            text: `条目 ${i} 的帖文摘录：开源权重与对照脚本。`,
            quoted: null,
            media: [],
          }
          : null,
      },
      group: i % 9 === 0 ? { factId: `qa-fact-${i}`, additionalSourceCount: 2, reportCount: 3 } : null,
    });
  }
  return cards;
}

function labelOf(category) {
  return {
    model: "模型",
    product: "产品",
    industry: "行业",
    paper: "论文",
    tutorial: "教程",
    opinion: "观点",
  }[category];
}
