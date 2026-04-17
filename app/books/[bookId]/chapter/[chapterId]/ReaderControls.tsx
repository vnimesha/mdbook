"use client";

import { useRef, useState } from "react";
import BookmarkMenu from "./BookmarkMenu";
import FontSizeControl from "./FontSizeControl";
import NotesPanel from "./NotesPanel";
import { listHighlights } from "@/lib/reader-storage";
import { ui } from "@/lib/ui";

interface Props {
  bookId: string;
  chapterId: string;
  chapterTitle: string;
  currentPage: number;
  pageTitles: string[];
}

export default function ReaderControls({
  bookId,
  chapterId,
  chapterTitle,
  currentPage,
  pageTitles,
}: Props) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [hlCount, setHlCount] = useState(() => listHighlights(bookId, chapterId).length);

  const onHighlightsChange = () => {
    setHlCount(listHighlights(bookId, chapterId).length);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <FontSizeControl />

        {/* Notes / highlights toggle */}
        <button
          type="button"
          onClick={() => setNotesOpen(true)}
          aria-label="Notes and highlights"
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${ui.textFaint} hover:${ui.textSecondary} ${ui.hoverBg} transition-colors`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={hlCount > 0 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          {hlCount > 0 && <span className="tabular-nums">{hlCount}</span>}
        </button>

        <span className={`w-px h-4 ${ui.breadcrumbRule} self-center`} aria-hidden />

        <BookmarkMenu
          bookId={bookId}
          chapterId={chapterId}
          chapterTitle={chapterTitle}
          currentPage={currentPage}
          pageTitles={pageTitles}
        />
      </div>

      <NotesPanel
        bookId={bookId}
        chapterId={chapterId}
        currentPage={currentPage}
        isOpen={notesOpen}
        onClose={() => setNotesOpen(false)}
        onHighlightsChange={onHighlightsChange}
      />
    </>
  );
}
