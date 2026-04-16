"use client";

/**
 * Theme management system.
 *
 * - Three themes: "light" | "dark" | "system"
 * - "system" follows prefers-color-scheme
 * - Persisted in localStorage under "mdbook-theme"
 * - Applies "dark" class to <html> for Tailwind's class-based dark variant
 * - No-FOUC handled by an inline <script> in layout.tsx
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  /** The stored preference ("light" | "dark" | "system") */
  theme: Theme;
  /** The resolved active appearance ("light" | "dark") */
  resolved: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "mdbook-theme";

function getSystemPreference(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: Theme): "light" | "dark" {
  return theme === "system" ? getSystemPreference() : theme;
}

function applyTheme(resolved: "light" | "dark") {
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  // Initialise from localStorage on mount
  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
    const res = resolveTheme(stored);
    setThemeState(stored);
    setResolved(res);
    applyTheme(res);
  }, []);

  // Watch system preference when theme === "system"
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const res = resolveTheme("system");
      setResolved(res);
      applyTheme(res);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    const res = resolveTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
    setResolved(res);
    applyTheme(res);
  }, []);

  const toggle = useCallback(() => {
    // Cycle: light → dark → system → light
    const cycle: Theme[] = ["light", "dark", "system"];
    const next = cycle[(cycle.indexOf(theme) + 1) % cycle.length];
    setTheme(next);
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

/**
 * Inline script string injected into <head> to set the dark class
 * before React hydrates — prevents flash of wrong theme.
 */
export const themeScript = `(function(){
  try {
    var t = localStorage.getItem('mdbook-theme') || 'system';
    var dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) { document.documentElement.classList.add('dark'); document.documentElement.setAttribute('data-theme','dark'); }
    else { document.documentElement.setAttribute('data-theme','light'); }
  } catch(e) {}
})();`;
