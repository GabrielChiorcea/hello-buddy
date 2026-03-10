/**
 * Footer — Premium
 * Glassmorphism, elegant, raffinat.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Phone, Mail, MapPin } from 'lucide-react';
import { routes } from '@/config/routes';
import type { FooterDisplayData } from './shared';

export const PremiumFooter: React.FC<{ data: FooterDisplayData }> = ({ data }) => (
  <footer className="border-t border-border/20 bg-background/60 backdrop-blur-xl">
    <div className="container mx-auto px-4 py-14">
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to={routes.home} className="flex items-center gap-2 text-lg font-semibold text-foreground tracking-tight mb-4">
            <Crown className="h-5 w-5 text-primary" />
            {data.appName}
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed">{data.tagline}</p>
        </div>
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-5">Navigație</h3>
          <ul className="space-y-3">
            {data.links.map((link) => (
              <li key={link.path}>
                <Link to={link.path} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-5">Contact</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm text-muted-foreground"><Phone className="h-4 w-4 text-primary/60" />{data.contact.phone}</li>
            <li className="flex items-center gap-3 text-sm text-muted-foreground"><Mail className="h-4 w-4 text-primary/60" />{data.contact.email}</li>
            <li className="flex items-center gap-3 text-sm text-muted-foreground"><MapPin className="h-4 w-4 text-primary/60" />{data.contact.location}</li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-5">Program</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {data.hours.map((h, i) => <li key={i}>{h}</li>)}
          </ul>
        </div>
      </div>
      <div className="mt-14 pt-8 border-t border-border/20 text-center">
        <p className="text-xs text-muted-foreground/50">{data.copyright}</p>
      </div>
    </div>
  </footer>
);
