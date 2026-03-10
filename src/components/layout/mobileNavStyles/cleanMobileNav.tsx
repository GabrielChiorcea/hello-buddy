/**
 * MobileBottomNav — Clean / Minimal
 * Ultra-minimal cu iconițe și etichete.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { MobileNavDisplayData } from './shared';

export const CleanMobileNav: React.FC<{ data: MobileNavDisplayData }> = ({ data }) => {
  const { navItems, isActive } = data;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border/30 safe-area-bottom">
      <div className="flex items-center justify-around h-14 px-4">
        {navItems.map(({ path, label, icon: Icon, badge }) => (
          <Link
            key={path}
            to={path}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors',
              isActive(path) ? 'text-foreground' : 'text-muted-foreground/50 hover:text-muted-foreground',
            )}
          >
            <div className="relative">
              <Icon className="h-5 w-5" />
              {badge !== undefined && badge > 0 && (
                <div className="absolute -right-1.5 -top-1.5 h-3.5 w-3.5 rounded-full bg-foreground flex items-center justify-center">
                  <span className="text-[8px] font-medium text-background">{badge > 9 ? '9+' : badge}</span>
                </div>
              )}
            </div>
            <span className={cn('text-[10px]', isActive(path) ? 'font-medium' : 'font-normal')}>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};
