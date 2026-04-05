/**
 * Logo brand în navbar (desktop: `hidden md:block` pe header) — sursa principală pentru logo
 * când hero-ul ascunde duplicatul pe `md+`. Vezi `VITE_APP_LOGO_URL` în `src/config/branding.ts`.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { BRANDING_LOGO_URL } from '@/config/branding';

export function NavbarBrand({
  fallbackIcon,
  linkClassName,
  imgClassName = 'h-12 w-12 object-contain shrink-0 md:h-14 md:w-14 lg:h-16 lg:w-16',
}: {
  fallbackIcon: React.ReactNode;
  linkClassName: string;
  imgClassName?: string;
}) {
  const name = texts.app.name;

  return (
    <Link to={routes.home} className={linkClassName}>
      {BRANDING_LOGO_URL ? (
        <img src={BRANDING_LOGO_URL} alt={name} className={imgClassName} draggable={false} />
      ) : (
        fallbackIcon
      )}
    </Link>
  );
}
