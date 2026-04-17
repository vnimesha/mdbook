"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPosition, setPosition } from "@/lib/reader-storage";

interface Props {
  bookId: string;
  chapterId: string;
  currentPage: number;
  pageCount: number;
}

export default function ReadingTracker({
  bookId,
  chapterId,
  currentPage,
  pageCount,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Restore: on mount, if no ?page and saved page differs, redirect ──
  useEffect(() => {
    const hasPageParam = searchParams.has("page");
    const saved = getPosition(bookId);

    if (!hasPageParam && saved && saved.chapterId === chapterId && saved.page > 1) {
      const target = Math.min(saved.page, pageCount);
      router.replace(`/books/${bookId}/chapter/${chapterId}?page=${target}&restore=1`);
      return;
    }

    // If we're on the saved page (either naturally or after the redirect) — scroll
    const wantsRestore = searchParams.get("restore") === "1";
    if (saved && saved.chapterId === chapterId && saved.page === currentPage) {
      if (wantsRestore || !hasPageParam) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: saved.scrollY, behavior: "auto" });
        });
      }
    }

    // Handle ?bookmark=<id>&scrollY=<n> — used by bookmark jumps
    const bmScroll = searchParams.get("scrollY");
    if (bmScroll !== null) {
      const y = parseInt(bmScroll, 10);
      if (!Number.isNaN(y)) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: y, behavior: "auto" });
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, chapterId, currentPage]);

  // ── Save: on scroll (debounced) and on page change ──
  useEffect(() => {
    let timer: number | null = null;
    const save = () => {
      setPosition(bookId, {
        chapterId,
        page: currentPage,
        scrollY: window.scrollY,
      });
    };

    const onScroll = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(save, 300);
    };

    // Save immediately on page change / mount
    save();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("beforeunload", save);
    return () => {
      if (timer !== null) window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeunload", save);
      save();
    };
  }, [bookId, chapterId, currentPage]);

  return null;
}
