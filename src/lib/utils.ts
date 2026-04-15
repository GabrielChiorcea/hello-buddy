import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type FormatDisplayNumberOptions = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

/**
 * Formats numeric values for UI and hides floating point artifacts
 * like 1.20000000000003.
 */
export function formatDisplayNumber(
  value: number,
  options: FormatDisplayNumberOptions = {}
): string {
  if (!Number.isFinite(value)) return "0";

  const { minimumFractionDigits = 0, maximumFractionDigits = 2 } = options;

  return value.toLocaleString("ro-RO", {
    minimumFractionDigits,
    maximumFractionDigits,
  });
}
