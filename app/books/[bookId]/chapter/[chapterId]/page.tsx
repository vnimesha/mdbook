import { getBook, getChapter } from "@/lib/api";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import Link from "next/link";
import type { ChapterMeta } from "@/lib/types";
import ReaderProgress from "./ReaderProgress";
import ChapterNav from "./ChapterNav";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ bookId: string; chapterId: string }>;
}

const mdxOptions = {
  mdxOptions: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug, rehypeHighlight],
  },
};

export default async function ChapterPage({ params }: Props) {
  const { bookId, chapterId } = await params;

  let book, chapter;
  try {
    [book, chapter] = await Promise.all([getBook(bookId), getChapter(bookId, chapterId)]);
  } catch {
    notFound();
  }

  const sortedChapters = [...book.chapters].sort((a, b) => a.order - b.order);
  const currentIndex = sortedChapters.findIndex((c) => c.id === chapterId);
  const prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex flex-col">
      <ReaderProgress />

      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-stone-50/95 dark:bg-zinc-950/95 backdrop-blur-sm border-b border-stone-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link
            href={`/books/${bookId}`}
            className="flex items-center gap-1.5 text-sm text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-100 transition-colors shrink-0"
          >
            ← {book.title}
          </Link>
          <div className="flex-1 min-w-0 text-center">
            <span className="text-sm text-stone-400 dark:text-zinc-500 truncate hidden sm:block">
              {chapter.meta.title}
            </span>
          </div>
          <span className="text-xs text-stone-400 dark:text-zinc-500 shrink-0">
            Ch. {currentIndex + 1} / {sortedChapters.length}
          </span>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* TOC sidebar */}
        <aside className="hidden xl:block w-64 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto p-6 border-r border-stone-200 dark:border-zinc-800">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 dark:text-zinc-500 mb-4">
            Contents
          </p>
          <nav>
            <ol className="space-y-1">
              {sortedChapters.map((c: ChapterMeta, i: number) => (
                <li key={c.id}>
                  <Link
                    href={`/books/${bookId}/chapter/${c.id}`}
                    className={`flex items-start gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                      c.id === chapterId
                        ? "bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium"
                        : "text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span className="shrink-0 text-xs mt-0.5 opacity-60">{i + 1}.</span>
                    <span className="leading-snug">{c.title}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        {/* Reader */}
        <main className="flex-1 min-w-0 px-4 sm:px-8 py-16">
          <article className="mx-auto" style={{ maxWidth: "70ch" }}>
            {/* Chapter header */}
            <header className="mb-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 dark:text-zinc-500 mb-3">
                Chapter {currentIndex + 1}
              </p>
              <h1
                className="text-3xl md:text-4xl font-bold text-stone-900 dark:text-zinc-100 leading-tight mb-4"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {chapter.meta.title}
              </h1>
              <div className="flex items-center gap-3 text-xs text-stone-400 dark:text-zinc-500 border-b border-stone-200 dark:border-zinc-800 pb-8">
                <span>{chapter.meta.word_count.toLocaleString()} words</span>
                <span>·</span>
                <span>~{Math.max(1, Math.round(chapter.meta.word_count / 250))} min read</span>
              </div>
            </header>

            {/* MDX content */}
            <div className="prose-book">
              <MDXRemote source={chapter.content} options={mdxOptions} />
            </div>

            {/* Chapter navigation */}
            <ChapterNav bookId={bookId} prev={prevChapter} next={nextChapter} />
          </article>
        </main>
      </div>
    </div>
  );
}
