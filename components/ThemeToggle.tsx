"use client";

import { useTheme, type Theme } from "@/lib/theme";

const LABELS: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const ICONS: Record<Theme, React.ReactNode> = {
  light: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ),
  dark: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  ),
  system: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
};

export default function ThemeToggle() {
  const { theme, toggle, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-100 dark:bg-zinc-800 p-0.5">
      {(["light", "dark", "system"] as Theme[]).map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          title={LABELS[t]}
          aria-label={`Switch to ${LABELS[t]} theme`}
          className={`flex items-center justify-center w-7 h-7 rounded-md text-xs transition-all ${
            theme === t
              ? "bg-white dark:bg-zinc-600 text-stone-800 dark:text-zinc-100 shadow-sm"
              : "text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300"
          }`}
        >
          {ICONS[t]}
        </button>
      ))}
    </div>
  );
}
