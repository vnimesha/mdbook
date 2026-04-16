import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ui } from "@/lib/ui";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <p className="text-7xl mb-6 select-none">📖</p>
        <h1
          className={`text-3xl font-bold ${ui.textSecondary} mb-2`}
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Page not found
        </h1>
        <p className={`${ui.textFaint} mb-8`}>
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className={`px-6 py-3 rounded-lg font-medium ${ui.btnPrimary}`}
        >
          Back to Library
        </Link>
      </main>
    </div>
  );
}
