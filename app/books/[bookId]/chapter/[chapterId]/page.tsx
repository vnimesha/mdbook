import { getBook, getChapter } from "@/lib/api";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import Link from "next/link";
import type { ChapterMeta } from "@/lib/types";
import ReaderProgress from "./ReaderProgress";
import ReaderHeader from "./ReaderHeader";
import ChapterNav from "./ChapterNav";
import { ui } from "@/lib/ui";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ bookId: string; chapterId: string }>;
}

const mdxOptions = {
  mdxOptions: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeSlug, rehypeHighlight, rehypeKatex],
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
    <div className={`min-h-screen ${ui.readerBg} flex flex-col`}>
      <ReaderProgress />

      <ReaderHeader
        bookId={bookId}
        bookTitle={book.title}
        chapterTitle={chapter.meta.title}
        currentIndex={currentIndex}
        totalChapters={sortedChapters.length}
      />

      <div className="flex-1 flex">
        {/* TOC sidebar */}
        <aside className={`hidden xl:flex xl:flex-col w-60 shrink-0 sticky top-[3.625rem] h-[calc(100vh-3.625rem)] ${ui.sidebarBg} border-r ${ui.sidebarBorder}`}>
          <div className="p-5 pb-2">
            <p
              className={`text-[0.65rem] font-semibold uppercase tracking-[0.15em] ${ui.sidebarLabel} mb-3`}
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Contents
            </p>
          </div>
          <nav>
            <ol>
              {sortedChapters.map((c: ChapterMeta, i: number) => {
                const isActive = c.id === chapterId;
                return (
                  <li key={c.id}>
                    {/* Separator line above each item except the first */}
                    {i > 0 && (
                      <div className={`mx-5 border-t ${ui.sidebarSep}`} />
                    )}
                    <Link
                      href={`/books/${bookId}/chapter/${c.id}`}
                      className={`flex items-start gap-2.5 px-5 py-3 text-sm font-medium transition-colors ${
                        isActive ? ui.sidebarItemActive : ui.sidebarItemInactive
                      }`}
                    >
                      {/* Number badge — fixed width so text never shifts */}
                      <span
                        className={`shrink-0 w-5 h-5 mt-0.5 flex items-center justify-center rounded text-[0.65rem] font-semibold leading-none transition-colors ${
                          isActive ? ui.sidebarBadgeActive : ui.sidebarBadgeInactive
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="leading-snug">{c.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </nav>
        </aside>

        {/* Reader */}
        <main className="flex-1 min-w-0 px-4 sm:px-10 lg:px-16 py-14">
          <article className="mx-auto" style={{ maxWidth: "90ch" }}>
            {/* Chapter header */}
            <header className="mb-10">
              {/* Chapter label — typeset like a textbook section label */}
              <p
                className={`text-xs font-semibold uppercase tracking-[0.2em] ${ui.textFaint} mb-4`}
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Chapter {currentIndex + 1}
              </p>
              <h1
                className="text-3xl md:text-[2.25rem] font-bold leading-tight mb-0"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--prose-heading)",
                  letterSpacing: "-0.01em",
                  paddingBottom: "0.5rem",
                  borderBottom: "2px solid var(--prose-rule-color)",
                }}
              >
                {chapter.meta.title}
              </h1>
              <div
                className="flex items-center gap-3 pt-3 pb-8"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                <span className={`text-xs ${ui.textFaint}`}>
                  {chapter.meta.word_count.toLocaleString()} words
                </span>
                <span className={ui.breadcrumbDivider}>·</span>
                <span className={`text-xs ${ui.textFaint}`}>
                  ~{Math.max(1, Math.round(chapter.meta.word_count / 250))} min read
                </span>
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
