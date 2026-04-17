"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ui } from "@/lib/ui";

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
  currentPage?: number;
  pageCount?: number;
  rightSlot?: ReactNode;
}

export default function ReaderHeader({
  bookId,
  bookTitle,
  chapterTitle,
  currentIndex,
  totalChapters,
  currentPage,
  pageCount,
  rightSlot,
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
    <header className={`sticky top-0.5 z-40 border-b ${ui.readerHeaderBorder} ${ui.readerHeaderBg}`}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">

        {/* ── Left: back to book ── */}
        <Link
          href={`/books/${bookId}`}
          className={`shrink-0 flex items-center gap-1 text-sm ${ui.textFaint} hover:${ui.textSecondary} transition-colors`}
          style={{ fontFamily: "var(--font-sans)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <span className="hidden sm:block max-w-[140px] truncate">{bookTitle}</span>
        </Link>

        {/* ── Divider ── */}
        <span className={`shrink-0 ${ui.breadcrumbDivider} select-none`} aria-hidden>│</span>

        {/* ── Centre: breadcrumb (chapter › section) ── */}
        <div
          className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {/* Chapter title */}
          <span
            className={`text-sm truncate transition-colors ${
              showSection
                ? `${ui.breadcrumbDimmed} shrink`
                : `${ui.breadcrumbNormal} font-medium`
            }`}
          >
            {chapterTitle}
          </span>

          {/* Section separator + name */}
          {showSection && (
            <>
              <svg
                className={`shrink-0 ${ui.breadcrumbDivider}`}
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
                    ? ui.breadcrumbH1
                    : active!.level === 2
                    ? ui.breadcrumbH2
                    : ui.breadcrumbH3
                }`}
              >
                {active!.text}
              </span>
            </>
          )}
        </div>

        {/* ── Divider ── */}
        <span className={`shrink-0 ${ui.breadcrumbRule} select-none`} aria-hidden>│</span>

        {/* ── Right: chapter + page position ── */}
        <span
          className={`shrink-0 text-xs tabular-nums ${ui.textFaint}`}
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Ch.&thinsp;{currentIndex + 1}&thinsp;/&thinsp;{totalChapters}
          {currentPage !== undefined && pageCount !== undefined && pageCount > 1 && (
            <>
              <span className="mx-1.5" aria-hidden>·</span>
              p.&thinsp;{currentPage}&thinsp;/&thinsp;{pageCount}
            </>
          )}
        </span>

        {rightSlot && (
          <>
            <span className={`shrink-0 ${ui.breadcrumbRule} select-none`} aria-hidden>│</span>
            {rightSlot}
          </>
        )}
      </div>
    </header>
  );
}
