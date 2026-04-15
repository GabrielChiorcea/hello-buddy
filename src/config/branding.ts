/**
 * Branding static (frontend).
 *
 * Logo hero + navbar: pune fișierul în `public/` (ex. `public/logo.png`) și setează în `.env.development` / `.env.production`:
 *   VITE_APP_LOGO_URL=/logo.png
 *
 * Repornește dev server după modificarea fișierului env.
 *
 * Lasă logo necompletat pentru a folosi iconurile implicite (Lucide) în hero și navbar.
 */
export const BRANDING_LOGO_URL = (import.meta.env.VITE_APP_LOGO_URL ?? '').trim();
