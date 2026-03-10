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
    <header className="sticky top-0 z-50 w-full hidden md:block">
      {/* Glassmorphism bar */}
      <div className="border-b border-border/20 bg-background/70 backdrop-blur-xl backdrop-saturate-150">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to={routes.home} className="flex items-center gap-2 shrink-0">
            <Crown className="h-5 w-5 text-primary" />
            <span className="font-light text-lg tracking-widest uppercase text-foreground hidden sm:inline">{texts.app.name}</span>
          </Link>

          <nav className="flex items-center gap-8">
            {navLinks.map(({ path, label }) => (
              <Link key={path} to={path} className={cn('text-xs font-light tracking-[0.2em] uppercase transition-colors', isActive(path) ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                {label}
              </Link>
            ))}
          </nav>

          <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative max-w-xs flex-1 mx-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <Input type="text" placeholder={texts.home.searchPlaceholder} value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} className="pl-9 pr-8 h-9 rounded-none border-0 border-b border-border/30 bg-transparent text-sm font-light focus-visible:ring-0 focus-visible:border-foreground/30" />
            {localSearch && (
              <button type="button" onClick={handleSearchClear} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </form>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setShowSearch(!showSearch)}>
              <Search className="h-5 w-5" />
            </Button>
            <Link to={routes.cart}>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs border border-primary/30 bg-primary/10 text-primary">{cartItemCount}</Badge>
                )}
              </Button>
            </Link>
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><User className="h-5 w-5" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-none border-border/30">
                  <div className="px-2 py-1.5"><p className="text-sm font-light">{user?.name}</p><p className="text-xs text-muted-foreground">{user?.email}</p></div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link to={routes.profile} className="cursor-pointer"><User className="mr-2 h-4 w-4" />{texts.nav.profile}</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />{texts.nav.logout}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" asChild className="font-light tracking-wide"><Link to={routes.login}>{texts.nav.login}</Link></Button>
                <Button asChild className="font-light tracking-wide rounded-none"><Link to={routes.signup}>{texts.nav.signup}</Link></Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSearch && (
        <div className="border-b border-border/20 bg-background/70 backdrop-blur-xl px-4 py-3 lg:hidden">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <Input type="text" placeholder={texts.home.searchPlaceholder} value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} className="pl-9 pr-8 h-10 rounded-none border-0 border-b border-border/30 bg-transparent font-light" autoFocus />
            {localSearch && <button type="button" onClick={handleSearchClear} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-4 w-4 text-muted-foreground" /></button>}
          </form>
        </div>
      )}
    </header>
  );
};
