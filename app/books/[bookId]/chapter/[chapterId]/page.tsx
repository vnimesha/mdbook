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
import PageNav from "./PageNav";
import ReadingTracker from "./ReadingTracker";
import BookmarkMenu from "./BookmarkMenu";
import { paginate } from "@/lib/paginate";
import { ui } from "@/lib/ui";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ bookId: string; chapterId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const mdxOptions = {
  mdxOptions: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeSlug, rehypeHighlight, rehypeKatex],
  },
};

function parsePage(raw: string | string[] | undefined, pageCount: number): number {
  const str = Array.isArray(raw) ? raw[0] : raw;
  const n = str ? parseInt(str, 10) : NaN;
  if (Number.isNaN(n)) return 1;
  return Math.max(1, Math.min(n, pageCount));
}

function stripLeadingHeading(md: string): string {
  // Drop the first line if it's an H1 or H2 — its text is already shown as the page title.
  const lines = md.split("\n");
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;
  if (i < lines.length && /^#{1,2}\s+/.test(lines[i])) {
    lines.splice(i, 1);
    while (i < lines.length && lines[i].trim() === "") {
      lines.splice(i, 1);
    }
  }
  return lines.join("\n");
}

async function pageCountFor(bookId: string, chapter: ChapterMeta | undefined | null): Promise<number> {
  if (!chapter) return 1;
  try {
    const c = await getChapter(bookId, chapter.id);
    return paginate(c.content).length;
  } catch {
    return 1;
  }
}

export default async function ChapterPage({ params, searchParams }: Props) {
  const { bookId, chapterId } = await params;
  const sp = await searchParams;

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

  const pages = paginate(chapter.content);
  const currentPage = parsePage(sp.page, pages.length);
  const page = pages[currentPage - 1];
  const pageTitles = pages.map((p) => p.title);
  const prevChapterPageCount = await pageCountFor(bookId, prevChapter);

  return (
    <div className={`min-h-screen ${ui.readerBg} flex flex-col`}>
      <ReaderProgress />

      <ReaderHeader
        bookId={bookId}
        bookTitle={book.title}
        chapterTitle={chapter.meta.title}
        currentIndex={currentIndex}
        totalChapters={sortedChapters.length}
        currentPage={currentPage}
        pageCount={pages.length}
        pageTitle={page.title}
        rightSlot={
          <BookmarkMenu
            bookId={bookId}
            chapterId={chapterId}
            chapterTitle={chapter.meta.title}
            currentPage={currentPage}
            pageTitles={pageTitles}
          />
        }
      />

      <ReadingTracker
        bookId={bookId}
        chapterId={chapterId}
        currentPage={currentPage}
        pageCount={pages.length}
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
                    {i > 0 && (
                      <div className={`mx-5 border-t ${ui.sidebarSep}`} />
                    )}
                    <Link
                      href={`/books/${bookId}/chapter/${c.id}`}
                      className={`flex items-start gap-2.5 px-5 py-3 text-sm font-medium transition-colors ${
                        isActive ? ui.sidebarItemActive : ui.sidebarItemInactive
                      }`}
                    >
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

          {/* Pages within current chapter */}
          {pages.length > 1 && (
            <div className={`mt-4 pt-4 border-t ${ui.sidebarSep}`}>
              <p
                className={`px-5 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.15em] ${ui.sidebarLabel}`}
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Pages
              </p>
              <ol>
                {pages.map((p) => {
                  const isActive = p.index + 1 === currentPage;
                  return (
                    <li key={p.anchor}>
                      <Link
                        href={`/books/${bookId}/chapter/${chapterId}?page=${p.index + 1}`}
                        className={`flex items-start gap-2.5 px-5 py-2 text-xs font-medium transition-colors ${
                          isActive ? ui.sidebarItemActive : ui.sidebarItemInactive
                        }`}
                      >
                        <span
                          className={`shrink-0 w-5 h-5 flex items-center justify-center rounded text-[0.65rem] font-semibold leading-none transition-colors ${
                            isActive ? ui.sidebarBadgeActive : ui.sidebarBadgeInactive
                          }`}
                        >
                          {p.index + 1}
                        </span>
                        <span className="leading-snug truncate">{p.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </aside>

        {/* Reader */}
        <main className="flex-1 min-w-0 px-4 sm:px-10 lg:px-16 py-14">
          <article className="mx-auto" style={{ maxWidth: "90ch" }}>
            <header className="mb-10">
              <p
                className={`text-xs font-semibold uppercase tracking-[0.2em] ${ui.textFaint} mb-4`}
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {chapter.meta.title}
                {pages.length > 1 && (
                  <>
                    <span className="mx-2" aria-hidden>·</span>
                    Page {currentPage} of {pages.length}
                  </>
                )}
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
                {page.title}
              </h1>
            </header>

            <div className="prose-book">
              <MDXRemote source={stripLeadingHeading(page.content)} options={mdxOptions} />
            </div>

            <PageNav
              bookId={bookId}
              chapterId={chapterId}
              chapter={chapter.meta}
              prevChapter={prevChapter}
              nextChapter={nextChapter}
              currentPage={currentPage}
              pageTitles={pageTitles}
              prevChapterPageCount={prevChapterPageCount}
            />
          </article>
        </main>
      </div>
    </div>
  );
}
