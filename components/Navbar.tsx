import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-stone-50/90 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-2xl select-none">📖</span>
          <span
            className="text-lg font-semibold tracking-tight text-stone-900"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            MDBook
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="px-3 py-1.5 text-sm font-medium text-stone-600 rounded-md hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            Library
          </Link>
          <Link
            href="/create"
            className="ml-2 px-4 py-2 text-sm font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-700 transition-colors"
          >
            New Book
          </Link>
        </nav>
      </div>
    </header>
  );
}
