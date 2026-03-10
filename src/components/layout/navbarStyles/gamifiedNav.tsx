/**
 * Navbar — Gamified
 * Fundal solid primary, text alb, bold — ideal pentru fast-food, pizza.
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
import { ShoppingCart, User, LogOut, UtensilsCrossed, Search, X, Zap } from 'lucide-react';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { cn } from '@/lib/utils';
import type { NavbarDisplayData } from './shared';

export const GamifiedNav: React.FC<{ data: NavbarDisplayData }> = ({ data }) => {
  const {
    showSearch, setShowSearch, localSearch, setLocalSearch,
    isAuthenticated, user, cartItemCount,
    handleLogout, handleSearchSubmit, handleSearchClear, navLinks, isActive,
  } = data;

  return (
    <header className="sticky top-0 z-50 w-full bg-primary text-primary-foreground shadow-[0_2px_16px_hsl(var(--primary)/0.3)] hidden md:block">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to={routes.home} className="flex items-center gap-2 font-extrabold text-xl text-primary-foreground shrink-0">
          <Zap className="h-6 w-6" />
          <span className="hidden sm:inline">{texts.app.name}</span>
        </Link>

        <nav className="flex items-center gap-6">
          {navLinks.map(({ path, label }) => (
            <Link key={path} to={path} className={cn('text-sm font-bold transition-colors uppercase tracking-wide', isActive(path) ? 'text-primary-foreground' : 'text-primary-foreground/70 hover:text-primary-foreground')}>
              {label}
            </Link>
          ))}
        </nav>

        <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative max-w-xs flex-1 mx-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-foreground/60" />
          <Input type="text" placeholder={texts.home.searchPlaceholder} value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} className="pl-9 pr-8 h-9 rounded-full text-sm bg-primary-foreground/15 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:ring-primary-foreground/30" />
          {localSearch && (
            <button type="button" onClick={handleSearchClear} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5 text-primary-foreground/60 hover:text-primary-foreground" />
            </button>
          )}
        </form>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setShowSearch(!showSearch)}>
            <Search className="h-5 w-5" />
          </Button>
          <Link to={routes.cart}>
            <Button variant="ghost" size="icon" className="relative text-primary-foreground hover:bg-primary-foreground/10">
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-reward text-reward-foreground">{cartItemCount}</Badge>
              )}
            </Button>
          </Link>
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10"><User className="h-5 w-5" /></Button></DropdownMenuTrigger>
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
              <Button variant="ghost" asChild className="text-primary-foreground hover:bg-primary-foreground/10"><Link to={routes.login}>{texts.nav.login}</Link></Button>
              <Button asChild className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"><Link to={routes.signup}>{texts.nav.signup}</Link></Button>
            </div>
          )}
        </div>
      </div>

      {showSearch && (
        <div className="border-t border-primary-foreground/20 px-4 py-3 lg:hidden">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-foreground/60" />
            <Input type="text" placeholder={texts.home.searchPlaceholder} value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} className="pl-9 pr-8 h-10 rounded-full bg-primary-foreground/15 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50" autoFocus />
            {localSearch && <button type="button" onClick={handleSearchClear} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-4 w-4 text-primary-foreground/60" /></button>}
          </form>
        </div>
      )}
    </header>
  );
};
