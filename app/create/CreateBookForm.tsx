"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { createBook, uploadChapter } from "@/lib/api";

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
  const [isDragging, setIsDragging] = useState(false);

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
  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter((f) =>
      f.name.endsWith(".md") || f.name.endsWith(".mdx"),
    );
    setFiles((prev) => [
      ...prev,
      ...valid.map((f) => ({
        file: f,
        title: f.name.replace(/\.(mdx?)$/, "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        status: "pending" as const,
      })),
    ]);
  };

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  const updateFileTitle = (idx: number, title: string) =>
    setFiles((prev) => prev.map((f, i) => (i === idx ? { ...f, title } : f)));

  // ── Drag & drop ──────────────────────────────────────────────────────────
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
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

      for (let i = 0; i < files.length; i++) {
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: "uploading" } : f)),
        );
        try {
          await uploadChapter(book.id, files[i].file, files[i].title, i);
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
      <section className="bg-white rounded-xl border border-stone-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-stone-400">
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
          <label className="block text-sm font-medium text-stone-700 mb-2">
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
          <label className="block text-sm font-medium text-stone-700 mb-2">Tags</label>
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
                  className="flex items-center gap-1 px-2.5 py-0.5 bg-stone-100 text-stone-700 text-sm rounded-full"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="text-stone-400 hover:text-stone-700 text-xs ml-0.5"
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
      <section className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-stone-400">
          Chapters
        </h2>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-stone-500 bg-stone-50"
              : "border-stone-200 hover:border-stone-400 hover:bg-stone-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.mdx"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <p className="text-3xl mb-3 select-none">📄</p>
          <p className="text-stone-700 font-medium">
            Drop <code className="text-xs bg-stone-100 px-1 py-0.5 rounded">.md</code> /{" "}
            <code className="text-xs bg-stone-100 px-1 py-0.5 rounded">.mdx</code> files here
          </p>
          <p className="text-stone-400 text-sm mt-1">or click to browse</p>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((entry, i) => (
              <li
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-stone-50 border border-stone-100"
              >
                <span className="text-stone-400 select-none text-xs w-5 text-right shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={entry.title}
                    onChange={(e) => updateFileTitle(i, e.target.value)}
                    className="w-full text-sm font-medium text-stone-800 bg-transparent border-b border-transparent focus:border-stone-300 focus:outline-none pb-0.5"
                    disabled={entry.status !== "pending"}
                  />
                  <p className="text-xs text-stone-400 truncate mt-0.5">{entry.file.name}</p>
                  {entry.error && <p className="text-xs text-red-500 mt-0.5">{entry.error}</p>}
                </div>
                <StatusBadge status={entry.status} />
                {entry.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-stone-300 hover:text-red-500 transition-colors text-lg leading-none"
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
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {globalError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3.5 bg-stone-900 text-white font-semibold rounded-xl hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Creating…" : "Create Book"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1.5">{label}</label>
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
