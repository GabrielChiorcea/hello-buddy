/**
 * Navbar — Gamified
 * Fundal solid primary, text alb, bold — ideal pentru fast-food, pizza.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ShoppingCart, User, LogOut, UtensilsCrossed, Zap } from 'lucide-react';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { cn } from '@/lib/utils';
import type { NavbarDisplayData } from './shared';

export const GamifiedNav: React.FC<{ data: NavbarDisplayData }> = ({ data }) => {
  const {
    isAuthenticated, user, cartItemCount,
    handleLogout, navLinks, isActive,
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

        <div className="flex items-center gap-3">
          <Link to={routes.cart}>
            <Button variant="ghost" size="icon" className="relative text-primary-foreground hover:bg-primary-foreground/10">
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-reward text-reward-foreground animate-bounce">{cartItemCount}</Badge>
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
    </header>
  );
};
