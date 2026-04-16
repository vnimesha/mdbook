import type { BookMeta, BookSummary, ChapterContent, ChapterMeta, CreateBookPayload } from "./types";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── Books ──────────────────────────────────────────────────────────────────

export async function listBooks(): Promise<BookSummary[]> {
  return request<BookSummary[]>("/books");
}

export async function getBook(bookId: string): Promise<BookMeta> {
  return request<BookMeta>(`/books/${bookId}`);
}

export async function createBook(payload: CreateBookPayload): Promise<BookMeta> {
  return request<BookMeta>("/books", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateBook(
  bookId: string,
  payload: Partial<CreateBookPayload>,
): Promise<BookMeta> {
  return request<BookMeta>(`/books/${bookId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteBook(bookId: string): Promise<void> {
  const res = await fetch(`${BACKEND}/books/${bookId}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Delete failed: ${res.status}`);
  }
}

// ── Chapters ───────────────────────────────────────────────────────────────

export async function listChapters(bookId: string): Promise<ChapterMeta[]> {
  return request<ChapterMeta[]>(`/books/${bookId}/chapters`);
}

export async function getChapter(bookId: string, chapterId: string): Promise<ChapterContent> {
  return request<ChapterContent>(`/books/${bookId}/chapters/${chapterId}`);
}

export async function uploadImage(
  bookId: string,
  file: File,
): Promise<{ filename: string; url: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BACKEND}/books/${bookId}/images`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Image upload failed: ${text}`);
  }
  const data = (await res.json()) as { filename: string; url: string };
  // Resolve to full absolute URL so <img src> works from the browser
  return { ...data, url: `${BACKEND}${data.url}` };
}

export async function uploadChapter(
  bookId: string,
  file: File,
  title?: string,
  order?: number,
): Promise<ChapterMeta> {
  const form = new FormData();
  form.append("file", file);
  if (title) form.append("title", title);
  if (order !== undefined) form.append("order", String(order));

  const res = await fetch(`${BACKEND}/books/${bookId}/chapters`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Upload failed: ${text}`);
  }
  return res.json() as Promise<ChapterMeta>;
}

export async function updateChapter(
  bookId: string,
  chapterId: string,
  payload: { title?: string; order?: number },
): Promise<ChapterMeta> {
  return request<ChapterMeta>(`/books/${bookId}/chapters/${chapterId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteChapter(bookId: string, chapterId: string): Promise<void> {
  const res = await fetch(`${BACKEND}/books/${bookId}/chapters/${chapterId}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Delete failed: ${res.status}`);
  }
}
