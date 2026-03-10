/**
 * MobileBottomNav — Premium
 * Floating pill cu glassmorphism, elegant și rafinat.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MobileNavDisplayData } from './shared';

export const PremiumMobileNav: React.FC<{ data: MobileNavDisplayData }> = ({ data }) => {
  const { navItems, isActive } = data;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden safe-area-bottom">
      <nav className="mx-auto max-w-sm rounded-2xl bg-card/80 backdrop-blur-xl backdrop-saturate-150 border border-border/30 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-around h-14 px-4">
          {navItems.map(({ path, label, icon: Icon, badge }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors',
                isActive(path) ? 'text-primary' : 'text-muted-foreground/60 hover:text-muted-foreground',
              )}
            >
              <div className="relative">
                <Icon className={cn('h-5 w-5', isActive(path) && 'stroke-[2.5]')} />
                {badge !== undefined && badge > 0 && (
                  <Badge className="absolute -right-2 -top-1.5 h-3.5 w-3.5 rounded-full p-0 flex items-center justify-center text-[8px] border border-primary/30 bg-primary/10 text-primary">
                    {badge > 9 ? '9+' : badge}
                  </Badge>
                )}
              </div>
              <span className={cn('text-[9px] font-light tracking-wide', isActive(path) && 'font-medium')}>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};
