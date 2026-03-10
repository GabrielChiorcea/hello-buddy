/**
 * MobileBottomNav — Gamified
 * Iconițe cu fundal primary pentru active, bold și energic.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MobileNavDisplayData } from './shared';

export const GamifiedMobileNav: React.FC<{ data: MobileNavDisplayData }> = ({ data }) => {
  const { navItems, isActive } = data;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card shadow-[0_-4px_20px_rgba(0,0,0,0.1)] safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ path, label, icon: Icon, badge }) => (
          <Link
            key={path}
            to={path}
            className={cn(
              'flex flex-col items-center justify-center gap-1 flex-1 h-full py-2 transition-all',
              isActive(path) ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <div className="relative">
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-xl transition-all',
                  isActive(path) ? 'bg-primary text-primary-foreground shadow-[0_2px_8px_hsl(var(--primary)/0.3)] scale-110' : 'text-muted-foreground',
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              {badge !== undefined && badge > 0 && (
                <Badge className="absolute -right-1 -top-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px] bg-reward text-reward-foreground">
                  {badge > 9 ? '9+' : badge}
                </Badge>
              )}
            </div>
            <span className={cn('text-[10px] font-bold', isActive(path) ? 'text-primary' : 'text-muted-foreground')}>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};
