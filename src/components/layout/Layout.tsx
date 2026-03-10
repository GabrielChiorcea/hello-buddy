/**
 * Layout component that wraps pages with Navbar, Footer, and MobileBottomNav.
 */

import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { DarkModeToggle } from '@/components/DarkModeToggle';

interface LayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showFooter = true }) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      {showFooter && <Footer />}
      <MobileBottomNav />
      <DarkModeToggle />
    </div>
  );
};

export { Layout };
