import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyTheme, DEFAULT_THEME } from "./config/themes";

// Apply selected theme (override CSS variables)
applyTheme(DEFAULT_THEME);

// Sync initial dark mode on the document root based on user preference or system.
(() => {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  try {
    const appStored = window.localStorage.getItem("app-dark-mode");
    const adminStored = window.localStorage.getItem("admin-dark-mode");
    let isDark: boolean;

    if (appStored === "true" || appStored === "false") {
      isDark = appStored === "true";
    } else if (adminStored === "true" || adminStored === "false") {
      isDark = adminStored === "true";
    } else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
      isDark = true;
    } else {
      isDark = false;
    }

    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    const hasDarkClass = root.classList.contains("dark");

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
        hypothesisId: 'H5',
        location: 'main.tsx:initDark',
        message: 'Initial dark mode applied in main.tsx',
        data: { isDark, hasDarkClass },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion agent log
  } catch {
    // Preferința de dark mode nu e critică, putem ignora erorile aici.
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
