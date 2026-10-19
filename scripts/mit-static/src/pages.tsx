import type { ReactNode } from "react";
import { Sidebar } from "../../../vendor/mit/apps/web/app/components/shell/Sidebar";
import { TabBar } from "../../../vendor/mit/apps/web/app/components/shell/TabBar";
import { BackToTop } from "../../../vendor/mit/apps/web/app/components/shell/Chrome";
import { inNav } from "../../../vendor/mit/apps/web/app/components/shell/nav";
import { Timeline } from "../../../vendor/mit/apps/web/app/features/feed/Timeline";
import { HotTopics } from "../../../vendor/mit/apps/web/app/features/feed/HotTopics";
import { ActiveFilters, CategoryTabs, FeedBar, SearchField } from "../../../vendor/mit/apps/web/app/features/feed/Filters";
import HotPage from "../../../vendor/mit/apps/web/app/routes/hot";
import { ReportLayout } from "../../../vendor/mit/apps/web/app/features/report/ReportLayout";
import { ReportPaper, reportOutline } from "../../../vendor/mit/apps/web/app/features/report/ReportPaper";
import { StaticLocation } from "./react-router";
import type { HotResponse, ReportDetail } from "@aihot/contracts/site";
import { EmptyState } from "../../../vendor/mit/apps/web/app/components/ui/Page";
import { daily, dailyIndex, hot, timeline, today } from "./fixture";
import { DataAsOf, RssLink } from "./asof";
import generated from "./covers.generated.json";

const DATA_AS_OF = generated.asOf || "2026-10-18T00:20:00.000Z";
const BUILT_AT = new Date().toISOString();

function hotWithoutCover(data: HotResponse): HotResponse {
  return {
    ...data,
    entries: data.entries.map((entry, i) => (i === 0 ? { ...entry, cover: null } : entry)),
  };
}

function dailyWithoutCover(data: ReportDetail): ReportDetail {
  return { ...data, cover: null };
}

function Shell({ pathname, children }: { pathname: string; children: ReactNode }) {
  return (
    <StaticLocation pathname={pathname}>
      <div className="flex min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-control focus:bg-surface focus:px-3 focus:py-2">
          跳到正文
        </a>
        <Sidebar changelogVersion={null} />
        <main id="main" className="min-w-0 flex-1 pb-[calc(72px+env(safe-area-inset-bottom))] lg:px-7 lg:pb-[72px] lg:pt-6">
          <div className={`mx-auto w-full pl-[var(--gutter-l)] pr-[var(--gutter-r)] lg:px-0 ${pathname.startsWith("/daily") ? "max-w-none" : "max-w-[640px] lg:max-w-[var(--page-max-wide)]"}`}>
            {children}
          </div>
        </main>
        <TabBar changelogVersion={null} />
        <BackToTop />
      </div>
    </StaticLocation>
  );
}

export function HomeScreen() {
  const filters = timeline.filters;
  return (
    <Shell pathname="/">
      <div className="pb-6">
        <FeedBar base="/" category={filters.category} channel={filters.channel} />
        <ActiveFilters base="/" category={filters.category} channel={filters.channel} tag={filters.tag} />
        <div className="hidden lg:block">
          <h1 className="text-[24px] font-semibold leading-[1.3] text-ink">精选</h1>
          <div className="mb-5 mt-4 flex items-center justify-between gap-4">
            <CategoryTabs base="/" category={filters.category} channel={filters.channel} layoutId="home-cat-desk" className="min-w-0" />
            <SearchField keep={{ category: filters.category }} />
          </div>
        </div>
        {timeline.hot && inNav("/hot") && <HotTopics entries={timeline.hot} />}
        <div data-ft-timeline data-ft-filter="all">
          <Timeline initial={timeline} filters={filters} />
        </div>
        <DataAsOf dataAsOf={DATA_AS_OF} builtAt={BUILT_AT} />
        <RssLink />
      </div>
    </Shell>
  );
}

export function HotScreen({ emptyCover = false }: { emptyCover?: boolean }) {
  return (
    <Shell pathname="/hot">
      <HotPage hot={emptyCover ? hotWithoutCover(hot) : hot} />
      <DataAsOf dataAsOf={DATA_AS_OF} builtAt={BUILT_AT} />
      <RssLink />
    </Shell>
  );
}

export function DailyScreen({ emptyCover = false }: { emptyCover?: boolean }) {
  const report = emptyCover ? dailyWithoutCover(daily) : daily;
  return (
    <Shell pathname="/daily">
      <ReportLayout kind="daily" index={dailyIndex} current={report.key} today={today} outline={reportOutline(report)}>
        <ReportPaper report={report} index={dailyIndex} />
      </ReportLayout>
      <DataAsOf dataAsOf={DATA_AS_OF} builtAt={BUILT_AT} />
      <RssLink />
    </Shell>
  );
}

export function SearchScreen() {
  return (
    <Shell pathname="/search">
      <div className="pb-6">
        <h1 className="pt-4 text-[24px] font-semibold leading-[1.3] text-ink">搜索</h1>
        <form method="get" action="./" role="search" data-ft-search="desk" className="mt-4">
          <label htmlFor="ft-search-q" className="sr-only">搜索标题、摘要</label>
          <input id="ft-search-q" name="q" type="search" placeholder="搜索标题、摘要…" maxLength={200} autoComplete="off" className="h-11 w-full rounded-full bg-well px-4 text-[14px] text-ink outline-none ring-1 ring-inset ring-line-soft focus:bg-surface focus:ring-accent" />
        </form>
        <div id="ft-search-page" className="ft-search-results">
          <p className="text-[14px] text-ink-4">输入关键词搜索标题和摘要。</p>
        </div>
        <DataAsOf dataAsOf={DATA_AS_OF} builtAt={BUILT_AT} />
      </div>
    </Shell>
  );
}

export function StarredScreen() {
  return (
    <Shell pathname="/starred">
      <div className="pb-6">
        <h1 className="pt-4 text-[24px] font-semibold leading-[1.3] text-ink">收藏</h1>
        <div id="ft-starred">
          <EmptyState title="还没有收藏">在卡片上点星标，条目会保存在这台浏览器里。</EmptyState>
        </div>
      </div>
    </Shell>
  );
}
