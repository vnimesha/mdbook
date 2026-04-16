import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-stone-50/90 dark:bg-zinc-950/90 backdrop-blur-sm border-b border-stone-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-2xl select-none">📖</span>
          <span
            className="text-lg font-semibold tracking-tight text-stone-900 dark:text-zinc-100"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            MDBook
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className="px-3 py-1.5 text-sm font-medium text-stone-600 dark:text-zinc-400 rounded-md hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Library
          </Link>
          <Link
            href="/create"
            className="px-4 py-2 text-sm font-medium text-white bg-stone-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-stone-700 dark:hover:bg-zinc-300 transition-colors"
          >
            New Book
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
