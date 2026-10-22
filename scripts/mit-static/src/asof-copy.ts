/** Shared footer copy for data cutoff vs last publish. Asia/Shanghai, plain Chinese. */

const STALE_MS = 6 * 3600 * 1000;

export function formatBeijing(iso: string) {
  if (!iso) return "";
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date(iso));
    const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
    return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
  } catch {
    return iso.slice(0, 16).replace("T", " ");
  }
}

export function asofStale(dataAsOf: string, builtAt: string) {
  return Boolean(dataAsOf && builtAt && Date.parse(builtAt) - Date.parse(dataAsOf) > STALE_MS);
}

export function asofParts(dataAsOf: string, builtAt: string) {
  const dataStamp = formatBeijing(dataAsOf || builtAt);
  const publishStamp = builtAt ? formatBeijing(builtAt) : "";
  return {
    dataLine: dataStamp ? `数据截至 ${dataStamp}（北京时间）` : "",
    publishLine: publishStamp ? `上次发布 ${publishStamp}（北京时间）` : "",
    stale: asofStale(dataAsOf, builtAt),
  };
}

/** Footer / empty-state text. Two segments joined with ` · `; stale hint stays at the end. */
export function asofPlainText(dataAsOf: string, builtAt: string) {
  const { dataLine, publishLine, stale } = asofParts(dataAsOf, builtAt);
  const parts = [dataLine, publishLine].filter(Boolean);
  if (stale) parts.push("数据可能已过期");
  return parts.join(" · ");
}
