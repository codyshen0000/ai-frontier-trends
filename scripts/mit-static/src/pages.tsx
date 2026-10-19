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
import { asOfLabel, daily, dailyIndex, fillCount, hot, passedCount, timeline, today } from "./data";

function DataStamp() {
  if (!asOfLabel && passedCount == null && fillCount == null) return null;
  const counts =
    passedCount != null && fillCount != null ? `过线 ${passedCount} 条 / 补位 ${fillCount} 条` : null;
  return (
    <p data-engine-as-of className="mb-4 text-[12.5px] leading-[1.6] text-ink-4">
      {asOfLabel}
      {asOfLabel && counts ? " · " : null}
      {counts}
    </p>
  );
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
        <DataStamp />
        {timeline.hot && inNav("/hot") && <HotTopics entries={timeline.hot} />}
        <Timeline initial={timeline} filters={filters} />
      </div>
    </Shell>
  );
}

export function HotScreen() {
  return (
    <Shell pathname="/hot">
      <DataStamp />
      <HotPage hot={hot} />
    </Shell>
  );
}

export function DailyScreen() {
  return (
    <Shell pathname="/daily">
      <DataStamp />
      <ReportLayout kind="daily" index={dailyIndex} current={daily.key} today={today} outline={reportOutline(daily)}>
        <ReportPaper report={daily} index={dailyIndex} />
      </ReportLayout>
    </Shell>
  );
}
