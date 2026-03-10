import { useState, useEffect, useCallback } from "react";

const APP_STORAGE_KEY = "app-dark-mode";
const LEGACY_ADMIN_KEY = "admin-dark-mode";

export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;

    let initial = false;

    try {
      const appStored = window.localStorage.getItem(APP_STORAGE_KEY);
      const adminStored = window.localStorage.getItem(LEGACY_ADMIN_KEY);

      if (appStored === "true" || appStored === "false") {
        initial = appStored === "true";
      } else if (adminStored === "true" || adminStored === "false") {
        initial = adminStored === "true";
      } else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
        initial = true;
      }
    } catch {
      // ignore
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5b30d7ea-62d4-4fc8-b8b7-5a517226527b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '102b61',
      },
      body: JSON.stringify({
        sessionId: '102b61',
        runId: 'run1',
        hypothesisId: 'H1',
        location: 'hooks/useDarkMode.ts:init',
        message: 'Initial dark mode value computed',
        data: { initial },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion agent log

    return initial;
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    try {
      window.localStorage.setItem(APP_STORAGE_KEY, String(isDark));
    } catch {
      // ignore
    }

    let hasDarkClass = false;
    try {
      const root = document.documentElement;
      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      hasDarkClass = root.classList.contains("dark");
    } catch {
      // ignore
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5b30d7ea-62d4-4fc8-b8b7-5a517226527b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '102b61',
      },
      body: JSON.stringify({
        sessionId: '102b61',
        runId: 'run1',
        hypothesisId: 'H2',
        location: 'hooks/useDarkMode.ts:effect',
        message: 'Dark mode effect applied',
        data: { isDark, hasDarkClass },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion agent log
  }, [isDark]);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5b30d7ea-62d4-4fc8-b8b7-5a517226527b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': '102b61',
        },
        body: JSON.stringify({
          sessionId: '102b61',
          runId: 'run1',
          hypothesisId: 'H3',
          location: 'hooks/useDarkMode.ts:toggle',
          message: 'Dark mode toggled',
          data: { prev, next },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion agent log

      return next;
    });
  }, []);

  return { isDark, toggle };
}

