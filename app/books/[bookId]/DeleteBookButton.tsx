"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteBook } from "@/lib/api";

export default function DeleteBookButton({ bookId }: { bookId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteBook(bookId);
      router.push("/");
      router.refresh();
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-3 text-center space-y-2">
        <p className="text-xs text-red-600 dark:text-red-400 font-medium">Delete this book?</p>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirming(false)}
            className="flex-1 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-1.5 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="w-full py-2.5 text-sm rounded-xl border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-500 hover:border-red-200 dark:hover:border-red-900 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
    >
      Delete Book
    </button>
  );
}
