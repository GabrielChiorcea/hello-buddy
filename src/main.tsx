import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyNavbarLayoutCssVars, loadAndApplyTheme, DEFAULT_THEME } from "./config/themes";

const rootEl = document.getElementById("root");

applyNavbarLayoutCssVars();

loadAndApplyTheme(DEFAULT_THEME).then(() => {
  if (rootEl) {
    createRoot(rootEl).render(<App />);
  }
});
