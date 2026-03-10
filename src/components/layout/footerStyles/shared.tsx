/**
 * Footer — shared data hook
 */

import { routes } from '@/config/routes';
import { texts } from '@/config/texts';

export interface FooterLink {
  path: string;
  label: string;
}

export interface FooterDisplayData {
  appName: string;
  tagline: string;
  copyright: string;
  links: FooterLink[];
  contact: { phone: string; email: string; location: string };
  hours: string[];
}

export function useFooterData(): FooterDisplayData {
  return {
    appName: texts.app.name,
    tagline: texts.app.tagline,
    copyright: texts.app.copyright,
    links: [
      { path: routes.catalog, label: texts.nav.catalog },
      { path: routes.cart, label: texts.nav.cart },
      { path: routes.profile, label: texts.nav.profile },
      { path: routes.terms, label: 'Termeni și Condiții' },
    ],
    contact: {
      phone: '0800 123 456',
      email: 'contact@foodorder.ro',
      location: 'București, România',
    },
    hours: [
      'Luni - Vineri: 10:00 - 23:00',
      'Sâmbătă: 11:00 - 24:00',
      'Duminică: 11:00 - 22:00',
    ],
  };
}
