import { queryOne } from '../../config/database.js';

const NEW_TOASTS_KEY = 'gamification_toasts_items';
const LEGACY_POINTS_TOASTS_KEY = 'gamification_toasts_points_items';

export interface GamificationToastItem {
  id: string;
  type: 'points' | 'coupons_active' | 'streak' | 'text_simple';
  text?: string;
  couponsActiveTitle?: string;
  couponsInactiveTitle?: string;
  image?: string;
  streakInactiveText?: string;
  pointsLoggedOutText?: string;
  couponsLoggedOutText?: string;
  streakLoggedOutText?: string;
  textSimpleLoggedOutText?: string;
  intervalMs: number;
  durationMs: number;
  isActive: boolean;
  createdAt: string;
}

export function sanitizeItems(items: GamificationToastItem[]): { items: GamificationToastItem[]; changed: boolean } {
  let changed = false;
  const sanitized = items.map((item) => {
    if (item.type !== 'streak') return item;
    if (!Object.prototype.hasOwnProperty.call(item, 'text')) return item;
    changed = true;
    const { text: _text, ...rest } = item;
    return rest;
  });
  return { items: sanitized, changed };
}

function parseItems(raw: string | null | undefined): GamificationToastItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item === 'object') as GamificationToastItem[];
  } catch {
    return [];
  }
}

export async function getItems(): Promise<GamificationToastItem[]> {
  const unified = await queryOne<{ value: string }>('SELECT value FROM app_settings WHERE id = ?', [NEW_TOASTS_KEY]);
  const unifiedItems = parseItems(unified?.value);
  if (unifiedItems.length > 0) return unifiedItems;

  // Soft fallback la cheia legacy
  const legacy = await queryOne<{ value: string }>('SELECT value FROM app_settings WHERE id = ?', [LEGACY_POINTS_TOASTS_KEY]);
  return parseItems(legacy?.value).map((item) => ({ ...item, type: 'points' }));
}
