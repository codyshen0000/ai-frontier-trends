import { useState, type ReactNode } from "react";
import type { ReportNavigationEntry, ReportKind } from "@aihot/contracts/site";
import { BarButton, PhoneBar, type BackTarget } from "../../components/shell/PhoneBar";
import type { OutlineEntry } from "../../components/ui/OutlineSheet";
import { IconList } from "../../components/icons";
import { KindSwitch, ReportArchive, ReportPhoneNav } from "./ReportNav";

/**
 * Report pages sit beside their own archive column (desktop), flush against the site sidebar. Phones get
 * a bar with the kind switch and the issue's outline (本期目录), the recent issues under it; a page below
 * the reports (the archive) gets a bar leading back instead. The paper is centred beside the archive, on
 * a faintly toned paper in the light theme, up to 1160px.
 */
export function ReportLayout({ kind, index, current, today, outline = [], back, title, footer, children }: {
  kind: ReportKind;
  index: ReportNavigationEntry[];
  current: string | null;
  today: string;
  /** The issue's pages (reportOutline). */
  outline?: OutlineEntry[];
  /** Below the reports: where the phone bar leads back, and the page's name. */
  back?: BackTarget;
  title?: string;
  /** Site as-of / RSS; rendered in the paper column so lg sticky archive cannot cover it. */
  footer?: ReactNode;
  children: ReactNode;
}) {
  const [outlineOpen, setOutlineOpen] = useState(false);
  return (
    <div className="report-shell lg:-mx-7 lg:-mt-6 lg:flex lg:min-h-dvh">
      <ReportArchive kind={kind} index={index} current={current} />
      <div className="min-w-0 flex-1 pb-6 lg:flex lg:flex-col lg:items-center lg:px-10 lg:pb-16 lg:pt-9">
        {back ? (
          <PhoneBar back={back} title={title} />
        ) : (
          <>
            <PhoneBar
              center={<KindSwitch kind={kind} phone />}
              actions={
                outline.length > 0 && (
                  <BarButton
                    label="本期目录"
                    data-ft-toc
                    aria-expanded={outlineOpen}
                    aria-controls="ft-outline"
                    onClick={() => setOutlineOpen((open) => !open)}
                  >
                    <IconList size={21} />
                  </BarButton>
                )
              }
            />
            <ReportPhoneNav kind={kind} index={index} current={current} today={today} />
            {outline.length > 0 && (
              <div className="mb-3 hidden lg:flex">
                <button
                  type="button"
                  data-ft-toc
                  aria-expanded={outlineOpen}
                  aria-controls="ft-outline"
                  onClick={() => setOutlineOpen((open) => !open)}
                  className="inline-flex min-h-11 items-center rounded-full border border-line px-3 text-[13px] font-medium text-ink-2 hover:bg-bg-sunk"
                >
                  本期目录
                </button>
              </div>
            )}
            {outline.length > 0 && (
              <nav id="ft-outline" hidden={!outlineOpen} data-ft-outline className="ft-outline-sheet" aria-label="本期目录">
                <div className="ft-outline-head">
                  <strong>本期目录</strong>
                  <button type="button" data-ft-outline-close className="ft-outline-close" onClick={() => setOutlineOpen(false)}>
                    关闭
                  </button>
                </div>
                <ol>
                  {outline.map((o) => (
                    <li key={o.id}>
                      <a href={`#${o.id}`} onClick={() => setOutlineOpen(false)}>
                        {o.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
          </>
        )}
        <div className="w-full lg:max-w-[1160px]">
          {children}
          {footer}
        </div>
      </div>
    </div>
  );
}
