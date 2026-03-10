/**
 * Footer — Friendly
 * Cald, accesibil, relaxat.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Phone, Mail, MapPin } from 'lucide-react';
import { routes } from '@/config/routes';
import type { FooterDisplayData } from './shared';

export const FriendlyFooter: React.FC<{ data: FooterDisplayData }> = ({ data }) => (
  <footer className="border-t bg-muted/30">
    <div className="container mx-auto px-4 py-12">
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to={routes.home} className="flex items-center gap-2 font-bold text-xl text-primary mb-4">
            <UtensilsCrossed className="h-6 w-6" />
            {data.appName}
          </Link>
          <p className="text-sm text-muted-foreground">{data.tagline}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Linkuri utile</h3>
          <ul className="space-y-2">
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
          <h3 className="font-semibold mb-4">Contact</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4" />{data.contact.phone}</li>
            <li className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-4 w-4" />{data.contact.email}</li>
            <li className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{data.contact.location}</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Program</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {data.hours.map((h, i) => <li key={i}>{h}</li>)}
          </ul>
        </div>
      </div>
      <div className="mt-12 pt-8 border-t text-center">
        <p className="text-sm text-muted-foreground">{data.copyright}</p>
      </div>
    </div>
  </footer>
);
