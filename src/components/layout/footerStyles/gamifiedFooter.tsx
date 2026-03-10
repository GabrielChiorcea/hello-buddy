/**
 * Footer — Gamified
 * Fundal primary, bold, energic.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Phone, Mail, MapPin } from 'lucide-react';
import { routes } from '@/config/routes';
import type { FooterDisplayData } from './shared';

export const GamifiedFooter: React.FC<{ data: FooterDisplayData }> = ({ data }) => (
  <footer className="bg-primary text-primary-foreground">
    <div className="container mx-auto px-4 py-12">
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to={routes.home} className="flex items-center gap-2 font-extrabold text-xl text-primary-foreground mb-4">
            <Zap className="h-6 w-6" />
            {data.appName}
          </Link>
          <p className="text-sm text-primary-foreground/70">{data.tagline}</p>
        </div>
        <div>
          <h3 className="font-bold mb-4 uppercase tracking-wide text-sm">Linkuri utile</h3>
          <ul className="space-y-2">
            {data.links.map((link) => (
              <li key={link.path}>
                <Link to={link.path} className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-bold mb-4 uppercase tracking-wide text-sm">Contact</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-2 text-sm text-primary-foreground/70"><Phone className="h-4 w-4" />{data.contact.phone}</li>
            <li className="flex items-center gap-2 text-sm text-primary-foreground/70"><Mail className="h-4 w-4" />{data.contact.email}</li>
            <li className="flex items-center gap-2 text-sm text-primary-foreground/70"><MapPin className="h-4 w-4" />{data.contact.location}</li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold mb-4 uppercase tracking-wide text-sm">Program</h3>
          <ul className="space-y-2 text-sm text-primary-foreground/70">
            {data.hours.map((h, i) => <li key={i}>{h}</li>)}
          </ul>
        </div>
      </div>
      <div className="mt-12 pt-8 border-t border-primary-foreground/20 text-center">
        <p className="text-sm text-primary-foreground/60">{data.copyright}</p>
      </div>
    </div>
  </footer>
);
