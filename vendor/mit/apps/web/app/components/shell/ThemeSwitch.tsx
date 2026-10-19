import { useEffect, useState, type ReactNode } from "react";
import { IconMonitor, IconMoon, IconSun } from "../icons";
import { applyTheme, resolvedTheme, setThemePreference, useThemePreference, type ThemePreference } from "../../lib/local-state";
import { reducedMotion } from "../../lib/motion";

type Choice = "dark" | "system" | "light";

const OPTIONS: Array<{ key: Choice; label: string; icon: ReactNode }> = [
  { key: "dark", label: "深色", icon: <IconMoon size={14} /> },
  { key: "system", label: "跟随系统", icon: <IconMonitor size={14} /> },
  { key: "light", label: "浅色", icon: <IconSun size={14} /> },
];

/** Three-way appearance switch (dark / follow the system / light). Labels are visible so the buttons are findable by name. */
export function ThemeSwitch({ className = "" }: { className?: string }) {
  const pref = useThemePreference();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const current: Choice = !mounted ? "system" : (pref === "light" || pref === "dark" ? pref : "system");

  const choose = (key: Choice) => {
    const nextPref: ThemePreference = key;
    const apply = () => {
      setThemePreference(nextPref);
      applyTheme(resolvedTheme(nextPref), nextPref === "system");
    };
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition && !reducedMotion()) {
      delete doc.documentElement.dataset.vt;
      doc.startViewTransition(apply);
    } else apply();
  };

  return (
    <div role="group" aria-label="外观" className={`flex flex-col gap-1 ${className}`}>
      {OPTIONS.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-pressed={current === o.key}
          data-ft-theme-choice={o.key}
          onClick={() => choose(o.key)}
          className={`flex min-h-11 items-center justify-center gap-1.5 rounded-control px-2 text-[13px] font-medium transition-colors duration-150 ${
            current === o.key ? "bg-accent/10 text-ink" : "text-ink-3 hover:bg-bg-sunk hover:text-ink"
          }`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}
