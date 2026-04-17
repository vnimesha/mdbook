import Link from "next/link";
import type { ChapterMeta } from "@/lib/types";
import { ui } from "@/lib/ui";

interface Target {
  label: string;
  href: string;
  subLabel: string;
}

interface Props {
  bookId: string;
  chapterId: string;
  chapter: ChapterMeta;
  prevChapter: ChapterMeta | null;
  nextChapter: ChapterMeta | null;
  currentPage: number;
  pageTitles: string[];
  prevChapterPageCount: number;
}

export default function PageNav({
  bookId,
  chapterId,
  chapter,
  prevChapter,
  nextChapter,
  currentPage,
  pageTitles,
  prevChapterPageCount,
}: Props) {
  const pageCount = pageTitles.length;

  const prev: Target | null =
    currentPage > 1
      ? {
          label: "← Previous",
          href: `/books/${bookId}/chapter/${chapterId}?page=${currentPage - 1}`,
          subLabel: pageTitles[currentPage - 2],
        }
      : prevChapter
        ? {
            label: "← Previous chapter",
            href: `/books/${bookId}/chapter/${prevChapter.id}?page=${prevChapterPageCount || 1}`,
            subLabel: prevChapter.title,
          }
        : null;

  const next: Target | null =
    currentPage < pageCount
      ? {
          label: "Next →",
          href: `/books/${bookId}/chapter/${chapterId}?page=${currentPage + 1}`,
          subLabel: pageTitles[currentPage],
        }
      : nextChapter
        ? {
            label: "Next chapter →",
            href: `/books/${bookId}/chapter/${nextChapter.id}?page=1`,
            subLabel: nextChapter.title,
          }
        : null;

  return (
    <nav
      className={`mt-20 pt-10 border-t ${ui.border}`}
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div className={`flex items-center justify-center gap-2 mb-6 text-xs ${ui.textFaint}`}>
        <span className="tabular-nums">
          Page {currentPage} of {pageCount}
        </span>
        <span aria-hidden>·</span>
        <span className="truncate max-w-[40ch]">{chapter.title}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {prev ? (
          <Link
            href={prev.href}
            className={`group flex flex-col gap-1 px-4 py-4 rounded-xl border ${ui.border} hover:${ui.borderStrong} ${ui.hoverBg} transition-all`}
          >
            <span className={`text-xs ${ui.textFaint}`}>{prev.label}</span>
            <span
              className={`text-sm font-medium ${ui.textSecondary} group-hover:${ui.text} leading-snug`}
            >
              {prev.subLabel}
            </span>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={next.href}
            className={`group flex flex-col gap-1 px-4 py-4 rounded-xl border ${ui.border} hover:${ui.borderStrong} ${ui.hoverBg} transition-all text-right col-start-2`}
          >
            <span className={`text-xs ${ui.textFaint}`}>{next.label}</span>
            <span
              className={`text-sm font-medium ${ui.textSecondary} group-hover:${ui.text} leading-snug`}
            >
              {next.subLabel}
            </span>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </nav>
  );
}
