/**
 * =============================================================================
 * LAYOUT PRINCIPAL PENTRU PANOUL DE ADMINISTRARE
 * =============================================================================
 */

import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { useAdminOrdersPolling } from '../hooks/useAdminOrdersPolling';

export function AdminLayout() {
  // Polling global pentru comenzi noi (rulează pe toate paginile admin)
  useAdminOrdersPolling();

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <AdminHeader />
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
