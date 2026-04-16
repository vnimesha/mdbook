import Link from "next/link";
import type { BookSummary } from "@/lib/types";

interface Props {
  book: BookSummary;
}

function readingTime(chapterCount: number): string {
  // rough estimate: avg chapter ~2000 words, 250 wpm
  const mins = chapterCount * 8;
  if (mins < 60) return `~${mins} min read`;
  const hrs = Math.round(mins / 60);
  return `~${hrs}h read`;
}

export default function BookCard({ book }: Props) {
  return (
    <Link href={`/books/${book.id}`} className="group block">
      <article className="h-full bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
        {/* Spine / Cover strip */}
        <div
          className="h-2 w-full"
          style={{ backgroundColor: book.cover_color }}
        />

        {/* Book "spine" graphic */}
        <div
          className="relative h-44 flex items-end p-5"
          style={{ backgroundColor: book.cover_color + "18" }}
        >
          {/* Decorative book icon */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 10px,
                ${book.cover_color} 10px,
                ${book.cover_color} 11px
              )`,
            }}
          />
          <div className="relative">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-1 opacity-70"
              style={{ color: book.cover_color, fontFamily: "var(--font-sans)" }}
            >
              {book.author}
            </p>
            <h2
              className="text-xl font-bold leading-tight text-stone-900 group-hover:text-stone-700 transition-colors"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {book.title}
            </h2>
          </div>
        </div>

        {/* Meta */}
        <div className="p-5">
          {book.description && (
            <p className="text-sm text-stone-500 line-clamp-2 mb-4 leading-relaxed">
              {book.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-stone-400">
            <span>
              {book.chapter_count} {book.chapter_count === 1 ? "chapter" : "chapters"}
            </span>
            <span>·</span>
            <span>{readingTime(book.chapter_count)}</span>
          </div>

          {book.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {book.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs rounded-full bg-stone-100 text-stone-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
