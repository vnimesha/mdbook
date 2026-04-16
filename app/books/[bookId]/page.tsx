import { getBook } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { notFound } from "next/navigation";
import DeleteBookButton from "./DeleteBookButton";
import AddChapterButton from "./AddChapterButton";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ bookId: string }>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function wordCountToTime(words: number) {
  const mins = Math.round(words / 250);
  if (mins < 1) return "< 1 min";
  if (mins < 60) return `${mins} min`;
  return `${Math.round(mins / 60)}h ${mins % 60}m`;
}

export default async function BookPage({ params }: Props) {
  const { bookId } = await params;

  let book;
  try {
    book = await getBook(bookId);
  } catch {
    notFound();
  }

  const sortedChapters = [...book.chapters].sort((a, b) => a.order - b.order);
  const totalWords = book.chapters.reduce((sum, c) => sum + c.word_count, 0);
  const firstChapter = sortedChapters[0];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Cover hero */}
      <div
        className="relative overflow-hidden"
        style={{ backgroundColor: book.cover_color }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 20px, rgba(255,255,255,0.3) 20px, rgba(255,255,255,0.3) 21px)`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-24">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white mb-8 transition-colors"
          >
            ← Library
          </Link>

          <div className="max-w-2xl">
            <p className="text-white/60 text-sm font-semibold uppercase tracking-widest mb-2">
              {book.author}
            </p>
            <h1
              className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {book.title}
            </h1>
            {book.description && (
              <p className="text-white/70 text-lg leading-relaxed mb-6">{book.description}</p>
            )}
            <div className="flex flex-wrap gap-3 text-sm text-white/50">
              <span>{sortedChapters.length} chapters</span>
              <span>·</span>
              <span>{totalWords.toLocaleString()} words</span>
              <span>·</span>
              <span>~{wordCountToTime(totalWords)} read</span>
              <span>·</span>
              <span>Added {formatDate(book.created_at)}</span>
            </div>
            {book.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {book.tags.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-0.5 text-xs rounded-full bg-white/20 text-white/80"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Chapter list */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-xl font-semibold text-stone-800 dark:text-zinc-200"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                Table of Contents
              </h2>
              <AddChapterButton bookId={book.id} />
            </div>

            {sortedChapters.length === 0 ? (
              <div className="text-center py-16 text-stone-400 dark:text-zinc-500">
                <p className="text-4xl mb-3">📄</p>
                <p>No chapters yet. Add your first chapter!</p>
              </div>
            ) : (
              <ol className="space-y-1.5">
                {sortedChapters.map((chapter, i) => (
                  <li key={chapter.id}>
                    <Link
                      href={`/books/${book.id}/chapter/${chapter.id}`}
                      className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors group"
                    >
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 dark:bg-zinc-800 group-hover:bg-white dark:group-hover:bg-zinc-700 text-stone-500 dark:text-zinc-400 text-xs font-semibold shrink-0 transition-colors">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-800 dark:text-zinc-200 group-hover:text-stone-900 dark:group-hover:text-zinc-100 truncate">
                          {chapter.title}
                        </p>
                        <p className="text-xs text-stone-400 dark:text-zinc-500 mt-0.5">
                          {chapter.word_count.toLocaleString()} words ·{" "}
                          ~{wordCountToTime(chapter.word_count)}
                        </p>
                      </div>
                      <span className="text-stone-300 dark:text-zinc-600 group-hover:text-stone-500 dark:group-hover:text-zinc-400 transition-colors">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-56 shrink-0 space-y-4">
            {firstChapter && (
              <Link
                href={`/books/${book.id}/chapter/${firstChapter.id}`}
                className="block w-full text-center py-3 rounded-xl font-semibold text-white transition-colors"
                style={{ backgroundColor: book.cover_color }}
              >
                Start Reading →
              </Link>
            )}
            <DeleteBookButton bookId={book.id} />
          </div>
        </div>
      </main>
    </div>
  );
}
