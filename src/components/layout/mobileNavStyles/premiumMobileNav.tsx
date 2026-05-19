/**
 * MobileBottomNav — Premium (Apple-like)
 * Docked la baza ecranului (ca celelalte stiluri), cu efect de sticlă/blur premium.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { MobileNavDisplayData } from './shared';

export const PremiumMobileNav: React.FC<{ data: MobileNavDisplayData }> = ({ data }) => {
  const { navItems, isActive } = data;

  return (
    <nav
      className={cn(
        'fixed fixed-mobile-vv-bottom left-0 right-0 z-50 md:hidden safe-area-bottom',
        'border-t border-primary/20',
        'bg-background/80 supports-[backdrop-filter]:bg-background/50',
        'supports-[backdrop-filter]:backdrop-blur-2xl supports-[backdrop-filter]:backdrop-saturate-150',
        'shadow-[0_-4px_24px_hsl(var(--primary)/0.08)]'
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ path, label, icon: Icon, badge }) => (
          <Link
            key={path}
            to={path}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-2 transition-all duration-200',
              isActive(path)
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
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
            <span className={cn('text-[10px] tracking-wide', isActive(path) ? 'font-semibold' : 'font-medium')}>
              {label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
};
