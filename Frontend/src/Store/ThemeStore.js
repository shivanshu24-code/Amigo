import { create } from "zustand";

const THEME_STORAGE_KEY = "amigo-theme";

const applyThemeClass = (mode) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
};

const getInitialTheme = () => {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const useThemeStore = create((set, get) => ({
  theme: "light",

  initializeTheme: () => {
    const theme = getInitialTheme();
    applyThemeClass(theme);
    set({ theme });
  },

  setTheme: (theme) => {
    const nextTheme = theme === "dark" ? "dark" : "light";
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    }
    applyThemeClass(nextTheme);
    set({ theme: nextTheme });
  },

  toggleTheme: () => {
    const current = get().theme;
    const next = current === "dark" ? "light" : "dark";
    get().setTheme(next);
  },
}));

