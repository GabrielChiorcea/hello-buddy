/**
 * Iconițe emoji native pentru categorii (food-ordering)
 * Colorate, vizuale, stil Glovo — zero overhead.
 */

import React from 'react';

export interface CategoryIcon {
  id: string;
  label: string;
  emoji: string;
}

// Lista de iconițe disponibile pentru selecție
export const CATEGORY_ICONS: CategoryIcon[] = [
  // Pizza & Paste
  { id: 'pizza', emoji: '🍕', label: 'Pizza' },
  { id: 'pasta', emoji: '🍝', label: 'Paste' },
  { id: 'spaghetti', emoji: '🍝', label: 'Spaghetti' },

  // Burgeri & Sandvișuri
  { id: 'burger', emoji: '🍔', label: 'Burger' },
  { id: 'hotdog', emoji: '🌭', label: 'Hot Dog' },
  { id: 'sandwich', emoji: '🥪', label: 'Sandviș' },
  { id: 'taco', emoji: '🌮', label: 'Taco' },
  { id: 'burrito', emoji: '🌯', label: 'Burrito' },

  // Carne & Pui
  { id: 'meat', emoji: '🥩', label: 'Carne' },
  { id: 'poultry', emoji: '🍗', label: 'Pui' },
  { id: 'bacon', emoji: '🥓', label: 'Bacon' },

  // Pește & Fructe de mare
  { id: 'fish', emoji: '🐟', label: 'Pește' },
  { id: 'shrimp', emoji: '🦐', label: 'Creveți' },
  { id: 'sushi', emoji: '🍣', label: 'Sushi' },

  // Salate & Legume
  { id: 'salad', emoji: '🥗', label: 'Salată' },
  { id: 'vegetable', emoji: '🥬', label: 'Legume' },
  { id: 'carrot', emoji: '🥕', label: 'Morcov' },
  { id: 'avocado', emoji: '🥑', label: 'Avocado' },

  // Supe & Ciorbe
  { id: 'soup', emoji: '🍲', label: 'Supă' },
  { id: 'stew', emoji: '🥘', label: 'Tocană' },

  // Deserturi
  { id: 'cake', emoji: '🎂', label: 'Tort' },
  { id: 'ice-cream', emoji: '🍦', label: 'Înghețată' },
  { id: 'donut', emoji: '🍩', label: 'Gogoașă' },
  { id: 'cookie', emoji: '🍪', label: 'Biscuit' },
  { id: 'chocolate', emoji: '🍫', label: 'Ciocolată' },
  { id: 'candy', emoji: '🍬', label: 'Bomboane' },
  { id: 'pie', emoji: '🥧', label: 'Plăcintă' },
  { id: 'cupcake', emoji: '🧁', label: 'Cupcake' },

  // Băuturi
  { id: 'coffee', emoji: '☕', label: 'Cafea' },
  { id: 'tea', emoji: '🍵', label: 'Ceai' },
  { id: 'juice', emoji: '🧃', label: 'Suc' },
  { id: 'soda', emoji: '🥤', label: 'Suc carbogazos' },
  { id: 'beer', emoji: '🍺', label: 'Bere' },
  { id: 'wine', emoji: '🍷', label: 'Vin' },
  { id: 'cocktail', emoji: '🍸', label: 'Cocktail' },
  { id: 'water', emoji: '💧', label: 'Apă' },

  // Mic dejun
  { id: 'egg', emoji: '🍳', label: 'Ouă' },
  { id: 'bread', emoji: '🍞', label: 'Pâine' },
  { id: 'croissant', emoji: '🥐', label: 'Croissant' },
  { id: 'pancakes', emoji: '🥞', label: 'Clătite' },
  { id: 'waffle', emoji: '🧇', label: 'Wafă' },

  // Altele
  { id: 'fries', emoji: '🍟', label: 'Cartofi prăjiți' },
  { id: 'popcorn', emoji: '🍿', label: 'Popcorn' },
  { id: 'cheese', emoji: '🧀', label: 'Brânză' },
  /** Folosită și pentru evidențierea categoriei „combo” pe Home (pastilă lângă titlu). */
  { id: 'combo', emoji: '🍱', label: 'Combo / meniu' },
  { id: 'default', emoji: '📦', label: 'General' },
];

/** Icon id pentru categorii „combo”; pe Home apare ca pastilă dacă există produse în categorie. */
export const CATEGORY_ICON_ID_COMBO = 'combo' as const;

// Mapare nume categorie -> icon id (pentru categorii existente)
const DEFAULT_CATEGORY_MAP: Record<string, string> = {
  pizza: 'pizza',
  burger: 'burger',
  paste: 'pasta',
  salate: 'salad',
  desert: 'cake',
  bauturi: 'soda',
  supe: 'soup',
  mic_dejun: 'egg',
  garnituri: 'fries',
  oua: 'egg',
  combo: 'combo',
  combouri: 'combo',
  meniu_combo: 'combo',
};

/**
 * Returnează emoji-ul pentru o categorie.
 */
export function getCategoryEmoji(categoryName: string, iconId?: string | null): string {
  if (iconId) {
    const found = CATEGORY_ICONS.find((i) => i.id === iconId);
    if (found) return found.emoji;
  }
  const normalizedName = categoryName.toLowerCase().replace(/[^a-z]/g, '_');
  const mappedId = DEFAULT_CATEGORY_MAP[normalizedName];
  if (mappedId) {
    const found = CATEGORY_ICONS.find((i) => i.id === mappedId);
    if (found) return found.emoji;
  }
  return '📦';
}

/**
 * Componentă helper care randează emoji-ul de categorie.
 * Păstrează interfața anterioară (size controlează font-size).
 */
export const CategoryIconDisplay: React.FC<{
  categoryName: string;
  iconId?: string | null;
  className?: string;
  size?: number;
}> = ({ categoryName, iconId, className = '', size = 20 }) => {
  const emoji = getCategoryEmoji(categoryName, iconId);
  return (
    <span
      className={className}
      style={{ fontSize: size, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      role="img"
      aria-label={categoryName}
    >
      {emoji}
    </span>
  );
};
