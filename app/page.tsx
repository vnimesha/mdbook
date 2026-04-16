import { listBooks } from "@/lib/api";
import BookCard from "@/components/BookCard";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import type { BookSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  let books: BookSummary[] = [];
  let error: string | null = null;

  try {
    books = await listBooks();
  } catch {
    error =
      "Could not connect to the backend. Make sure the FastAPI server is running on port 8000.";
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        {/* Hero */}
        <div className="mb-12">
          <h1
            className="text-4xl md:text-5xl font-bold text-stone-900 dark:text-zinc-100 mb-3"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Your Library
          </h1>
          <p className="text-stone-500 dark:text-zinc-400 text-lg">
            Beautiful books from Markdown &amp; MDX files.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6 text-red-700 dark:text-red-400 text-sm">
            <p className="font-semibold mb-1">Backend unavailable</p>
            <p>{error}</p>
            <p className="mt-3 font-mono text-xs bg-red-100 dark:bg-red-950/50 rounded px-3 py-2">
              cd backend &amp;&amp; pip install -r requirements.txt &amp;&amp; uvicorn main:app
              --reload
            </p>
          </div>
        ) : books.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-stone-200 dark:border-zinc-800 py-6 text-center text-sm text-stone-400 dark:text-zinc-600">
        MDBook — built with Next.js &amp; FastAPI
      </footer>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-24">
      <p className="text-6xl mb-6 select-none">📚</p>
      <h2
        className="text-2xl font-semibold text-stone-700 dark:text-zinc-300 mb-2"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        Your library is empty
      </h2>
      <p className="text-stone-400 dark:text-zinc-500 mb-8">Upload your first book to get started.</p>
      <Link
        href="/create"
        className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-stone-700 dark:hover:bg-zinc-300 transition-colors"
      >
        <span>+</span> Create your first book
      </Link>
    </div>
  );
}
