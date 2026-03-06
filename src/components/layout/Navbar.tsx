/**
 * Navbar component - Desktop only (mobile uses MobileBottomNav)
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ShoppingCart, 
  User, 
  LogOut, 
  Home, 
  UtensilsCrossed,
  Search,
  X,
} from 'lucide-react';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { useAppSelector, useAppDispatch } from '@/store';
import { logout } from '@/store/slices/userSlice';
import { setSearchQuery } from '@/store/slices/productsSlice';
import { selectCartItemCount } from '@/store/slices/cartSlice';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showSearch, setShowSearch] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  
  const { isAuthenticated, user } = useAppSelector((state) => state.user);
  const cartItemCount = useAppSelector(selectCartItemCount);

  const handleLogout = async () => {
    await dispatch(logout());
    toast({
      title: texts.notifications.logoutSuccess,
    });
    navigate(routes.home);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
      dispatch(setSearchQuery(localSearch.trim()));
      navigate(routes.catalog);
    }
  };

  const handleSearchClear = () => {
    setLocalSearch('');
    setShowSearch(false);
    dispatch(setSearchQuery(''));
  };

  const navLinks = [
    { path: routes.home, label: texts.nav.home, icon: Home },
    { path: routes.catalog, label: texts.nav.catalog, icon: UtensilsCrossed },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 hidden md:block">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link 
          to={routes.home} 
          className="flex items-center gap-2 font-bold text-xl text-primary shrink-0"
        >
          <UtensilsCrossed className="h-6 w-6" />
          <span className="hidden sm:inline">{texts.app.name}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="flex items-center gap-6">
          {navLinks.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                isActive(path) ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Search Bar (inline) */}
        <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative max-w-xs flex-1 mx-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={texts.home.searchPlaceholder}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9 pr-8 h-9 rounded-full text-sm"
          />
          {localSearch && (
            <button type="button" onClick={handleSearchClear} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </form>

        {/* Desktop Actions */}
        <div className="flex items-center gap-3">
          {/* Search toggle for medium screens */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Cart */}
          <Link to={routes.cart}>
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge 
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </Link>

          {/* Auth */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={routes.profile} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    {texts.nav.profile}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {texts.nav.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" asChild>
                <Link to={routes.login}>{texts.nav.login}</Link>
              </Button>
              <Button asChild>
                <Link to={routes.signup}>{texts.nav.signup}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile search dropdown */}
      {showSearch && (
        <div className="border-t px-4 py-3 lg:hidden">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={texts.home.searchPlaceholder}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 pr-8 h-10 rounded-full"
              autoFocus
            />
            {localSearch && (
              <button type="button" onClick={handleSearchClear} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </form>
        </div>
      )}
    </header>
  );
};

export { Navbar };
