/**
 * Shared hook pentru variantele Navbar.
 */

import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, UtensilsCrossed } from 'lucide-react';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { useAppSelector, useAppDispatch } from '@/store';
import { logout } from '@/store/slices/userSlice';
import { selectCartItemCount } from '@/store/slices/cartSlice';
import { toast } from '@/hooks/use-toast';
import { useMarketingPromoFlags } from '@/hooks/useMarketingPromoFlags';

export type DesktopPromoNavItem = {
  path: string;
  label: string;
  /** În navbar: streak mai „vizibil”; cupon mai compact dacă apar ambele (nu e cazul când ambele au conținut — atunci sunt pe Home). */
  variant: 'emphasis' | 'compact';
};

export interface NavbarDisplayData {
  isAuthenticated: boolean;
  user: any;
  cartItemCount: number;
  handleLogout: () => void;
  navLinks: { path: string; label: string; icon: any }[];
  /** Doar desktop: cupoane / campanii când un singur tip are conținut; gol dacă ambele sau niciunul */
  desktopPromoLinks: DesktopPromoNavItem[];
  isActive: (path: string) => boolean;
}

export function useNavbarData(): NavbarDisplayData {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((s) => s.user);
  const cartItemCount = useAppSelector(selectCartItemCount);
  const { hasStreak, hasCoupons, loading: promoLoading } = useMarketingPromoFlags();

  const handleLogout = async () => {
    await dispatch(logout());
    toast({ title: texts.notifications.logoutSuccess });
    navigate(routes.home);
  };

  const desktopPromoLinks = useMemo((): DesktopPromoNavItem[] => {
    if (promoLoading) return [];
    if (hasStreak && hasCoupons) return [];
    if (hasStreak) {
      return [{ path: routes.streak, label: texts.nav.streakCampaigns, variant: 'emphasis' }];
    }
    if (hasCoupons) {
      return [{ path: routes.coupons, label: texts.nav.coupons, variant: 'emphasis' }];
    }
    return [];
  }, [promoLoading, hasStreak, hasCoupons]);

  return {
    isAuthenticated,
    user,
    cartItemCount,
    handleLogout,
    navLinks: [
      { path: routes.home, label: texts.nav.home, icon: Home },
      { path: routes.catalog, label: texts.nav.catalog, icon: UtensilsCrossed },
    ],
    desktopPromoLinks,
    isActive: (path: string) => location.pathname === path,
  };
}
