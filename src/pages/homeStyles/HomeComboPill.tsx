/**
 * Pastilă pentru categoria cu icon „combo” — între titlul Categorii și linkul spre catalog.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import type { Category } from '@/types';
import { CategoryIconDisplay } from '@/config/categoryIcons';
import { routes } from '@/config/routes';
import { cn } from '@/lib/utils';

type HomeComboVariant = 'clean' | 'friendly' | 'gamified' | 'premium';

/** Stil comun; culorile temei vin din variabilele CSS (`primary`, `muted`). */
const pillBase =
  'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-foreground shadow-sm transition-colors min-w-0 max-w-full no-underline';

/** Doar fundal + hover — restul e identic între teme. */
const pillBackground: Record<HomeComboVariant, string> = {
  clean: 'bg-muted hover:bg-muted/85',
  friendly: 'bg-primary/10 hover:bg-primary/40',
  gamified: 'bg-primary/10 hover:bg-primary/40',
  premium: 'bg-primary/10 hover:bg-primary/40',
};

export const HomeComboPill: React.FC<{
  category: Category;
  variant: HomeComboVariant;
  onNavigate: () => void;
}> = ({ category, variant, onNavigate }) => {
  return (
    <Link
      to={routes.catalog}
      onClick={onNavigate}
      className={cn(pillBase, pillBackground[variant])}
    >
      <CategoryIconDisplay categoryName={category.name} iconId={category.icon} size={20} className="shrink-0" />
      <span className="truncate">{category.displayName}</span>
    </Link>
  );
};
