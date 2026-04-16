import { listBooks } from "@/lib/api";
import BookCard from "@/components/BookCard";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import type { BookSummary } from "@/lib/types";
import { ui } from "@/lib/ui";

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
            className={`text-4xl md:text-5xl font-bold ${ui.text} mb-3`}
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Your Library
          </h1>
          <p className={`${ui.textMuted} text-lg`}>
            Beautiful books from Markdown &amp; MDX files.
          </p>
        </div>

        {error ? (
          <div className={`rounded-xl border ${ui.dangerBorder} ${ui.dangerBg} p-6 ${ui.dangerText} text-sm`}>
            <p className="font-semibold mb-1">Backend unavailable</p>
            <p>{error}</p>
            <p className={`mt-3 font-mono text-xs ${ui.inlineBg} rounded px-3 py-2`}>
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

      <footer className={`border-t ${ui.border} py-6 text-center text-sm ${ui.footerText}`}>
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
        className={`text-2xl font-semibold ${ui.textSecondary} mb-2`}
        style={{ fontFamily: "var(--font-serif)" }}
      >
        Your library is empty
      </h2>
      <p className={`${ui.textFaint} mb-8`}>Upload your first book to get started.</p>
      <Link
        href="/create"
        className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium ${ui.btnPrimary}`}
      >
        <span>+</span> Create your first book
      </Link>
    </div>
  );
}
