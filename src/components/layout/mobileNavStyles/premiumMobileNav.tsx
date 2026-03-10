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
    <div className="fixed bottom-5 left-4 right-4 z-50 md:hidden safe-area-bottom">
      <nav className="mx-auto max-w-md flex items-center justify-around px-3 py-2 rounded-2xl border border-white/30 bg-white/15 backdrop-blur-3xl backdrop-saturate-[1.8] shadow-[0_4px_24px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.5)]">
        {navItems.map(({ path, label, icon: Icon, badge }) => (
          <Link
            key={path}
            to={path}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-xl transition-all duration-200',
              isActive(path) 
                ? 'bg-white/40 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]' 
                : 'text-foreground/50 hover:text-foreground hover:bg-white/20'
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
