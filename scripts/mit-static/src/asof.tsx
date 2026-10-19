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

export function DataAsOf({ dataAsOf, builtAt }: { dataAsOf: string; builtAt: string }) {
  const stamp = formatBeijing(dataAsOf || builtAt);
  const stale = dataAsOf && builtAt && Date.parse(builtAt) - Date.parse(dataAsOf) > 6 * 3600 * 1000;
  return (
    <p className="ft-asof" data-ft-asof>
      数据截至 {stamp}（北京时间）
      {stale ? " · 数据可能已过期" : ""}
    </p>
  );
}

export function RssLink() {
  return (
    <p className="ft-rss">
      <a href="feed/weekly.xml" rel="alternate" type="application/rss+xml">
        RSS
      </a>
    </p>
  );
}
