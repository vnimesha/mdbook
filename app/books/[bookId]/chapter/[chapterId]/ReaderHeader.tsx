"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface ActiveSection {
  text: string;
  level: number; // 1 | 2 | 3
}

interface Props {
  bookId: string;
  bookTitle: string;
  chapterTitle: string;
  currentIndex: number;
  totalChapters: number;
}

export default function ReaderHeader({
  bookId,
  bookTitle,
  chapterTitle,
  currentIndex,
  totalChapters,
}: Props) {
  const [active, setActive] = useState<ActiveSection | null>(null);
  // Keep a ref so the scroll handler always reads the latest headings
  const headingsRef = useRef<{ el: HTMLElement; level: number }[]>([]);

  useEffect(() => {
    const SNAP_OFFSET = 72; // px — below the header height

    // Collect after a tick so MDX content is in the DOM
    const collect = () => {
      headingsRef.current = Array.from(
        document.querySelectorAll<HTMLElement>(".prose-book h1, .prose-book h2, .prose-book h3"),
      ).map((el) => ({ el, level: parseInt(el.tagName[1], 10) }));
    };

    const update = () => {
      let current: ActiveSection | null = null;
      for (const { el, level } of headingsRef.current) {
        if (el.getBoundingClientRect().top <= SNAP_OFFSET) {
          current = { text: el.textContent?.trim() ?? "", level };
        }
      }
      setActive((prev) => {
        // avoid re-renders when nothing changed
        if (prev?.text === current?.text) return prev;
        return current;
      });
    };

    // Small delay so MDX is rendered before we collect headings
    const timer = setTimeout(() => {
      collect();
      update();
    }, 100);

    window.addEventListener("scroll", update, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", update);
    };
  }, []);

  // Active section is different from the chapter title when scrolled into a sub-heading
  const showSection = active !== null && active.text !== chapterTitle;

  return (
    <header className="sticky top-0.5 z-40 bg-white/95 dark:bg-stone-950/95 backdrop-blur-sm border-b border-stone-200 dark:border-stone-800">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">

        {/* ── Left: back to book ── */}
        <Link
          href={`/books/${bookId}`}
          className="shrink-0 flex items-center gap-1 text-sm text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <span className="hidden sm:block max-w-[140px] truncate">{bookTitle}</span>
        </Link>

        {/* ── Divider ── */}
        <span className="shrink-0 text-stone-200 dark:text-stone-800 select-none" aria-hidden>│</span>

        {/* ── Centre: breadcrumb (chapter › section) ── */}
        <div
          className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {/* Chapter title */}
          <span
            className={`text-sm truncate transition-colors ${
              showSection
                ? "text-stone-400 dark:text-stone-600 shrink"
                : "text-stone-700 dark:text-stone-300 font-medium"
            }`}
          >
            {chapterTitle}
          </span>

          {/* Section separator + name */}
          {showSection && (
            <>
              <svg
                className="shrink-0 text-stone-300 dark:text-stone-700"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
              <span
                className={`text-sm font-medium truncate transition-all ${
                  active!.level === 1
                    ? "text-stone-800 dark:text-stone-200"
                    : active!.level === 2
                    ? "text-stone-700 dark:text-stone-300"
                    : "text-stone-600 dark:text-stone-400"
                }`}
              >
                {active!.text}
              </span>
            </>
          )}
        </div>

        {/* ── Divider ── */}
        <span className="shrink-0 text-stone-200 dark:text-stone-800 select-none" aria-hidden>│</span>

        {/* ── Right: chapter position ── */}
        <span
          className="shrink-0 text-xs tabular-nums text-stone-400 dark:text-stone-500"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Ch.&thinsp;{currentIndex + 1}&thinsp;/&thinsp;{totalChapters}
        </span>
      </div>
    </header>
  );
}
