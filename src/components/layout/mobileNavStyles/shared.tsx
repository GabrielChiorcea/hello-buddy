/**
 * Shared hook pentru variantele MobileBottomNav.
 */

import { useLocation } from 'react-router-dom';
import { Home, UtensilsCrossed, ShoppingCart, User } from 'lucide-react';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { useAppSelector } from '@/store';
import { selectCartItemCount } from '@/store/slices/cartSlice';

export interface MobileNavItem {
  path: string;
  label: string;
  icon: React.FC<any>;
  badge?: number;
}

export interface MobileNavDisplayData {
  navItems: MobileNavItem[];
  isActive: (path: string) => boolean;
}

export function useMobileNavData(): MobileNavDisplayData {
  const location = useLocation();
  const { isAuthenticated } = useAppSelector((s) => s.user);
  const cartItemCount = useAppSelector(selectCartItemCount);

  return {
    navItems: [
      { path: routes.home, label: texts.nav.home, icon: Home },
      { path: routes.catalog, label: texts.nav.catalog, icon: UtensilsCrossed },
      { path: routes.cart, label: texts.nav.cart, icon: ShoppingCart, badge: cartItemCount },
      {
        path: isAuthenticated ? routes.profile : routes.login,
        label: isAuthenticated ? texts.nav.profile : texts.nav.login,
        icon: User,
      },
    ],
    isActive: (path: string) => location.pathname === path,
  };
}
