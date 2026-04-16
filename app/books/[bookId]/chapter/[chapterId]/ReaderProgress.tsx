"use client";

import { useEffect, useState } from "react";

export default function ReaderProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setPct(total > 0 ? Math.round((scrolled / total) * 100) : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-stone-200 dark:bg-[#1a1a18]">
      <div
        className="h-full bg-blue-600 dark:bg-blue-500 transition-[width] duration-100"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
