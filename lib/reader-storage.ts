// ── Highlight colors ────────────────────────────────────────────────────────

export const HIGHLIGHT_COLORS = {
  yellow: "rgba(250, 204, 21, 0.40)",
  green:  "rgba(74,  222, 128, 0.40)",
  blue:   "rgba(96,  165, 250, 0.40)",
  pink:   "rgba(244, 114, 182, 0.40)",
} as const;

export type HighlightColor = keyof typeof HIGHLIGHT_COLORS;

export interface Highlight {
  id: string;
  chapterId: string;
  page: number;
  startOffset: number;
  endOffset: number;
  text: string;
  color: HighlightColor;
  note?: string;
  createdAt: string;
}

// ── Reading position ─────────────────────────────────────────────────────────

export interface ReadingPosition {
  chapterId: string;
  page: number;
  scrollY: number;
  updatedAt: string;
}

export interface Bookmark {
  id: string;
  chapterId: string;
  chapterTitle: string;
  page: number;
  pageTitle: string;
  scrollY: number;
  label?: string;
  createdAt: string;
}

const posKey = (bookId: string) => `mdbook:position:${bookId}`;
const bmKey = (bookId: string) => `mdbook:bookmarks:${bookId}`;

function readJSON<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or disabled — silently ignore
  }
}

// ── Reading position (auto-bookmark) ────────────────────────────────────────

export function getPosition(bookId: string): ReadingPosition | null {
  return readJSON<ReadingPosition>(posKey(bookId));
}

export function setPosition(bookId: string, pos: Omit<ReadingPosition, "updatedAt">) {
  writeJSON(posKey(bookId), { ...pos, updatedAt: new Date().toISOString() });
}

// ── Manual bookmarks ────────────────────────────────────────────────────────

export function listBookmarks(bookId: string): Bookmark[] {
  return readJSON<Bookmark[]>(bmKey(bookId)) ?? [];
}

export function addBookmark(bookId: string, bm: Omit<Bookmark, "id" | "createdAt">): Bookmark {
  const full: Bookmark = {
    ...bm,
    id: `bm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  const list = listBookmarks(bookId);
  list.push(full);
  writeJSON(bmKey(bookId), list);
  return full;
}

export function removeBookmark(bookId: string, bookmarkId: string) {
  const list = listBookmarks(bookId).filter((b) => b.id !== bookmarkId);
  writeJSON(bmKey(bookId), list);
}

export function updateBookmarkLabel(bookId: string, bookmarkId: string, label: string) {
  const list = listBookmarks(bookId);
  const idx = list.findIndex((b) => b.id === bookmarkId);
  if (idx < 0) return;
  list[idx] = { ...list[idx], label };
  writeJSON(bmKey(bookId), list);
}

// ── Highlights ───────────────────────────────────────────────────────────────

const hlKey = (bookId: string) => `mdbook:highlights:${bookId}`;

export function listHighlights(bookId: string, chapterId?: string, page?: number): Highlight[] {
  const all = readJSON<Highlight[]>(hlKey(bookId)) ?? [];
  return all.filter(
    (h) =>
      (chapterId === undefined || h.chapterId === chapterId) &&
      (page === undefined || h.page === page),
  );
}

export function addHighlight(
  bookId: string,
  hl: Omit<Highlight, "id" | "createdAt">,
): Highlight {
  const full: Highlight = {
    ...hl,
    id: `hl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  const all = readJSON<Highlight[]>(hlKey(bookId)) ?? [];
  all.push(full);
  writeJSON(hlKey(bookId), all);
  return full;
}

export function removeHighlight(bookId: string, highlightId: string) {
  const all = (readJSON<Highlight[]>(hlKey(bookId)) ?? []).filter(
    (h) => h.id !== highlightId,
  );
  writeJSON(hlKey(bookId), all);
}

export function updateHighlightNote(bookId: string, highlightId: string, note: string) {
  const all = readJSON<Highlight[]>(hlKey(bookId)) ?? [];
  const idx = all.findIndex((h) => h.id === highlightId);
  if (idx < 0) return;
  all[idx] = { ...all[idx], note };
  writeJSON(hlKey(bookId), all);
}

// ── Font size preference ─────────────────────────────────────────────────────

const fontKey = () => `mdbook:fontSize`;

export function getFontSize(): number {
  const raw = readJSON<number>(fontKey());
  return raw ?? 16;
}

export function setFontSize(px: number) {
  writeJSON(fontKey(), px);
}
