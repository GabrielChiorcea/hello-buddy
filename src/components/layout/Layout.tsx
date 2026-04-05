/**
 * Layout component that wraps pages with Navbar, Footer, and MobileBottomNav.
 */

import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';

interface LayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showFooter = true }) => {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden [--layout-nav-pad:0px] md:[--layout-nav-pad:6rem]">
      <Navbar />
      <main className="flex-1 w-full min-w-0 overflow-x-hidden pb-20 pt-[var(--layout-nav-pad)] md:pb-0">
        {children}
      </main>
      {showFooter && <Footer />}
      <MobileBottomNav />
    </div>
  );
};

export { Layout };
