import Link from "next/link";
import type { ChapterMeta } from "@/lib/types";
import { ui } from "@/lib/ui";

interface Props {
  bookId: string;
  prev: ChapterMeta | null;
  next: ChapterMeta | null;
}

export default function ChapterNav({ bookId, prev, next }: Props) {
  return (
    <nav className={`mt-20 pt-10 border-t ${ui.border} grid grid-cols-2 gap-4`}>
      {prev ? (
        <Link
          href={`/books/${bookId}/chapter/${prev.id}`}
          className={`group flex flex-col gap-1 px-4 py-4 rounded-xl border ${ui.border} hover:${ui.borderStrong} ${ui.hoverBg} transition-all`}
        >
          <span className={`text-xs ${ui.textFaint}`}>← Previous</span>
          <span className={`text-sm font-medium ${ui.textSecondary} group-hover:${ui.text} leading-snug`}>
            {prev.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={`/books/${bookId}/chapter/${next.id}`}
          className={`group flex flex-col gap-1 px-4 py-4 rounded-xl border ${ui.border} hover:${ui.borderStrong} ${ui.hoverBg} transition-all text-right col-start-2`}
        >
          <span className={`text-xs ${ui.textFaint}`}>Next →</span>
          <span className={`text-sm font-medium ${ui.textSecondary} group-hover:${ui.text} leading-snug`}>
            {next.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
