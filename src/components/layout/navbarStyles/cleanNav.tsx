/**
 * Navbar — Clean / Minimal
 * Fără bordură, ultra-minimal, transparent — ideal pentru healthy brands.
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
import { ShoppingCart, User, LogOut, Search, X } from 'lucide-react';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { cn } from '@/lib/utils';
import type { NavbarDisplayData } from './shared';

export const CleanNav: React.FC<{ data: NavbarDisplayData }> = ({ data }) => {
  const {
    showSearch, setShowSearch, localSearch, setLocalSearch,
    isAuthenticated, user, cartItemCount,
    handleLogout, handleSearchSubmit, handleSearchClear, navLinks, isActive,
  } = data;

  return (
    <header className="sticky top-0 z-50 w-full bg-background hidden md:block">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to={routes.home} className="text-sm font-semibold text-foreground tracking-tight shrink-0">
          {texts.app.name}
        </Link>

        <nav className="flex items-center gap-8">
          {navLinks.map(({ path, label }) => (
            <Link key={path} to={path} className={cn('text-sm transition-colors', isActive(path) ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground')}>
              {label}
            </Link>
          ))}
        </nav>

        <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative max-w-xs flex-1 mx-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input type="text" placeholder={texts.home.searchPlaceholder} value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} className="pl-9 pr-8 h-8 rounded-md text-sm border-border/30 bg-transparent" />
          {localSearch && (
            <button type="button" onClick={handleSearchClear} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </form>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setShowSearch(!showSearch)}>
            <Search className="h-4 w-4" />
          </Button>
          <Link to={routes.cart}>
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <ShoppingCart className="h-4 w-4" />
              {cartItemCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px]">{cartItemCount}</Badge>
              )}
            </Button>
          </Link>
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><User className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5"><p className="text-sm font-medium">{user?.name}</p><p className="text-xs text-muted-foreground">{user?.email}</p></div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to={routes.profile} className="cursor-pointer"><User className="mr-2 h-4 w-4" />{texts.nav.profile}</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />{texts.nav.logout}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" asChild><Link to={routes.login}>{texts.nav.login}</Link></Button>
              <Button size="sm" asChild><Link to={routes.signup}>{texts.nav.signup}</Link></Button>
            </div>
          )}
        </div>
      </div>

      {showSearch && (
        <div className="px-4 py-2 lg:hidden">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input type="text" placeholder={texts.home.searchPlaceholder} value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} className="pl-9 pr-8 h-9 rounded-md border-border/30" autoFocus />
            {localSearch && <button type="button" onClick={handleSearchClear} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-4 w-4 text-muted-foreground" /></button>}
          </form>
        </div>
      )}
    </header>
  );
};
