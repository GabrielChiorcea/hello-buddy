/** Culoare serie pentru Recharts — aliniată la tokenii `--chart-1` … `--chart-8` din index.css */
export function chartSeriesColor(index: number): string {
  const n = (Math.abs(index) % 8) + 1;
  return `hsl(var(--chart-${n}))`;
}

export const CHART_SERIES_COUNT = 8;
