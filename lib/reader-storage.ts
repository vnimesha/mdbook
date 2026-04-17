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
