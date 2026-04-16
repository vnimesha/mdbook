"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadChapter, uploadImage } from "@/lib/api";

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

export default function AddChapterButton({ bookId }: { bookId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // webkitdirectory must be set as a DOM property — React doesn't forward it
  useEffect(() => {
    if (folderInputRef.current) {
      (folderInputRef.current as any).webkitdirectory = true;
    }
  }, []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = async (all: File[]) => {
    if (all.length === 0) return;
    setUploading(true);
    setError("");
    try {
      const images = all.filter(isImage);
      const mdFiles = all.filter((f) => f.name.endsWith(".md") || f.name.endsWith(".mdx"));

      // Upload images first, build URL map
      const urlMap = new Map<string, string>();
      for (const img of images) {
        try {
          const { filename, url } = await uploadImage(bookId, img);
          urlMap.set(filename, url);
        } catch {
          // non-fatal
        }
      }

      // Upload each chapter, patching image refs
      for (const file of mdFiles) {
        const title = file.name
          .replace(/\.(mdx?)$/, "")
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        const patchedFile = await patchFile(file, urlMap);
        await uploadChapter(bookId, patchedFile, title);
      }

      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      {/* File picker — markdown only */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.mdx"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
      />
      {/* Folder picker — picks everything, we filter internally */}
      <input
        ref={folderInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
      />

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-50 transition-colors"
        >
          {uploading ? (
            <span className="animate-pulse">Uploading…</span>
          ) : (
            <><span>+</span> Add Chapter</>
          )}
        </button>

        {!uploading && (
          <button
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Upload a folder containing .md/.mdx files and images"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            Folder
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
