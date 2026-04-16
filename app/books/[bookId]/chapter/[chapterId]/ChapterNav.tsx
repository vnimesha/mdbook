import Link from "next/link";
import type { ChapterMeta } from "@/lib/types";

interface Props {
  bookId: string;
  prev: ChapterMeta | null;
  next: ChapterMeta | null;
}

export default function ChapterNav({ bookId, prev, next }: Props) {
  return (
    <nav className="mt-20 pt-10 border-t border-stone-200 dark:border-stone-800 grid grid-cols-2 gap-4">
      {prev ? (
        <Link
          href={`/books/${bookId}/chapter/${prev.id}`}
          className="group flex flex-col gap-1 px-4 py-4 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 hover:bg-white dark:hover:bg-stone-900 transition-all"
        >
          <span className="text-xs text-stone-400 dark:text-stone-500">← Previous</span>
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300 group-hover:text-stone-900 dark:group-hover:text-stone-100 leading-snug">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={`/books/${bookId}/chapter/${next.id}`}
          className="group flex flex-col gap-1 px-4 py-4 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 hover:bg-white dark:hover:bg-stone-900 transition-all text-right col-start-2"
        >
          <span className="text-xs text-stone-400 dark:text-stone-500">Next →</span>
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300 group-hover:text-stone-900 dark:group-hover:text-stone-100 leading-snug">
            {next.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
