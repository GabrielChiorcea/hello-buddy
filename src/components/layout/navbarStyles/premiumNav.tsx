/**
 * Navbar — Premium (Apple-like)
 * Clean, cu colțuri foarte rotunjite, fără bg-primary/15.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ShoppingCart, User, LogOut, Crown } from 'lucide-react';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { cn } from '@/lib/utils';
import type { NavbarDisplayData } from './shared';

export const PremiumNav: React.FC<{ data: NavbarDisplayData }> = ({ data }) => {
  const {
    isAuthenticated, user, cartItemCount,
    handleLogout, navLinks, isActive,
  } = data;

  return (
    <header className="sticky top-3 z-50 w-full hidden md:block px-6">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-primary/25 bg-background/40 backdrop-blur-3xl backdrop-saturate-[1.8] shadow-[0_4px_24px_hsl(var(--primary)/0.08),0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex h-14 items-center justify-between px-8">
          <Link to={routes.home} className="flex items-center gap-2.5 shrink-0">
            <Crown className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm tracking-wide text-foreground">{texts.app.name}</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navLinks.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  'text-[13px] font-medium transition-all duration-200 px-4 py-1.5 rounded-[2rem]',
                  isActive(path)
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <Link to={routes.cart}>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl hover:bg-accent/50">
                <ShoppingCart className="h-4 w-4" />
                {cartItemCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full text-[10px] font-bold flex items-center justify-center bg-primary text-primary-foreground shadow-sm">
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </Button>
            </Link>
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-accent/50">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl border-border/30 bg-background/80 backdrop-blur-2xl shadow-lg">
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-semibold">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={routes.profile} className="cursor-pointer rounded-lg">
                      <User className="mr-2 h-4 w-4" />{texts.nav.profile}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive rounded-lg">
                    <LogOut className="mr-2 h-4 w-4" />{texts.nav.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Button variant="ghost" asChild className="h-8 px-4 rounded-xl text-xs font-medium hover:bg-accent/50">
                  <Link to={routes.login}>{texts.nav.login}</Link>
                </Button>
                <Button asChild className="h-8 px-4 rounded-xl text-xs font-semibold">
                  <Link to={routes.signup}>{texts.nav.signup}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
