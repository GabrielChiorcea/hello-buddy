/**
 * MobileBottomNav — Friendly / Casual
 * Stil cald, standard, cu etichete text.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MobileNavDisplayData } from './shared';

export const FriendlyMobileNav: React.FC<{ data: MobileNavDisplayData }> = ({ data }) => {
  const { navItems, isActive } = data;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ path, label, icon: Icon, badge }) => (
          <Link
            key={path}
            to={path}
            className={cn(
              'flex flex-col items-center justify-center gap-1 flex-1 h-full py-2 transition-colors',
              isActive(path) ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <div className="relative">
              <Icon className={cn('h-5 w-5 transition-transform', isActive(path) && 'scale-110')} />
              {badge !== undefined && badge > 0 && (
                <Badge className="absolute -right-2.5 -top-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px]">
                  {badge > 9 ? '9+' : badge}
                </Badge>
              )}
            </div>
            <span className={cn('text-[10px] font-medium', isActive(path) && 'font-semibold')}>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};
