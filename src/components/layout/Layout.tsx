/**
 * Layout component that wraps pages with Navbar, Footer, and MobileBottomNav.
 * Bara de progres nivel (tiers) este afișată sub Navbar pe toate paginile când e cazul.
 */

import React from 'react';
import { Navbar } from './Navbar';
import { TierProgressBar } from './TierProgressBar';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';

interface LayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showFooter = true }) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        {/* Bara de progres nivel – mereu primul element, înainte de Hero / Campanii / restul conținutului */}
        <TierProgressBar />
        {children}
      </main>
      {showFooter && <Footer />}
      <MobileBottomNav />
    </div>
  );
};

export { Layout };
