/**
 * MobileBottomNav — Premium
 * Floating pill cu glassmorphism, tokens semantici — se adaptează la temă.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { MobileNavDisplayData } from './shared';

export const PremiumMobileNav: React.FC<{ data: MobileNavDisplayData }> = ({ data }) => {
  const { navItems, isActive } = data;

  return (
    <div className="fixed bottom-5 left-4 right-4 z-50 md:hidden safe-area-bottom">
      <nav className="mx-auto max-w-md flex items-center justify-around px-3 py-2 rounded-[2rem] border border-border/30 backdrop-blur-3xl backdrop-saturate-[1.8] shadow-[0_4px_24px_hsl(var(--primary)/0.08)]">
        {navItems.map(({ path, label, icon: Icon, badge }) => (
          <Link
            key={path}
            to={path}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-[2rem] transition-all duration-200',
              isActive(path)
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            )}
          >
            <div className="relative">
              <Icon className={cn('h-[18px] w-[18px]', isActive(path) && 'stroke-[2.5]')} />
              {badge !== undefined && badge > 0 && (
                <span className="absolute -right-2 -top-1.5 h-4 w-4 rounded-full text-[9px] font-bold flex items-center justify-center bg-primary text-primary-foreground shadow-sm">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
            <span className={cn('text-[10px] tracking-wide', isActive(path) ? 'font-semibold' : 'font-medium')}>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};
