/**
 * =============================================================================
 * LAYOUT PRINCIPAL PENTRU PANOUL DE ADMINISTRARE
 * =============================================================================
 */

import { createContext, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { useAdminOrdersPolling } from '../hooks/useAdminOrdersPolling';
import { useAdminDarkMode } from '../hooks/useAdminDarkMode';

interface DarkModeCtx {
  isDark: boolean;
  toggle: () => void;
}

const DarkModeContext = createContext<DarkModeCtx>({ isDark: false, toggle: () => {} });

export const useAdminDarkModeCtx = () => useContext(DarkModeContext);

export function AdminLayout() {
  useAdminOrdersPolling();
  const darkMode = useAdminDarkMode();

  return (
    <DarkModeContext.Provider value={darkMode}>
      <div className={darkMode.isDark ? 'dark' : ''}>
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
      </div>
    </DarkModeContext.Provider>
  );
}
