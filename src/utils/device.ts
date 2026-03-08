/**
 * Device and platform detection utilities for PWA install flows and platform-specific UI.
 */

const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
const platform = typeof navigator !== "undefined" ? navigator.platform : "";
const maxTouchPoints = typeof navigator !== "undefined" ? navigator.maxTouchPoints : 0;

/** True on iPhone, iPad, or iPod (including iPad on iOS 13+ that reports as Mac). */
export function isIOS(): boolean {
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  if (platform === "MacIntel" && maxTouchPoints > 1) return true;
  return false;
}

/** True when user agent contains Android. */
export function isAndroid(): boolean {
  return /Android/i.test(ua);
}

/** True when the app is running as an installed PWA (standalone display mode). */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches;
}
