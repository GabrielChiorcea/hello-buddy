import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import type { CSSProperties } from 'react';

export function formatCurrency(val: number): string {
  return `${val.toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} RON`;
}

export function formatHour(h: number): string {
  return `${h.toString().padStart(2, '0')}:00`;
}

/** Axe scurte (ex. grafic zilnic) */
export function formatAnalyticsDateShort(value: string | number | Date): string {
  try {
    const d = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return String(value);
    return format(d, 'dd MMM', { locale: ro });
  } catch {
    return String(value);
  }
}

/** Tooltip axă zilnică (lună fără an) */
export function formatAnalyticsMonthDay(value: string | number | Date): string {
  try {
    const d = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return String(value);
    return format(d, 'dd MMMM', { locale: ro });
  } catch {
    return String(value);
  }
}

/** Tooltip / etichete lungi */
export function formatAnalyticsDateLong(value: string | number | Date): string {
  try {
    const d = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return String(value);
    return format(d, 'dd MMMM yyyy', { locale: ro });
  } catch {
    return String(value);
  }
}

export const chartTooltipStyle: CSSProperties = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '13px',
};
