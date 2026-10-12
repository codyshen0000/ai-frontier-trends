/** Build-time readers for live.html / timeline.html. Reuse source text only. */

export function decodeHtml(value) {
  return String(value)
    .replaceAll("&nbsp;", " ")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function stripTags(html) {
  return decodeHtml(String(html).replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

export function extractLiveSpotlight(html) {
  let conclusion = "";
  const meta = String(html).match(/<meta\b[^>]*\bname=["']description["'][^>]*>/i);
  if (meta) {
    const content = meta[0].match(/\bcontent=["']([^"']*)["']/i);
    if (content) conclusion = decodeHtml(content[1]).trim();
  }
  if (!conclusion) {
    const concl = String(html).match(/<div class=["']concl["'][^>]*>([\s\S]*?)<\/div>/i);
    if (concl) conclusion = stripTags(concl[1]);
  }

  let updatedAt = "";
  const built = String(html).match(/构建于\s*([^。<]*)/);
  if (built) updatedAt = decodeHtml(built[1]).trim();

  return { conclusion, updatedAt };
}

export function extractTimelineLede(html) {
  const match = String(html).match(/一句话结论(?:\s*[（(][^）)]*[）)])?\s*[：:]\s*([^<]+)/);
  return match ? decodeHtml(match[1]).replace(/<\/?strong>/gi, "").trim() : "";
}

const STATUS = new Set(["加强", "持平", "待验证"]);

function statusFromHeading(raw) {
  if (/待观察|待验证/.test(raw)) return "待验证";
  return "";
}

function statusFromChangeLine(text) {
  if (/待观察|待验证/.test(text)) return "待验证";
  if (/等级不变/.test(text)) return "持平";
  if (/加固|补证据|升级|上调|加强/.test(text)) return "加强";
  if (/下调|加限定|注明/.test(text)) return "持平";
  return "";
}

function changeLists(html) {
  return [...String(html).matchAll(/<h2\b[^>]*>\s*\d{4}-\d{2}-\d{2}[^<]*变更[^<]*<\/h2>\s*<ul>([\s\S]*?)<\/ul>/gi)].map(
    (match) => match[1],
  );
}

function applyChangeList(changeHtml, statusByN) {
  for (const li of String(changeHtml).matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
    let lastNums = [];
    for (const text of stripTags(li[1]).split(/[；。]/)) {
      if (!text.trim()) continue;
      const mentioned = numsFromChangeLine(text);
      if (mentioned.length) lastNums = mentioned;
      const nums = mentioned.length ? mentioned : lastNums;
      const status = statusFromChangeLine(text);
      if (!status || !nums.length) continue;
      for (const n of nums) {
        if (statusByN[n] === "待验证") continue;
        statusByN[n] = status;
      }
    }
  }
}

function numsFromChangeLine(text) {
  const nums = [];
  for (const match of String(text).matchAll(/主线\s*(\d+(?:\s*[、,，]\s*\d+)*)/g)) {
    for (const part of match[1].split(/[、,，]/)) {
      const n = Number(part.trim());
      if (n) nums.push(n);
    }
  }
  return nums;
}

function normalizeFallback(list, limit) {
  return (list || [])
    .map((item) => ({
      sentence: String(item.sentence || "").trim(),
      status: STATUS.has(item.status) ? item.status : "持平",
      anchor: String(item.anchor || "").trim() || "thread-1",
    }))
    .filter((item) => item.sentence)
    .slice(0, limit);
}

export function extractThreads(html, fallback = [], limit = 5) {
  const threads = [];
  const headingRe = /<h3\b[^>]*>\s*主线\s*(\d+)\s*[：:]\s*([\s\S]*?)<\/h3>/gi;
  let match;
  while ((match = headingRe.exec(html))) {
    const n = Number(match[1]);
    const raw = stripTags(match[2]);
    const sentence = raw.replace(/【[^】]*】/g, "").replace(/[　\s]+/g, " ").trim();
    if (!sentence) continue;
    threads.push({ n, sentence, raw, anchor: `thread-${n}` });
  }

  const statusByN = {};
  for (const thread of threads) {
    const fromHeading = statusFromHeading(thread.raw);
    statusByN[thread.n] = fromHeading || "持平";
  }

  for (const changeHtml of changeLists(html)) {
    applyChangeList(changeHtml, statusByN);
  }

  const parsed = threads.slice(0, limit).map((thread) => ({
    sentence: thread.sentence,
    status: statusByN[thread.n] || "持平",
    anchor: thread.anchor,
  }));

  if (parsed.length >= 3) {
    return {
      threads: parsed,
      source: "timeline",
      lede: extractTimelineLede(html),
    };
  }

  return {
    threads: normalizeFallback(fallback, limit),
    source: "fallback",
    lede: extractTimelineLede(html),
  };
}

export function ensureThreadAnchors(html) {
  return String(html).replace(/<h3(\b[^>]*)>(\s*主线\s*(\d+)\s*[：:])/gi, (full, attrs, prefix, n) => {
    if (/\sid\s*=/.test(attrs)) return full;
    return `<h3${attrs} id="thread-${n}">${prefix}`;
  });
}
