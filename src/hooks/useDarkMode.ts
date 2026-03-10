import { useState, useEffect, useCallback } from "react";

const APP_STORAGE_KEY = "app-dark-mode";
const LEGACY_ADMIN_KEY = "admin-dark-mode";

export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;

    try {
      const appStored = window.localStorage.getItem(APP_STORAGE_KEY);
      const adminStored = window.localStorage.getItem(LEGACY_ADMIN_KEY);

      if (appStored === "true" || appStored === "false") {
        return appStored === "true";
      } else if (adminStored === "true" || adminStored === "false") {
        return adminStored === "true";
      } else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
        return true;
      }
    } catch {
      // ignore
    }

    return false;
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    try {
      window.localStorage.setItem(APP_STORAGE_KEY, String(isDark));
    } catch {
      // ignore
    }

    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  const toggle = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  return { isDark, toggle };
}
