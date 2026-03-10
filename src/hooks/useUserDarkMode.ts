import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "app-dark-mode";

export function useUserDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "true" || stored === "false") {
        return stored === "true";
      }
    } catch {
      // ignore
    }

    return false;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(STORAGE_KEY, String(isDark));
    } catch {
      // ignore
    }
  }, [isDark]);

  const toggle = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  return { isDark, toggle };
}

