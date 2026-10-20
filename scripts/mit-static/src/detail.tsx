import type { ReactNode } from "react";
import { EmptyState } from "../../../vendor/mit/apps/web/app/components/ui/Page";
import { Kicker } from "../../../vendor/mit/apps/web/app/components/ui/Kicker";
import { Badge, SelectedBadge } from "../../../vendor/mit/apps/web/app/components/ui/Badge";
import { SourceAvatar } from "../../../vendor/mit/apps/web/app/components/ui/SourceAvatar";
import { DayList } from "../../../vendor/mit/apps/web/app/features/feed/DayList";
import { ActiveFilters, CategoryTabs, FeedBar, SearchField } from "../../../vendor/mit/apps/web/app/features/feed/Filters";
import { ReportLayout } from "../../../vendor/mit/apps/web/app/features/report/ReportLayout";
import { ITEM_COPY } from "@aihot/site";
import { CATEGORY_LABELS } from "@aihot/contracts/taxonomy";
import { relativeTime } from "../../../vendor/mit/apps/web/app/lib/format";
import type { SiteEvent, SiteItemPublic, SiteTopic } from "../../engine/site-data.ts";
import { Link } from "./react-router";
import type { TimelineResponse } from "@aihot/contracts/site";

function Slot({ kicker, children, empty }: { kicker: string; children?: ReactNode; empty?: string }) {
  return (
    <section className="border-b border-line-soft py-5">
      <Kicker>{kicker}</Kicker>
      {children ? <div className="mt-3 text-[15px] leading-[1.8] text-ink-2">{children}</div> : <p className="mt-3 text-[13.5px] text-ink-4">{empty}</p>}
    </section>
  );
}

function SourceMeta({ item }: { item: SiteItemPublic }) {
  const handle = item.handle || item.x?.handle || null;
  const name = item.x?.authorName || item.source?.name || "";
  const avatar = item.x?.avatarUrl || null;
  const at = item.publishedAt || item.timelineAt;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-4">
      {name && (
        <span className="inline-flex items-center gap-1.5 text-ink-3">
          <SourceAvatar name={name} avatarUrl={avatar} size={18} />
          <span>{name}</span>
        </span>
      )}
      {handle && <span>@{handle.replace(/^@/, "")}</span>}
      {at && (
        <time dateTime={at} className="mono">
          {relativeTime(at)}
        </time>
      )}
    </div>
  );
}

export function ItemDetail({ item, event }: { item: SiteItemPublic; event?: SiteEvent | null }) {
  const orig = item.originalTitle || null;
  const hasToggle = Boolean(orig && orig !== item.title);
  const zhBody = item.body?.zh || item.summary;
  const origBody = item.body?.original;
  const originalHref = item.originalUrl;
  const isTweet = item.channel === "x" || /(?:twitter|x)\.com\//i.test(originalHref || "");
  return (
    <article className="pb-10">
      <SourceMeta item={item} />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {item.selected ? <SelectedBadge /> : <Badge>未入选精选</Badge>}
        {item.category && <span className="text-[12.5px] text-ink-4">{CATEGORY_LABELS[item.category] || item.category}</span>}
      </div>

      <section className="mt-5 border-b border-line-soft pb-5" aria-label="AI 精选">
        <Kicker>AI 精选</Kicker>
        <p className="mt-3 text-[14px] leading-[1.7] text-ink-2">
          {item.selected ? "已入选公开精选。公开页不展示分数。" : "未进入公开精选。公开页不展示分数。"}
        </p>
      </section>

      {hasToggle && (
        <div className="ft-lang mt-5">
          <input id={`lang-zh-${item.id}`} className="sr-only" type="radio" name={`lang-${item.id}`} value="zh" defaultChecked />
          <input id={`lang-orig-${item.id}`} className="sr-only" type="radio" name={`lang-${item.id}`} value="original" />
          <div className="inline-flex rounded-full border border-line-strong p-0.5 text-[12.5px]">
            <label htmlFor={`lang-zh-${item.id}`} data-lang="zh" className="rounded-full px-3 py-1.5">
              中
            </label>
            <label htmlFor={`lang-orig-${item.id}`} data-lang="original" className="rounded-full px-3 py-1.5">
              原文
            </label>
          </div>
          <div className="mt-4" data-lang-panel="zh">
            <h1 className="text-[24px] font-semibold leading-[1.35] text-ink">{item.title}</h1>
          </div>
          <div className="mt-4" data-lang-panel="original">
            <h1 className="text-[24px] font-semibold leading-[1.35] text-ink">{orig}</h1>
          </div>
        </div>
      )}
      {!hasToggle && <h1 className="mt-5 text-[24px] font-semibold leading-[1.35] text-ink">{item.title}</h1>}

      <Slot kicker="导读" empty="暂无导读">
        {item.summary ? <p className="whitespace-pre-line">{item.summary}</p> : null}
      </Slot>
      <Slot kicker={ITEM_COPY.reasonLabel} empty="暂无推荐理由">
        {item.reason ? <p>{item.reason}</p> : null}
      </Slot>
      <Slot kicker="译文" empty="暂无译文正文">
        {hasToggle || zhBody || origBody ? (
          <div className={hasToggle ? "ft-lang" : undefined}>
            {hasToggle && (
              <>
                <input id={`body-zh-${item.id}`} className="sr-only" type="radio" name={`body-${item.id}`} value="zh" defaultChecked />
                <input id={`body-orig-${item.id}`} className="sr-only" type="radio" name={`body-${item.id}`} value="original" />
                <div className="mb-3 inline-flex rounded-full border border-line-strong p-0.5 text-[12.5px]">
                  <label htmlFor={`body-zh-${item.id}`} data-lang="zh" className="rounded-full px-3 py-1.5">
                    中
                  </label>
                  <label htmlFor={`body-orig-${item.id}`} data-lang="original" className="rounded-full px-3 py-1.5">
                    原文
                  </label>
                </div>
              </>
            )}
            <div data-lang-panel="zh">
              {zhBody ? <p className="whitespace-pre-line">{zhBody}</p> : <p className="text-ink-4">暂无中文正文。</p>}
            </div>
            {hasToggle && (
              <div data-lang-panel="original">
                {origBody ? <p className="whitespace-pre-line">{origBody}</p> : <p className="text-ink-4">引擎未提供原文正文，仅有原文标题。</p>}
                {orig && <p className="mt-3 text-[13px] text-ink-4">原文标题：{orig}</p>}
              </div>
            )}
          </div>
        ) : null}
      </Slot>

      <section className="border-b border-line-soft py-5">
        <Kicker>主题</Kicker>
        {item.topics?.length || item.tags?.length ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {(item.topics?.length ? item.topics : item.tags.map((name) => ({ slug: name, name }))).map((t) => (
              <li key={t.slug || t.name}>
                <Link to={`/all?tag=${encodeURIComponent(t.name)}`} className="inline-flex rounded-full bg-well px-2.5 py-1 text-[12.5px] text-ink-2 hover:text-accent">
                  #{t.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[13.5px] text-ink-4">暂无主题标签</p>
        )}
      </section>

      <section className="py-5">
        {originalHref ? (
          <a href={originalHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-[15px] font-medium text-accent">
            {isTweet ? "查看原推" : "查看原文"}
          </a>
        ) : (
          <p className="text-[13.5px] text-ink-4">没有可公开访问的原文链接</p>
        )}
        {event && (
          <p className="mt-4">
            <Link to={`/story/${event.publicId}`} className="text-[14px] font-medium text-accent">
              查看事件全部后续
            </Link>
            <span className="ml-2 text-[12.5px] text-ink-4">
              {event.sourceCount} 个来源 · {event.reportCount} 篇
            </span>
          </p>
        )}
      </section>
    </article>
  );
}

export function EventDetail({ event }: { event: SiteEvent }) {
  const reports = event.timeline?.length ? event.timeline : event.officialReports || [];
  const sources = event.participants?.length
    ? event.participants
    : (event.timeline || []).map((row) => ({ name: row.source?.name || "", kind: "editorial" as const }));
  return (
    <article className="pb-10">
      <p className="text-[12.5px] text-ink-4">
        {event.sourceCount} 个来源 · {event.reportCount} 篇报道
        {event.latestAt && (
          <>
            {" · "}
            <time dateTime={event.latestAt}>{relativeTime(event.latestAt)}</time>
          </>
        )}
      </p>
      <h1 className="mt-3 text-[24px] font-semibold leading-[1.35] text-ink">{event.title}</h1>
      {sources.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {sources.map((p) => (
            <span key={p.name} className="inline-flex items-center gap-1.5 text-[13px] text-ink-3">
              <SourceAvatar name={p.name} iconUrl={p.iconUrl} size={20} />
              {p.name}
            </span>
          ))}
        </div>
      )}
      <Slot kicker="导读" empty="暂无事件导读">
        {event.digest || event.summary ? <p className="whitespace-pre-line">{event.digest || event.summary}</p> : null}
      </Slot>
      <Slot kicker={ITEM_COPY.reasonLabel} empty="暂无推荐理由">
        {event.recommendReason ? <p>{event.recommendReason}</p> : null}
      </Slot>
      <section className="py-5">
        <Kicker>全部来源</Kicker>
        {reports.length === 0 ? (
          <p className="mt-3 text-[13.5px] text-ink-4">暂无来源报道</p>
        ) : (
          <ol className="mt-3 divide-y divide-line-soft border-y border-line-soft">
            {reports.map((row) => (
              <li key={row.id} className="py-3">
                <div className="flex items-center gap-2 text-[12.5px] text-ink-4">
                  <SourceAvatar name={row.source?.name || ""} size={16} />
                  <span>{row.source?.name}</span>
                  {row.publishedAt && <time dateTime={row.publishedAt}>{relativeTime(row.publishedAt)}</time>}
                  {row.selected && <SelectedBadge />}
                </div>
                <Link to={`/items/${row.id}`} className="mt-1 block text-[15px] font-medium leading-snug text-ink hover:text-accent">
                  {row.title}
                </Link>
                {row.summary && <p className="mt-1 line-clamp-2 text-[13.5px] leading-[1.7] text-ink-3">{row.summary}</p>}
                {row.originalUrl && (
                  <a href={row.originalUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-[12.5px] text-accent">
                    查看原文
                  </a>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </article>
  );
}

export function AllFeed({ timeline }: { timeline: TimelineResponse }) {
  const items = (timeline.cards || []).map((c) => c.item);
  return (
    <div className="pb-6">
      <FeedBar base="/all" category={null} channel="all" />
      <ActiveFilters base="/all" category={null} channel="all" tag={null} />
      <div className="hidden lg:block">
        <h1 className="text-[24px] font-semibold leading-[1.3] text-ink">全部动态</h1>
        <div className="mb-5 mt-4 flex items-center justify-between gap-4">
          <CategoryTabs base="/all" category={null} channel="all" layoutId="all-cat-desk" className="min-w-0" />
          <SearchField keep={{}} />
        </div>
      </div>
      <div data-ft-timeline data-ft-filter="all">
        {items.length ? <DayList items={items} /> : <EmptyState title="暂无动态" />}
      </div>
    </div>
  );
}

export function TopicsIndex({ topics }: { topics: SiteTopic[] }) {
  return (
    <div className="pb-10">
      <h1 className="pt-4 text-[24px] font-semibold leading-[1.3] text-ink">主题</h1>
      <p className="mt-2 text-[13.5px] text-ink-3">从当前条目的标签汇总，不另造主题。</p>
      {topics.length === 0 ? (
        <EmptyState title="暂无主题" />
      ) : (
        <ul className="mt-6 divide-y divide-line-soft border-y border-line-soft">
          {topics.map((t) => (
            <li key={t.slug}>
              <Link to={`/all?tag=${encodeURIComponent(t.name)}`} className="flex min-h-12 items-center justify-between gap-3 text-[15px] text-ink hover:text-accent">
                <span>#{t.name}</span>
                <span className="num text-[13px] text-ink-4">{t.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ReportEmpty({
  kind,
  index,
  today,
  title,
  copy,
}: {
  kind: "daily" | "weekly" | "monthly";
  index: Array<{ key: string; issueNumber?: number; title?: string | null }>;
  today: string;
  title: string;
  copy: string;
}) {
  return (
    <ReportLayout kind={kind} index={index} current={null} today={today} outline={[]}>
      <div id="report-start" className="px-4 lg:px-0">
        <h1 className="sr-only">{title}</h1>
        <EmptyState title={copy} />
      </div>
    </ReportLayout>
  );
}
