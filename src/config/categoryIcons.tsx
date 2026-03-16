/**
 * Iconițe SVG pentru categorii (food-ordering)
 * Folosesc Lucide React — culorile se moștenesc prin text-current / tokens semantice.
 */

import React from 'react';
import {
  Pizza,
  Utensils,
  Sandwich,
  Beef,
  Drumstick,
  Fish,
  Salad,
  Carrot,
  Soup,
  Cake,
  CakeSlice,
  IceCreamCone,
  Cookie,
  Candy,
  Coffee,
  CupSoda,
  CupSoda,
  Beer,
  Wine,
  Martini,
  Droplets,
  Egg,
  Croissant,
  Wheat,
  Popcorn,
  Leaf,
  Package,
  Apple,
  type LucideProps,
} from 'lucide-react';

export interface CategoryIcon {
  id: string;
  label: string;
  icon: React.FC<LucideProps>;
}

// Lista de iconițe disponibile pentru selecție
export const CATEGORY_ICONS: CategoryIcon[] = [
  // Pizza & Paste
  { id: 'pizza', icon: Pizza, label: 'Pizza' },
  { id: 'pasta', icon: Utensils, label: 'Paste' },
  { id: 'spaghetti', icon: Utensils, label: 'Spaghetti' },

  // Burgeri & Sandvișuri
  { id: 'burger', icon: Sandwich, label: 'Burger' },
  { id: 'hotdog', icon: Beef, label: 'Hot Dog' },
  { id: 'sandwich', icon: Sandwich, label: 'Sandviș' },
  { id: 'taco', icon: Utensils, label: 'Taco' },
  { id: 'burrito', icon: Utensils, label: 'Burrito' },

  // Carne & Pui
  { id: 'meat', icon: Beef, label: 'Carne' },
  { id: 'poultry', icon: Drumstick, label: 'Pui' },
  { id: 'bacon', icon: Beef, label: 'Bacon' },

  // Pește & Fructe de mare
  { id: 'fish', icon: Fish, label: 'Pește' },
  { id: 'shrimp', icon: Fish, label: 'Creveți' },
  { id: 'sushi', icon: Fish, label: 'Sushi' },

  // Salate & Legume
  { id: 'salad', icon: Salad, label: 'Salată' },
  { id: 'vegetable', icon: Leaf, label: 'Legume' },
  { id: 'carrot', icon: Carrot, label: 'Morcov' },
  { id: 'avocado', icon: Apple, label: 'Avocado' },

  // Supe & Ciorbe
  { id: 'soup', icon: Soup, label: 'Supă' },
  { id: 'stew', icon: Soup, label: 'Tocană' },

  // Deserturi
  { id: 'cake', icon: Cake, label: 'Tort' },
  { id: 'ice-cream', icon: IceCreamCone, label: 'Înghețată' },
  { id: 'donut', icon: CakeSlice, label: 'Gogoașă' },
  { id: 'cookie', icon: Cookie, label: 'Biscuit' },
  { id: 'chocolate', icon: Candy, label: 'Ciocolată' },
  { id: 'candy', icon: Candy, label: 'Bomboane' },
  { id: 'pie', icon: CakeSlice, label: 'Plăcintă' },
  { id: 'cupcake', icon: CakeSlice, label: 'Cupcake' },

  // Băuturi
  { id: 'coffee', icon: Coffee, label: 'Cafea' },
  { id: 'tea', icon: Cup, label: 'Ceai' },
  { id: 'juice', icon: CupSoda, label: 'Suc' },
  { id: 'soda', icon: CupSoda, label: 'Suc carbogazos' },
  { id: 'beer', icon: Beer, label: 'Bere' },
  { id: 'wine', icon: Wine, label: 'Vin' },
  { id: 'cocktail', icon: Martini, label: 'Cocktail' },
  { id: 'water', icon: Droplets, label: 'Apă' },

  // Mic dejun
  { id: 'egg', icon: Egg, label: 'Ouă' },
  { id: 'bread', icon: Wheat, label: 'Pâine' },
  { id: 'croissant', icon: Croissant, label: 'Croissant' },
  { id: 'pancakes', icon: CakeSlice, label: 'Clătite' },
  { id: 'waffle', icon: CakeSlice, label: 'Wafă' },

  // Altele
  { id: 'fries', icon: Utensils, label: 'Cartofi prăjiți' },
  { id: 'popcorn', icon: Popcorn, label: 'Popcorn' },
  { id: 'cheese', icon: Utensils, label: 'Brânză' },
  { id: 'default', icon: Package, label: 'General' },
];

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
};

/**
 * Returnează componenta Lucide pentru o categorie.
 */
export function getCategoryIconComponent(categoryName: string, iconId?: string | null): React.FC<LucideProps> {
  // Direct match by icon id
  if (iconId) {
    const found = CATEGORY_ICONS.find((i) => i.id === iconId);
    if (found) return found.icon;
  }
  // Fallback by category name
  const normalizedName = categoryName.toLowerCase().replace(/[^a-z]/g, '_');
  const mappedId = DEFAULT_CATEGORY_MAP[normalizedName];
  if (mappedId) {
    const found = CATEGORY_ICONS.find((i) => i.id === mappedId);
    if (found) return found.icon;
  }
  return Package;
}

/**
 * Componentă helper care randează iconița de categorie.
 * Moștenește culoarea de la parent prin `text-current`.
 */
export const CategoryIconDisplay: React.FC<{
  categoryName: string;
  iconId?: string | null;
  className?: string;
  size?: number;
}> = ({ categoryName, iconId, className = '', size = 20 }) => {
  const IconComponent = getCategoryIconComponent(categoryName, iconId);
  return <IconComponent size={size} className={className} />;
};
