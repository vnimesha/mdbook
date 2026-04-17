"use client";

import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  listHighlights,
  addHighlight,
  removeHighlight,
  updateHighlightNote,
  HIGHLIGHT_COLORS,
  type Highlight,
  type HighlightColor,
} from "@/lib/reader-storage";
import { getRangeOffsets, injectMark, removeMark } from "@/lib/highlight-dom";
import { ui } from "@/lib/ui";

// ── Public handle so NotesPanel can trigger a refresh ────────────────────────
export interface HighlightLayerHandle {
  refresh: () => void;
}

interface Props {
  bookId: string;
  chapterId: string;
  page: number;
  onHighlightsChange?: () => void;
}

interface SelectionInfo {
  text: string;
  startOffset: number;
  endOffset: number;
  rect: DOMRect;
}

interface NoteState {
  id: string;
  text: string;
  note: string;
  rect: DOMRect;
}

const COLOR_KEYS = Object.keys(HIGHLIGHT_COLORS) as HighlightColor[];

function getProse() {
  return document.querySelector<Element>(".prose-book");
}

// ── Small floating toolbar that appears over a text selection ────────────────
function SelectionToolbar({
  info,
  onHighlight,
  onCopy,
  onClose,
}: {
  info: SelectionInfo;
  onHighlight: (c: HighlightColor) => void;
  onCopy: () => void;
  onClose: () => void;
}) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const top = info.rect.top + window.scrollY - 48;
  const left = info.rect.left + info.rect.width / 2;

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!toolbarRef.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose]);

  return (
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="Highlight options"
      style={{ position: "absolute", top, left, transform: "translateX(-50%)", zIndex: 60 }}
      className={`flex items-center gap-1 px-2 py-1.5 rounded-lg shadow-lg border ${ui.border} ${ui.card}`}
    >
      {COLOR_KEYS.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Highlight ${color}`}
          onClick={() => onHighlight(color)}
          className="w-5 h-5 rounded-full border-2 border-white/60 hover:scale-110 transition-transform shadow-sm"
          style={{ background: HIGHLIGHT_COLORS[color] }}
        />
      ))}
      <span className={`w-px h-4 ${ui.border} mx-0.5`} aria-hidden />
      <button
        type="button"
        aria-label="Copy selected text"
        onClick={onCopy}
        className={`p-1 rounded ${ui.textFaint} hover:${ui.textSecondary} hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors`}
        title="Copy"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      </button>
    </div>
  );
}

// ── Floating popup that shows when user clicks an existing highlight ──────────
function NotePopup({
  state,
  onSave,
  onDelete,
  onClose,
}: {
  state: NoteState;
  onSave: (note: string) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [note, setNote] = useState(state.note);
  const wrapRef = useRef<HTMLDivElement>(null);
  const top = state.rect.bottom + window.scrollY + 8;
  const left = state.rect.left + state.rect.width / 2;

  useEffect(() => {
    setNote(state.note);
  }, [state.id, state.note]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={wrapRef}
      style={{ position: "absolute", top, left, transform: "translateX(-50%)", zIndex: 60, width: 280 }}
      className={`rounded-xl border ${ui.border} ${ui.card} shadow-xl`}
    >
      {/* Quote */}
      <div className={`px-3 pt-3 pb-2 border-b ${ui.border}`}>
        <p className={`text-xs italic ${ui.textFaint} line-clamp-2`}>&ldquo;{state.text}&rdquo;</p>
      </div>
      {/* Note area */}
      <div className="p-3">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note…"
          rows={3}
          className={`w-full text-sm bg-transparent resize-none outline-none ${ui.text} placeholder:${ui.textFaint}`}
          style={{ fontFamily: "var(--font-sans)" }}
        />
      </div>
      {/* Actions */}
      <div className={`flex items-center justify-between gap-2 px-3 pb-3`}>
        <button
          type="button"
          onClick={onDelete}
          className={`text-xs px-2 py-1 rounded ${ui.dangerHover} ${ui.textFaint} border ${ui.border} transition-colors`}
        >
          Remove highlight
        </button>
        <button
          type="button"
          onClick={() => onSave(note)}
          className={`text-xs px-3 py-1 rounded ${ui.btnPrimary}`}
        >
          Save note
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const HighlightLayer = forwardRef<HighlightLayerHandle, Props>(function HighlightLayer(
  { bookId, chapterId, page, onHighlightsChange },
  ref,
) {
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [noteState, setNoteState] = useState<NoteState | null>(null);

  // Exposed to parent (NotesPanel uses this to trigger a re-apply after delete)
  useImperativeHandle(ref, () => ({
    refresh() {
      const prose = getProse();
      if (!prose) return;
      const highlights = listHighlights(bookId, chapterId, page);
      prose.querySelectorAll("mark[data-hl-id]").forEach((m) => {
        const p = m.parentNode!;
        while (m.firstChild) p.insertBefore(m.firstChild, m);
        p.removeChild(m);
      });
      prose.normalize();
      highlights.forEach((h) => injectMark(prose, h));
    },
  }));

  // Apply saved highlights after MDX content is in the DOM
  useEffect(() => {
    const prose = getProse();
    if (!prose) return;
    const highlights = listHighlights(bookId, chapterId, page);
    highlights.forEach((h) => injectMark(prose, h));

    // Click a mark → open note popup
    const onMarkClick = (e: Event) => {
      const me = e as MouseEvent;
      const mark = (me.target as Element).closest("mark[data-hl-id]");
      if (!mark) return;
      const id = mark.getAttribute("data-hl-id")!;
      const all = listHighlights(bookId, chapterId, page);
      const h = all.find((h) => h.id === id);
      if (!h) return;
      me.stopPropagation();
      setSelection(null);
      setNoteState({ id: h.id, text: h.text, note: h.note ?? "", rect: mark.getBoundingClientRect() });
    };
    prose.addEventListener("click", onMarkClick);
    return () => prose.removeEventListener("click", onMarkClick);
  }, [bookId, chapterId, page]);

  // Detect text selection inside .prose-book
  useEffect(() => {
    const onMouseUp = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setSelection(null);
        return;
      }
      const prose = getProse();
      if (!prose) return;
      const range = sel.getRangeAt(0);
      if (!prose.contains(range.commonAncestorContainer)) { setSelection(null); return; }
      const offsets = getRangeOffsets(range, prose);
      if (!offsets) return;
      setSelection({ text: sel.toString(), ...offsets, rect: range.getBoundingClientRect() });
    };
    document.addEventListener("mouseup", onMouseUp);
    return () => document.removeEventListener("mouseup", onMouseUp);
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleHighlight = (color: HighlightColor) => {
    if (!selection) return;
    const prose = getProse()!;
    const h = addHighlight(bookId, {
      chapterId, page,
      startOffset: selection.startOffset,
      endOffset: selection.endOffset,
      text: selection.text,
      color,
    });
    injectMark(prose, h);
    window.getSelection()?.removeAllRanges();
    setSelection(null);
    onHighlightsChange?.();
  };

  const handleCopy = () => {
    if (selection?.text) navigator.clipboard.writeText(selection.text);
    setSelection(null);
  };

  const handleSaveNote = (note: string) => {
    if (!noteState) return;
    updateHighlightNote(bookId, noteState.id, note);
    setNoteState(null);
    onHighlightsChange?.();
  };

  const handleDeleteHighlight = () => {
    if (!noteState) return;
    removeHighlight(bookId, noteState.id);
    const prose = getProse();
    if (prose) removeMark(prose, noteState.id);
    setNoteState(null);
    onHighlightsChange?.();
  };

  return (
    <>
      {selection && (
        <SelectionToolbar
          info={selection}
          onHighlight={handleHighlight}
          onCopy={handleCopy}
          onClose={() => setSelection(null)}
        />
      )}
      {noteState && (
        <NotePopup
          state={noteState}
          onSave={handleSaveNote}
          onDelete={handleDeleteHighlight}
          onClose={() => setNoteState(null)}
        />
      )}
    </>
  );
});

export default HighlightLayer;
