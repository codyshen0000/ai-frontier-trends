import { asofParts, formatBeijing } from "./asof-copy";

export { formatBeijing };

export function DataAsOf({ dataAsOf, builtAt }: { dataAsOf: string; builtAt: string }) {
  const { dataLine, publishLine, stale } = asofParts(dataAsOf, builtAt);
  if (!dataLine && !publishLine) return null;
  return (
    <p className="ft-asof" data-ft-asof>
      {dataLine}
      {publishLine ? (
        <>
          <br />
          {publishLine}
        </>
      ) : null}
      {stale ? " · 数据可能已过期" : ""}
    </p>
  );
}

export function RssLink({ href = "feed/weekly.xml" }: { href?: string }) {
  return (
    <p className="ft-rss">
      <a href={href} rel="alternate" type="application/rss+xml">
        RSS
      </a>
    </p>
  );
}
