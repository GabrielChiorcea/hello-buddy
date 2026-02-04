/**
 * Iconițe predefinite pentru categorii
 * Fiecare categorie poate avea un emoji sau o iconiță asociată
 */

export interface CategoryIcon {
  id: string;
  emoji: string;
  label: string;
}

// Lista de iconițe disponibile pentru selecție
export const CATEGORY_ICONS: CategoryIcon[] = [
  // Pizza & Paste
  { id: 'pizza', emoji: '🍕', label: 'Pizza' },
  { id: 'pasta', emoji: '🍝', label: 'Paste' },
  { id: 'spaghetti', emoji: '🍜', label: 'Spaghetti' },
  
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
  { id: 'cake', emoji: '🍰', label: 'Tort' },
  { id: 'ice-cream', emoji: '🍨', label: 'Înghețată' },
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
  { id: 'cocktail', emoji: '🍹', label: 'Cocktail' },
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
  { id: 'default', emoji: '📦', label: 'General' },
];

// Mapare nume categorie -> emoji (pentru categorii existente)
export const DEFAULT_CATEGORY_ICONS: Record<string, string> = {
  pizza: '🍕',
  burger: '🍔',
  paste: '🍝',
  salate: '🥗',
  desert: '🍰',
  bauturi: '🥤',
  supe: '🍲',
  mic_dejun: '🍳',
  garnituri: '🍟',
  oua: '🍳',
};

/**
 * Returnează emoji-ul pentru o categorie
 */
export function getCategoryIcon(categoryName: string, icon?: string): string {
  // Dacă are icon specific salvat
  if (icon && CATEGORY_ICONS.find(i => i.id === icon)) {
    return CATEGORY_ICONS.find(i => i.id === icon)?.emoji || '📦';
  }
  
  // Fallback la iconițele default bazate pe nume
  const normalizedName = categoryName.toLowerCase().replace(/[^a-z]/g, '_');
  return DEFAULT_CATEGORY_ICONS[normalizedName] || '📦';
}
