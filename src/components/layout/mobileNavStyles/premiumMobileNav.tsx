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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden safe-area-bottom">
      <nav className="flex items-center gap-1 px-2 py-2 rounded-full border border-white/25 bg-background/50 backdrop-blur-2xl backdrop-saturate-200 shadow-[0_12px_40px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.35)]">
        {navItems.map(({ path, label, icon: Icon, badge }) => (
          <Link
            key={path}
            to={path}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 h-12 w-12 rounded-full transition-all duration-200',
              isActive(path) 
                ? 'bg-primary/15 text-primary scale-105' 
                : 'text-muted-foreground/70 hover:text-foreground hover:bg-white/40'
            )}
          >
            <div className="relative">
              <Icon className={cn('h-[18px] w-[18px]', isActive(path) && 'stroke-[2.5]')} />
              {badge !== undefined && badge > 0 && (
                <span className="absolute -right-1.5 -top-1 h-4 w-4 rounded-full text-[9px] font-bold flex items-center justify-center bg-primary text-primary-foreground">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
          </Link>
        ))}
      </nav>
    </div>
  );
};
