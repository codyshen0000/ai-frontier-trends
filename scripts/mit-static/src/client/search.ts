/** Lazy search module. Bigram Chinese + lowercase English words. No score field. */

export type SearchDoc = {
  id: string;
  t: "card" | "event" | "daily" | "weekly";
  title: string;
  summary: string;
  source: string;
  category: string | null;
  date: string;
  url: string;
};

export type SearchIndex = {
  v: 1;
  built_at: string;
  data_as_of: string;
  docs: SearchDoc[];
};

function tokenize(text: string): string[] {
  const s = String(text || "").toLowerCase();
  const tokens: string[] = [];
  for (const run of s.match(/[\u4e00-\u9fff]+/g) || []) {
    if (run.length === 1) tokens.push(run);
    else {
      for (let i = 0; i < run.length - 1; i++) tokens.push(run.slice(i, i + 2));
    }
  }
  for (const word of s.replace(/[\u4e00-\u9fff]/g, " ").split(/[^a-z0-9]+/)) {
    if (word) tokens.push(word);
  }
  return tokens;
}

function scoreDoc(doc: SearchDoc, tokens: string[]): number {
  if (!tokens.length) return 0;
  const title = tokenize(doc.title);
  const summary = tokenize(doc.summary);
  const source = tokenize(doc.source);
  const category = tokenize(doc.category || "");
  let titleHits = 0;
  let summaryHits = 0;
  let sourceHits = 0;
  let categoryHits = 0;
  for (const tok of tokens) {
    if (title.includes(tok)) titleHits += 1;
    else if (summary.includes(tok)) summaryHits += 1;
    else if (source.includes(tok)) sourceHits += 1;
    else if (category.includes(tok)) categoryHits += 1;
  }
  if (titleHits === 0 && summaryHits === 0 && sourceHits === 0 && categoryHits === 0) return 0;
  return titleHits * 3 + summaryHits + sourceHits + categoryHits;
}

export function searchDocs(index: SearchIndex, q: string): SearchDoc[] {
  const tokens = tokenize(q);
  if (!tokens.length) return [];
  return index.docs
    .map((doc) => ({ doc, s: scoreDoc(doc, tokens) }))
    .filter((row) => row.s > 0)
    .sort((a, b) => b.s - a.s || String(b.doc.date).localeCompare(String(a.doc.date)))
    .map((row) => row.doc);
}

const api = { tokenize, searchDocs };
(window as Window & { __FT_SEARCH__?: typeof api }).__FT_SEARCH__ = api;
export default api;
