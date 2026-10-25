"use client";

import { useEffect, useState } from "react";

/**
 * Light / dark switch. The choice is saved in this browser (localStorage) and
 * applied before the page paints by the small script in app/layout.tsx.
 */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // storage can be blocked (private mode); the choice then lasts for this visit only
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-base hover:border-brand-600"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
