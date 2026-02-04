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
import { Bell } from 'lucide-react';

const routeTitles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/products': 'Produse',
  '/admin/categories': 'Categorii',
  '/admin/orders': 'Comenzi',
  '/admin/users': 'Utilizatori',
  '/admin/settings': 'Setări',
};

export function AdminHeader() {
  const location = useLocation();
  const newOrdersCount = useAppSelector((state) => state.admin.newOrdersCount);
  const currentPath = location.pathname;
  
  // Determină titlul paginii curente
  const getPageTitle = () => {
    // Verificăm mai întâi căile exacte
    if (routeTitles[currentPath]) {
      return routeTitles[currentPath];
    }
    // Verificăm căile cu parametri (ex: /admin/products/123)
    for (const [path, title] of Object.entries(routeTitles)) {
      if (currentPath.startsWith(path) && path !== '/admin') {
        return title;
      }
    }
    return 'Dashboard';
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
                <BreadcrumbPage>Detalii</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

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
              <span className="font-medium">{newOrdersCount} Comenzi</span>
            </>
          ) : (
            <>
              <span className="text-sm font-medium">Comenzi</span>
            </>
          )}
        </Link>
      </Button>
    </header>
  );
}
