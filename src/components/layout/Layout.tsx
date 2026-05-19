/**
 * Layout component that wraps pages with Navbar, Footer, and MobileBottomNav.
 */

import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { NAV_BAR_HEIGHT, useNavbarStyle, type NavbarStyleName } from '@/config/themes';

interface LayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showFooter = true }) => {
  const navbarStyle = useNavbarStyle() as NavbarStyleName;
  const navHeights = NAV_BAR_HEIGHT[navbarStyle] ?? NAV_BAR_HEIGHT.clean;

  return (
    <div
      className="flex min-h-screen flex-col overflow-x-hidden"
      style={{
        ['--layout-nav-pad-desktop' as string]: navHeights.desktop,
        ['--mobile-bottom-nav-height' as string]: navHeights.mobile,
      }}
    >
      <Navbar />
      <main className="flex-1 w-full min-w-0 overflow-x-hidden pb-20 pt-0 md:pb-0 md:pt-[var(--layout-nav-pad-desktop)]">
        {children}
      </main>
      {showFooter && <Footer />}
      <MobileBottomNav />
    </div>
  );
};

export { Layout };
