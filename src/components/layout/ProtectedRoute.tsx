/**
 * ProtectedRoute component for auth-required pages
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store';
import { routes } from '@/config/routes';
import { PageLoader } from '@/components/common/Loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.user);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    // Redirect to login, preserving the intended destination
    return <Navigate to={routes.login} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

/**
 * GuestRoute component for pages that should only be accessible when NOT logged in
 */
interface GuestRouteProps {
  children: React.ReactNode;
}

const GuestRoute: React.FC<GuestRouteProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated } = useAppSelector((state) => state.user);

  if (isAuthenticated) {
    // Redirect to home or the page they came from
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || routes.home;
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

export { ProtectedRoute, GuestRoute };
