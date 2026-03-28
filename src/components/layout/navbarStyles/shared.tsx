/**
 * Shared hook pentru variantele Navbar.
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { Home, UtensilsCrossed } from 'lucide-react';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { useAppSelector, useAppDispatch } from '@/store';
import { logout } from '@/store/slices/userSlice';
import { selectCartItemCount } from '@/store/slices/cartSlice';
import { toast } from '@/hooks/use-toast';

export interface NavbarDisplayData {
  isAuthenticated: boolean;
  user: any;
  cartItemCount: number;
  handleLogout: () => void;
  navLinks: { path: string; label: string; icon: any }[];
  isActive: (path: string) => boolean;
}

export function useNavbarData(): NavbarDisplayData {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((s) => s.user);
  const cartItemCount = useAppSelector(selectCartItemCount);

  const handleLogout = async () => {
    await dispatch(logout());
    toast({ title: texts.notifications.logoutSuccess });
    navigate(routes.home);
  };

  return {
    isAuthenticated,
    user,
    cartItemCount,
    handleLogout,
    navLinks: [
      { path: routes.home, label: texts.nav.home, icon: Home },
      { path: routes.catalog, label: texts.nav.catalog, icon: UtensilsCrossed },
    ],
    isActive: (path: string) => location.pathname === path,
  };
}
