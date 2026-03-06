import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true, // ascultă pe toate interfețele – accesibil și pe IP local (ex: http://192.168.x.x:8080)
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Previne instanțe duplicate de React care cauzează erori useContext
    dedupe: ["react", "react-dom", "react/jsx-runtime", "@apollo/client"],
  },
}));
