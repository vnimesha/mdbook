"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteBook } from "@/lib/api";
import { ui } from "@/lib/ui";

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
      <div className={`rounded-xl border ${ui.dangerBorder} ${ui.dangerBg} p-3 text-center space-y-2`}>
        <p className={`text-xs ${ui.dangerText} font-medium`}>Delete this book?</p>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirming(false)}
            className={`flex-1 py-1.5 text-xs rounded-lg ${ui.btnOutline}`}
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
      className={`w-full py-2.5 text-sm rounded-xl border ${ui.border} ${ui.textMuted} ${ui.dangerHover} transition-colors`}
    >
      Delete Book
    </button>
  );
}
