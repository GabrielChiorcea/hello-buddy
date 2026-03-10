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
    } catch {
      // ignore
    }
  }, [isDark]);

  const toggle = useCallback(() => setIsDark((prev) => !prev), []);

  return { isDark, toggle };
}
