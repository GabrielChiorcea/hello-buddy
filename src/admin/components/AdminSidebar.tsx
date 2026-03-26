/**
 * =============================================================================
 * SIDEBAR PENTRU PANOUL DE ADMINISTRARE
 * =============================================================================
 * Design minimal inspirat de Medusa.js / Stripe Dashboard
 */

import { useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import {
  LayoutDashboard,
  BarChart3,
  Package,
  FolderOpen,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  ChefHat,
  Puzzle,
  DollarSign,
  Settings2,
} from 'lucide-react';
import { ConfettiIcon } from '@/admin/components/ConfettiIcon';
import { pointsPlugin } from '@/plugins/points';
import { streakPlugin } from '@/plugins/streak';
import { tiersPlugin } from '@/plugins/tiers';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store';
import { adminLogout } from '@/store/slices/adminSlice';
import { Separator } from '@/components/ui/separator';

import { texts } from '@/config/texts';

const baseNavItems = [
  { title: texts.admin.navDashboard, url: '/admin', icon: LayoutDashboard },
  { title: texts.admin.navAnalytics, url: '/admin/analytics', icon: BarChart3 },
  { title: texts.admin.navProducts, url: '/admin/products', icon: Package },
  { title: texts.admin.navCategories, url: '/admin/categories', icon: FolderOpen },
  { title: texts.admin.navProductOptions, url: '/admin/product-options', icon: Settings2 },
  { title: texts.admin.navOrders, url: '/admin/orders', icon: ShoppingCart },
  { title: texts.admin.navUsers, url: '/admin/users', icon: Users },
];

const settingsNavItems = [
  { title: texts.admin.navSettings, url: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const dispatch = useAppDispatch();
  const admin = useAppSelector((state) => state.admin.admin);
  const { enabled: pointsEnabled } = usePluginEnabled('points');
  const { enabled: streakEnabled } = usePluginEnabled('streak');
  const { enabled: addonsEnabled } = usePluginEnabled('addons');
  const { enabled: tiersEnabled } = usePluginEnabled('tiers');
  const { enabled: freeProductsEnabled } = usePluginEnabled('free_products');

  const mainNavItems = [
    ...baseNavItems,
    ...(pointsEnabled ? pointsPlugin.navItems : []),
    { title: texts.admin.navWelcomeBonus, url: '/admin/welcome-bonus', icon: ConfettiIcon },
    ...(streakEnabled ? streakPlugin.navItems : []),
    ...(tiersEnabled ? tiersPlugin.navItems : []),
    ...(freeProductsEnabled
      ? [{ title: texts.admin.navFreeProducts, url: '/admin/free-products', icon: DollarSign }]
      : []),
    ...(addonsEnabled ? [{ title: texts.admin.navAddonRules, url: '/admin/addon-rules', icon: Puzzle }] : []),
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    dispatch(adminLogout());
  };

  return (
    <Sidebar className="border-r border-border bg-card">
      {/* Header cu logo */}
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <ChefHat className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                Food Admin
              </span>
              <span className="text-xs text-muted-foreground">
                {texts.admin.controlPanel}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <Separator />

      <SidebarContent className="px-2">
        {/* Navigare principală */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
            {texts.admin.sidebarMain}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="transition-colors"
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === '/admin'}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Setări */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
            {texts.admin.sidebarSystem}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="transition-colors"
                  >
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <Separator />

      {/* Footer cu info admin și logout */}
      <SidebarFooter className="p-4">
        {!collapsed && admin && (
          <div className="mb-3 flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {admin.name}
            </span>
            <span className="text-xs text-muted-foreground">{admin.email}</span>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'default'}
          onClick={handleLogout}
          className="w-full justify-start text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-3">{texts.admin.sidebarLogout}</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
