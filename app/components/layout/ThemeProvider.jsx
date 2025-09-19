"use client";

import { create } from "zustand";
import { useEffect } from "react";

export const useThemeStore = create((set) => ({
  theme: "light",
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
      return { theme: newTheme };
    }),
  setTheme: (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    set({ theme });
  },
}));

// Initialize theme from localStorage
export function useInitTheme() {
  const { setTheme } = useThemeStore();
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
  }, [setTheme]);
}
