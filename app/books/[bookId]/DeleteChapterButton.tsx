"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteChapter } from "@/lib/api";
import { ui } from "@/lib/ui";

export default function DeleteChapterButton({
  bookId,
  chapterId,
}: {
  bookId: string;
  chapterId: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // stop the parent <Link> from navigating
    e.stopPropagation();

    if (!confirming) {
      setConfirming(true);
      // Auto-cancel confirm state after 3 s if user does nothing
      setTimeout(() => setConfirming(false), 3000);
      return;
    }

    setDeleting(true);
    try {
      await deleteChapter(bookId, chapterId);
      router.refresh();
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
        confirming
          ? ui.dangerActive
          : `${ui.textFaint} hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100`
      } disabled:opacity-40`}
      title={confirming ? "Click again to confirm" : "Delete chapter"}
    >
      {deleting ? (
        <span className="animate-pulse">…</span>
      ) : confirming ? (
        "Delete?"
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4h6v2" />
        </svg>
      )}
    </button>
  );
}
