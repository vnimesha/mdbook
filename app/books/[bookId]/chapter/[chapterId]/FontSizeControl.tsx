"use client";

import { useEffect, useState } from "react";
import { getFontSize, setFontSize } from "@/lib/reader-storage";
import { ui } from "@/lib/ui";

const MIN = 13;
const MAX = 22;
const STEP = 1;

function applySize(px: number) {
  document.documentElement.style.setProperty("--reader-font-size", `${px}px`);
}

export default function FontSizeControl() {
  const [size, setSize] = useState(16);

  useEffect(() => {
    const saved = getFontSize();
    setSize(saved);
    applySize(saved);
  }, []);

  const change = (delta: number) => {
    const next = Math.max(MIN, Math.min(MAX, size + delta));
    setSize(next);
    setFontSize(next);
    applySize(next);
  };

  return (
    <div
      className={`flex items-center gap-0.5 border ${ui.border} rounded-lg overflow-hidden`}
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <button
        type="button"
        onClick={() => change(-STEP)}
        disabled={size <= MIN}
        aria-label="Decrease font size"
        className={`px-2 py-1 text-xs ${ui.textFaint} hover:${ui.textSecondary} ${ui.hoverBg} transition-colors disabled:opacity-30`}
      >
        A
      </button>
      <span className={`w-px h-4 ${ui.border} self-center`} aria-hidden />
      <button
        type="button"
        onClick={() => change(STEP)}
        disabled={size >= MAX}
        aria-label="Increase font size"
        className={`px-2 py-1 text-sm font-medium ${ui.textFaint} hover:${ui.textSecondary} ${ui.hoverBg} transition-colors disabled:opacity-30`}
      >
        A
      </button>
    </div>
  );
}
