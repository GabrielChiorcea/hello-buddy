/**
 * =============================================================================
 * HEADER PENTRU PANOUL DE ADMINISTRARE
 * =============================================================================
 */

import { Link, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Bell, Sun, Moon } from 'lucide-react';
import { useAdminDarkModeCtx } from './AdminLayout';
import { texts } from '@/config/texts';

const routeTitles: Record<string, string> = {
  '/admin': texts.admin.navDashboard,
  '/admin/analytics': texts.admin.navAnalytics,
  '/admin/products': texts.admin.navProducts,
  '/admin/categories': texts.admin.navCategories,
  '/admin/orders': texts.admin.navOrders,
  '/admin/users': texts.admin.navUsers,
  '/admin/points': 'Points',
  '/admin/welcome-bonus': texts.admin.navWelcomeBonus,
  '/admin/streak': 'Streak',
  '/admin/tiers': 'Tiers',
  '/admin/free-products': texts.admin.navFreeProducts,
  '/admin/settings': texts.admin.navSettings,
  '/admin/addon-rules': texts.admin.navAddonRules,
};

export function AdminHeader() {
  const location = useLocation();
  const newOrdersCount = useAppSelector((state) => state.admin.newOrdersCount);
  const { isDark, toggle } = useAdminDarkModeCtx();
  const currentPath = location.pathname;

  const getPageTitle = () => {
    if (routeTitles[currentPath]) {
      return routeTitles[currentPath];
    }
    for (const [path, title] of Object.entries(routeTitles)) {
      if (currentPath.startsWith(path) && path !== '/admin') {
        return title;
      }
    }
    return texts.admin.navDashboard;
  };

  const pageTitle = getPageTitle();
  const isSubpage = currentPath !== '/admin' && currentPath.split('/').length > 3;

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-card px-4">
      <SidebarTrigger className="h-8 w-8" />
      
      <Separator orientation="vertical" className="h-6" />
      
      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          {pageTitle !== 'Dashboard' && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isSubpage ? (
                  <BreadcrumbLink href={`/admin/${currentPath.split('/')[2]}`}>
                    {pageTitle}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </>
          )}
          {isSubpage && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Details</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Dark mode toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        className="h-9 w-9 rounded-md text-muted-foreground hover:text-foreground"
        aria-label={isDark ? texts.admin.headerToggleLight : texts.admin.headerToggleDark}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <Button variant="ghost" size="sm" asChild>
        <Link
          to="/admin/orders"
          className={
            newOrdersCount > 0
              ? 'flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90'
              : 'relative px-3 py-2 bg-muted/50 hover:bg-muted rounded-md'
          }
        >
          {newOrdersCount > 0 ? (
            <>
              <Bell className="h-4 w-4" />
              <span className="font-medium">{newOrdersCount} {texts.admin.navOrders}</span>
            </>
          ) : (
            <span className="text-sm font-medium">{texts.admin.navOrders}</span>
          )}
        </Link>
      </Button>
    </header>
  );
}
