/**
 * Footer component with Terms link
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Phone, Mail, MapPin } from 'lucide-react';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';

const Footer: React.FC = () => {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link 
              to={routes.home} 
              className="flex items-center gap-2 font-bold text-xl text-primary mb-4"
            >
              <UtensilsCrossed className="h-6 w-6" />
              {texts.app.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {texts.app.tagline}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4">Linkuri utile</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to={routes.catalog} 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {texts.nav.catalog}
                </Link>
              </li>
              <li>
                <Link 
                  to={routes.cart} 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {texts.nav.cart}
                </Link>
              </li>
              <li>
                <Link 
                  to={routes.profile} 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {texts.nav.profile}
                </Link>
              </li>
              <li>
                <Link 
                  to={routes.terms} 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Termeni și Condiții
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>0800 123 456</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>contact@foodorder.ro</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>București, România</span>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="font-semibold mb-4">Program</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Luni - Vineri: 10:00 - 23:00</li>
              <li>Sâmbătă: 11:00 - 24:00</li>
              <li>Duminică: 11:00 - 22:00</li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground">
            {texts.app.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
};

export { Footer };
