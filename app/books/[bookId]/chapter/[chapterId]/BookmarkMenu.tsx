"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addBookmark,
  listBookmarks,
  removeBookmark,
  type Bookmark,
} from "@/lib/reader-storage";
import { ui } from "@/lib/ui";

interface Props {
  bookId: string;
  chapterId: string;
  chapterTitle: string;
  currentPage: number;
  pageTitles: string[];
}

export default function BookmarkMenu({
  bookId,
  chapterId,
  chapterTitle,
  currentPage,
  pageTitles,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBookmarks(listBookmarks(bookId));
  }, [bookId]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const currentPageTitle = pageTitles[currentPage - 1] ?? `Page ${currentPage}`;

  const alreadyBookmarkedHere = bookmarks.some(
    (b) =>
      b.chapterId === chapterId &&
      b.page === currentPage &&
      Math.abs(b.scrollY - (typeof window !== "undefined" ? window.scrollY : 0)) < 40,
  );

  const handleAdd = () => {
    const bm = addBookmark(bookId, {
      chapterId,
      chapterTitle,
      page: currentPage,
      pageTitle: currentPageTitle,
      scrollY: window.scrollY,
    });
    setBookmarks((list) => [...list, bm]);
  };

  const handleRemove = (id: string) => {
    removeBookmark(bookId, id);
    setBookmarks((list) => list.filter((b) => b.id !== id));
  };

  const handleJump = (b: Bookmark) => {
    setOpen(false);
    router.push(
      `/books/${bookId}/chapter/${b.chapterId}?page=${b.page}&scrollY=${Math.round(b.scrollY)}`,
    );
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Bookmarks"
        aria-expanded={open}
        className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs ${ui.textFaint} hover:${ui.textSecondary} ${ui.hoverBg} transition-colors`}
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={bookmarks.length > 0 ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        <span className="tabular-nums">{bookmarks.length}</span>
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute right-0 mt-2 w-80 max-h-[70vh] overflow-auto rounded-xl border ${ui.border} ${ui.card} shadow-lg z-50`}
          style={{ fontFamily: "var(--font-sans)" }}
        >
          <div className={`p-3 border-b ${ui.border}`}>
            <div className={`text-[0.65rem] uppercase tracking-[0.15em] font-semibold ${ui.sidebarLabel} mb-2`}>
              Current location
            </div>
            <div className={`text-sm ${ui.textSecondary} leading-snug mb-1 truncate`}>
              {currentPageTitle}
            </div>
            <div className={`text-xs ${ui.textFaint} mb-3`}>
              Page {currentPage} · {chapterTitle}
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={alreadyBookmarkedHere}
              className={`w-full text-xs px-3 py-2 rounded-lg ${ui.btnPrimary} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {alreadyBookmarkedHere ? "Bookmarked here" : "Add bookmark"}
            </button>
          </div>

          <div className="p-2">
            <div className={`px-2 py-1 text-[0.65rem] uppercase tracking-[0.15em] font-semibold ${ui.sidebarLabel}`}>
              Saved ({bookmarks.length})
            </div>
            {bookmarks.length === 0 ? (
              <div className={`px-2 py-3 text-xs ${ui.textFaint}`}>
                No bookmarks yet. Click &ldquo;Add bookmark&rdquo; to save your place.
              </div>
            ) : (
              <ul>
                {[...bookmarks].reverse().map((b) => (
                  <li key={b.id} className={`flex items-start gap-2 px-2 py-2 rounded ${ui.hoverBg}`}>
                    <button
                      type="button"
                      onClick={() => handleJump(b)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className={`text-sm ${ui.textSecondary} truncate`}>
                        {b.pageTitle}
                      </div>
                      <div className={`text-xs ${ui.textFaint} truncate`}>
                        Page {b.page} · {b.chapterTitle}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(b.id)}
                      aria-label="Remove bookmark"
                      className={`shrink-0 p-1 rounded ${ui.textFaint} ${ui.dangerHover}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
