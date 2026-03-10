import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyTheme, DEFAULT_THEME } from "./config/themes";

// Apply selected theme (override CSS variables) — user side rămâne doar light.
applyTheme(DEFAULT_THEME);

createRoot(document.getElementById("root")!).render(<App />);
