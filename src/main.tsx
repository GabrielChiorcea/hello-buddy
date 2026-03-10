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
  } catch {
    // ignore
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
