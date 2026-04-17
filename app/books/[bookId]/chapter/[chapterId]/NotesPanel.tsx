"use client";

import { useEffect, useRef, useState } from "react";
import {
  listHighlights,
  removeHighlight,
  updateHighlightNote,
  HIGHLIGHT_COLORS,
  type Highlight,
} from "@/lib/reader-storage";
import { removeMark } from "@/lib/highlight-dom";
import { ui } from "@/lib/ui";

interface Props {
  bookId: string;
  chapterId: string;
  currentPage: number;
  isOpen: boolean;
  onClose: () => void;
  onHighlightsChange?: () => void;
}

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString();
}

function scrollToMark(id: string) {
  const mark = document.querySelector(`mark[data-hl-id="${CSS.escape(id)}"]`);
  if (mark) mark.scrollIntoView({ behavior: "smooth", block: "center" });
}

function HighlightRow({
  h,
  onSaveNote,
  onDelete,
}: {
  h: Highlight;
  onSaveNote: (id: string, note: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(h.note ?? "");

  return (
    <div className={`group border-l-4 pl-3 py-2 rounded-r mb-3`}
      style={{ borderLeftColor: HIGHLIGHT_COLORS[h.color] }}>
      {/* Quote */}
      <button
        type="button"
        onClick={() => scrollToMark(h.id)}
        className={`text-left text-sm italic ${ui.textSecondary} line-clamp-3 hover:${ui.text} transition-colors w-full mb-1`}
        title="Jump to highlight"
      >
        &ldquo;{h.text}&rdquo;
      </button>

      {/* Note or edit prompt */}
      {editing ? (
        <div className="mt-2 space-y-2">
          <textarea
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note…"
            rows={3}
            className={`w-full text-sm bg-transparent border ${ui.border} rounded-lg px-2 py-1.5 resize-none outline-none focus:ring-1 focus:ring-blue-500 ${ui.text} placeholder:${ui.textFaint}`}
            style={{ fontFamily: "var(--font-sans)" }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { onSaveNote(h.id, note); setEditing(false); }}
              className={`text-xs px-3 py-1 rounded ${ui.btnPrimary}`}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => { setNote(h.note ?? ""); setEditing(false); }}
              className={`text-xs px-2 py-1 rounded ${ui.btnOutline}`}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {h.note ? (
              <p className={`text-xs ${ui.textMuted} mt-0.5`}>{h.note}</p>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className={`text-xs ${ui.textFaint} hover:${ui.textSecondary} italic transition-colors`}
              >
                Add note…
              </button>
            )}
            <p className={`text-[0.65rem] ${ui.textFaint} mt-1`}>
              p.{h.page} · {relativeDate(h.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {h.note && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label="Edit note"
                className={`p-1 rounded ${ui.textFaint} hover:${ui.textSecondary} transition-colors`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete(h.id)}
              aria-label="Delete highlight"
              className={`p-1 rounded ${ui.textFaint} ${ui.dangerHover} transition-colors`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NotesPanel({
  bookId,
  chapterId,
  currentPage,
  isOpen,
  onClose,
  onHighlightsChange,
}: Props) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [filter, setFilter] = useState<"page" | "chapter">("chapter");
  const panelRef = useRef<HTMLDivElement>(null);

  // Refresh list whenever panel opens or highlights change
  useEffect(() => {
    const all = filter === "page"
      ? listHighlights(bookId, chapterId, currentPage)
      : listHighlights(bookId, chapterId);
    setHighlights([...all].sort((a, b) => a.page - b.page || a.startOffset - b.startOffset));
  }, [bookId, chapterId, currentPage, filter, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleDelete = (id: string) => {
    removeHighlight(bookId, id);
    const prose = document.querySelector<Element>(".prose-book");
    if (prose) removeMark(prose, id);
    setHighlights((prev) => prev.filter((h) => h.id !== id));
    onHighlightsChange?.();
  };

  const handleSaveNote = (id: string, note: string) => {
    updateHighlightNote(bookId, id, note);
    setHighlights((prev) => prev.map((h) => h.id === id ? { ...h, note } : h));
    onHighlightsChange?.();
  };

  const withNotes = highlights.filter((h) => h.note);
  const withoutNotes = highlights.filter((h) => !h.note);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Notes & Highlights"
        className={`fixed top-0 right-0 h-full w-80 z-50 flex flex-col shadow-2xl border-l ${ui.border} ${ui.card} transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${ui.border}`}>
          <h2 className={`text-sm font-semibold ${ui.text}`}>Notes &amp; Highlights</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className={`p-1.5 rounded ${ui.textFaint} hover:${ui.textSecondary} ${ui.hoverBg} transition-colors`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter tabs */}
        <div className={`flex border-b ${ui.border}`}>
          {(["chapter", "page"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                filter === f
                  ? `${ui.text} border-b-2 border-blue-500`
                  : `${ui.textFaint} hover:${ui.textSecondary}`
              }`}
            >
              {f === "chapter" ? "All in chapter" : `Page ${currentPage}`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {highlights.length === 0 ? (
            <div className={`text-center py-10 ${ui.textFaint}`}>
              <div className="text-3xl mb-3">✏️</div>
              <p className="text-sm">No highlights yet.</p>
              <p className="text-xs mt-1">Select any text to highlight it.</p>
            </div>
          ) : (
            <>
              {withNotes.length > 0 && (
                <>
                  <p className={`text-[0.65rem] uppercase tracking-[0.15em] font-semibold ${ui.sidebarLabel} mb-3`}>
                    With notes ({withNotes.length})
                  </p>
                  {withNotes.map((h) => (
                    <HighlightRow
                      key={h.id}
                      h={h}
                      onSaveNote={handleSaveNote}
                      onDelete={handleDelete}
                    />
                  ))}
                </>
              )}
              {withoutNotes.length > 0 && (
                <>
                  <p className={`text-[0.65rem] uppercase tracking-[0.15em] font-semibold ${ui.sidebarLabel} mb-3 ${withNotes.length > 0 ? "mt-5" : ""}`}>
                    Highlights ({withoutNotes.length})
                  </p>
                  {withoutNotes.map((h) => (
                    <HighlightRow
                      key={h.id}
                      h={h}
                      onSaveNote={handleSaveNote}
                      onDelete={handleDelete}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer summary */}
        {highlights.length > 0 && (
          <div className={`px-4 py-3 border-t ${ui.border} text-xs ${ui.textFaint} text-center`}>
            {highlights.length} highlight{highlights.length !== 1 ? "s" : ""}
            {withNotes.length > 0 && ` · ${withNotes.length} with notes`}
          </div>
        )}
      </div>
    </>
  );
}
