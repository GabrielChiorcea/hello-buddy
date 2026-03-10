/**
 * Footer — Clean
 * Minimal, o singură linie de linkuri, fără decorații.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { routes } from '@/config/routes';
import type { FooterDisplayData } from './shared';

export const CleanFooter: React.FC<{ data: FooterDisplayData }> = ({ data }) => (
  <footer className="border-t border-border/30">
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <Link to={routes.home} className="text-sm font-medium text-foreground">
          {data.appName}
        </Link>
        <nav className="flex items-center gap-6">
          {data.links.map((link) => (
            <Link key={link.path} to={link.path} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-muted-foreground/60">{data.copyright}</p>
      </div>
    </div>
  </footer>
);
