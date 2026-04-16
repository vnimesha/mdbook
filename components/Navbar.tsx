import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { ui } from "@/lib/ui";

export default function Navbar() {
  return (
    <header className={`sticky top-0 z-50 ${ui.navBg} border-b ${ui.border}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-2xl select-none">📖</span>
          <span
            className={`text-lg font-semibold tracking-tight ${ui.text}`}
            style={{ fontFamily: "var(--font-serif)" }}
          >
            MDBook
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${ui.navLink}`}
          >
            Library
          </Link>
          <Link
            href="/create"
            className={`px-4 py-2 text-sm font-medium rounded-lg ${ui.btnPrimary}`}
          >
            New Book
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
