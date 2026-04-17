"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPosition, type ReadingPosition } from "@/lib/reader-storage";
import { ui } from "@/lib/ui";

interface Props {
  bookId: string;
  chapters: { id: string; title: string }[];
  coverColor: string;
  firstChapterId: string;
}

export default function ContinueReadingButton({
  bookId,
  chapters,
  coverColor,
  firstChapterId,
}: Props) {
  const [pos, setPos] = useState<ReadingPosition | null | undefined>(undefined);

  useEffect(() => {
    setPos(getPosition(bookId));
  }, [bookId]);

  // Before hydration: show "Start reading" fallback
  if (pos === undefined) {
    return (
      <Link
        href={`/books/${bookId}/chapter/${firstChapterId}`}
        className="block w-full text-center py-3 rounded-xl font-semibold text-white transition-colors"
        style={{ backgroundColor: coverColor }}
      >
        Start Reading →
      </Link>
    );
  }

  const savedChapter = pos ? chapters.find((c) => c.id === pos.chapterId) : null;
  const hasResumable = pos && savedChapter;

  if (!hasResumable) {
    return (
      <Link
        href={`/books/${bookId}/chapter/${firstChapterId}`}
        className="block w-full text-center py-3 rounded-xl font-semibold text-white transition-colors"
        style={{ backgroundColor: coverColor }}
      >
        Start Reading →
      </Link>
    );
  }

  return (
    <div className="space-y-2">
      <Link
        href={`/books/${bookId}/chapter/${pos!.chapterId}?page=${pos!.page}&restore=1`}
        className="block w-full text-center py-3 rounded-xl font-semibold text-white transition-colors"
        style={{ backgroundColor: coverColor }}
      >
        Continue Reading →
      </Link>
      <p
        className={`text-xs ${ui.textFaint} text-center leading-snug px-1 truncate`}
        style={{ fontFamily: "var(--font-sans)" }}
        title={savedChapter!.title}
      >
        {savedChapter!.title} · page {pos!.page}
      </p>
      <Link
        href={`/books/${bookId}/chapter/${firstChapterId}?page=1`}
        className={`block w-full text-center py-2 rounded-xl text-xs ${ui.btnOutline}`}
      >
        Start from beginning
      </Link>
    </div>
  );
}
