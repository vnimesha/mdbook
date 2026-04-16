"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createBook, uploadChapter, uploadImage } from "@/lib/api";

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".avif"]);

function isImage(file: File) {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  return IMAGE_EXTS.has(ext);
}

function rewriteImageUrls(content: string, urlMap: Map<string, string>): string {
  if (urlMap.size === 0) return content;
  return content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
    const basename = src.split("/").pop() ?? src;
    const newUrl = urlMap.get(basename);
    return newUrl ? `![${alt}](${newUrl})` : match;
  });
}

async function patchFile(file: File, urlMap: Map<string, string>): Promise<File> {
  if (urlMap.size === 0) return file;
  const text = await file.text();
  const patched = rewriteImageUrls(text, urlMap);
  if (patched === text) return file;
  return new File([patched], file.name, { type: file.type });
}

const COVER_COLORS = [
  "#1a1a2e", "#16213e", "#0f3460", "#533483",
  "#6b2737", "#2d6a4f", "#1b4332", "#7b3f00",
  "#3d405b", "#264653", "#2a9d8f", "#e76f51",
];

interface FileEntry {
  file: File;
  title: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export default function CreateBookForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // webkitdirectory must be set as a DOM property — React doesn't forward it
  useEffect(() => {
    if (folderInputRef.current) {
      (folderInputRef.current as any).webkitdirectory = true;
    }
  }, []);
  const [folderImages, setFolderImages] = useState<File[]>([]);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [coverColor, setCoverColor] = useState(COVER_COLORS[0]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState("");

  // ── Tag helpers ─────────────────────────────────────────────────────────
  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  // ── File helpers ─────────────────────────────────────────────────────────
  const addFiles = (incoming: FileList | File[] | null) => {
    if (!incoming) return;
    const all = Array.from(incoming);
    const mdFiles = all.filter((f) => f.name.endsWith(".md") || f.name.endsWith(".mdx"));
    setFiles((prev) => [
      ...prev,
      ...mdFiles.map((f) => ({
        file: f,
        title: f.name.replace(/\.(mdx?)$/, "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        status: "pending" as const,
      })),
    ]);
  };

  const addFolderFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const all = Array.from(incoming);
    const imgs = all.filter(isImage);
    if (imgs.length) setFolderImages((prev) => [...prev, ...imgs]);
    addFiles(all.filter((f) => f.name.endsWith(".md") || f.name.endsWith(".mdx")));
  };

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  const updateFileTitle = (idx: number, title: string) =>
    setFiles((prev) => prev.map((f, i) => (i === idx ? { ...f, title } : f)));

  // ── Drag & drop ──────────────────────────────────────────────────────────
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const all = Array.from(e.dataTransfer.files);
    const imgs = all.filter(isImage);
    if (imgs.length) setFolderImages((prev) => [...prev, ...imgs]);
    addFiles(all);
  }, []);

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setGlobalError("Title is required."); return; }
    if (!author.trim()) { setGlobalError("Author is required."); return; }
    setGlobalError("");
    setSubmitting(true);

    try {
      const book = await createBook({ title, author, description, cover_color: coverColor, tags });

      // 1. Upload images first, build a basename → absolute URL map
      const urlMap = new Map<string, string>();
      for (const img of folderImages) {
        try {
          const { filename, url } = await uploadImage(book.id, img);
          urlMap.set(filename, url);
        } catch {
          // non-fatal: image upload failure won't abort the whole book
        }
      }

      // 2. Upload chapters, patching image URLs in markdown when needed
      for (let i = 0; i < files.length; i++) {
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: "uploading" } : f)),
        );
        try {
          const patchedFile = await patchFile(files[i].file, urlMap);
          await uploadChapter(book.id, patchedFile, files[i].title, i);
          setFiles((prev) =>
            prev.map((f, idx) => (idx === i ? { ...f, status: "done" } : f)),
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Upload failed";
          setFiles((prev) =>
            prev.map((f, idx) => (idx === i ? { ...f, status: "error", error: msg } : f)),
          );
        }
      }

      router.push(`/books/${book.id}`);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Failed to create book");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Book details ── */}
      <section className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-500">
          Book Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Title *">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Art of Clean Code"
              className="input"
              required
            />
          </Field>
          <Field label="Author *">
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Jane Doe"
              className="input"
              required
            />
          </Field>
        </div>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short description of this book..."
            rows={3}
            className="input resize-none"
          />
        </Field>

        {/* Cover color picker */}
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Cover Color
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            {COVER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => setCoverColor(c)}
                className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  borderColor: coverColor === c ? "#fff" : "transparent",
                  boxShadow: coverColor === c ? `0 0 0 3px ${c}` : undefined,
                }}
              />
            ))}
            <input
              type="color"
              value={coverColor}
              onChange={(e) => setCoverColor(e.target.value)}
              className="w-8 h-8 rounded-full border-2 border-stone-200 cursor-pointer overflow-hidden"
              title="Custom color"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Tags</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="fiction, science, etc."
              className="input flex-1"
            />
            <button type="button" onClick={addTag} className="btn-secondary px-4">
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 px-2.5 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm rounded-full"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 text-xs ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Cover preview ── */}
      <div
        className="rounded-xl h-24 flex items-end px-6 pb-5 relative overflow-hidden"
        style={{ backgroundColor: coverColor }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 11px)`,
          }}
        />
        <div className="relative">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-0.5">
            {author || "Author"}
          </p>
          <p
            className="text-white text-xl font-bold"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {title || "Book Title"}
          </p>
        </div>
      </div>

      {/* ── Chapter upload ── */}
      <section className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-500">
          Chapters
        </h2>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            isDragging
              ? "border-stone-500 dark:border-stone-500 bg-stone-50 dark:bg-stone-800"
              : "border-stone-200 dark:border-stone-700"
          }`}
        >
          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.mdx"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => addFolderFiles(e.target.files)}
          />

          <p className="text-3xl mb-3 select-none">📂</p>
          <p className="text-stone-600 dark:text-stone-400 text-sm mb-4">
            Drop <code className="text-xs bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">.md</code> /{" "}
            <code className="text-xs bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">.mdx</code> files or a folder containing chapters &amp; images
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary text-sm"
            >
              Browse files
            </button>
            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              Upload folder
            </button>
          </div>

          {folderImages.length > 0 && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-3">
              {folderImages.length} image{folderImages.length !== 1 ? "s" : ""} found — will be uploaded automatically
            </p>
          )}
        </div>

        {/* File list */}
        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((entry, i) => (
              <li
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700"
              >
                <span className="text-stone-400 dark:text-stone-500 select-none text-xs w-5 text-right shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={entry.title}
                    onChange={(e) => updateFileTitle(i, e.target.value)}
                    className="w-full text-sm font-medium text-stone-800 dark:text-stone-200 bg-transparent border-b border-transparent focus:border-stone-300 dark:focus:border-stone-600 focus:outline-none pb-0.5"
                    disabled={entry.status !== "pending"}
                  />
                  <p className="text-xs text-stone-400 dark:text-stone-500 truncate mt-0.5">{entry.file.name}</p>
                  {entry.error && <p className="text-xs text-red-500 mt-0.5">{entry.error}</p>}
                </div>
                <StatusBadge status={entry.status} />
                {entry.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-stone-300 dark:text-stone-600 hover:text-red-500 transition-colors text-lg leading-none"
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Error & submit ── */}
      {globalError && (
        <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-4 py-3">
          {globalError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold rounded-xl hover:bg-stone-700 dark:hover:bg-stone-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Creating…" : "Create Book"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: FileEntry["status"] }) {
  if (status === "uploading")
    return <span className="text-xs text-blue-500 font-medium animate-pulse">uploading…</span>;
  if (status === "done")
    return <span className="text-xs text-emerald-600 font-medium">✓ done</span>;
  if (status === "error")
    return <span className="text-xs text-red-500 font-medium">✗ error</span>;
  return null;
}
