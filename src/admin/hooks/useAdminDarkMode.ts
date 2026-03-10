/**
 * Hook pentru dark mode în panoul admin
 * Stochează preferința în localStorage, aplică clasa .dark pe wrapper
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'admin-dark-mode';

export function useAdminDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isDark));
    } catch {}

    try {
      const root = document.documentElement;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } catch {
      // Fail silently if document is not available (e.g. during SSR/tests)
    }
  }, [isDark]);

  const toggle = useCallback(() => setIsDark((prev) => !prev), []);

  return { isDark, toggle };
}
