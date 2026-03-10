/**
 * Navbar — Premium
 * Glassmorphism, bordură subțire elegantă — ideal pentru restaurante upscale.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ShoppingCart, User, LogOut, Crown, Search, X } from 'lucide-react';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { cn } from '@/lib/utils';
import type { NavbarDisplayData } from './shared';

export const PremiumNav: React.FC<{ data: NavbarDisplayData }> = ({ data }) => {
  const {
    showSearch, setShowSearch, localSearch, setLocalSearch,
    isAuthenticated, user, cartItemCount,
    handleLogout, handleSearchSubmit, handleSearchClear, navLinks, isActive,
  } = data;

  return (
    <header className="sticky top-4 z-50 w-full hidden md:block px-4">
      {/* Floating glass pill — Apple style */}
      <div className="mx-auto max-w-5xl rounded-full border border-white/20 bg-background/60 backdrop-blur-2xl backdrop-saturate-200 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.3)]">
        <div className="flex h-14 items-center justify-between px-6">
          <Link to={routes.home} className="flex items-center gap-2 shrink-0">
            <Crown className="h-5 w-5 text-primary" />
            <span className="font-medium text-sm tracking-wide text-foreground">{texts.app.name}</span>
          </Link>

          <nav className="flex items-center gap-6">
            {navLinks.map(({ path, label }) => (
              <Link 
                key={path} 
                to={path} 
                className={cn(
                  'text-xs font-medium tracking-wide transition-all duration-200 px-3 py-1.5 rounded-full',
                  isActive(path) 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/40'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative max-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input 
              type="text" 
              placeholder="Caută..." 
              value={localSearch} 
              onChange={(e) => setLocalSearch(e.target.value)} 
              className="pl-8 pr-7 h-9 rounded-full border-0 bg-white/50 text-xs font-medium placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-white/80 transition-all"
            />
            {localSearch && (
              <button type="button" onClick={handleSearchClear} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <X className="h-3 w-3 text-muted-foreground/60" />
              </button>
            )}
          </form>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 rounded-full hover:bg-white/50" onClick={() => setShowSearch(!showSearch)}>
              <Search className="h-4 w-4" />
            </Button>
            <Link to={routes.cart}>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-white/50">
                <ShoppingCart className="h-4 w-4" />
                {cartItemCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full text-[10px] font-semibold flex items-center justify-center bg-primary text-primary-foreground">
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </Button>
            </Link>
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-white/50">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl border-white/30 bg-background/80 backdrop-blur-xl">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem asChild>
                    <Link to={routes.profile} className="cursor-pointer rounded-lg">
                      <User className="mr-2 h-4 w-4" />{texts.nav.profile}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive rounded-lg">
                    <LogOut className="mr-2 h-4 w-4" />{texts.nav.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild className="h-8 px-4 rounded-full text-xs font-medium hover:bg-white/50">
                  <Link to={routes.login}>{texts.nav.login}</Link>
                </Button>
                <Button asChild className="h-8 px-4 rounded-full text-xs font-medium shadow-md">
                  <Link to={routes.signup}>{texts.nav.signup}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSearch && (
        <div className="mt-2 mx-auto max-w-5xl rounded-2xl border border-white/20 bg-background/70 backdrop-blur-xl px-4 py-3 lg:hidden shadow-lg">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <Input 
              type="text" 
              placeholder={texts.home.searchPlaceholder} 
              value={localSearch} 
              onChange={(e) => setLocalSearch(e.target.value)} 
              className="pl-9 pr-8 h-10 rounded-xl border-0 bg-white/60 font-medium" 
              autoFocus 
            />
            {localSearch && <button type="button" onClick={handleSearchClear} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-4 w-4 text-muted-foreground" /></button>}
          </form>
        </div>
      )}
    </header>
  );
};
