/**
 * =============================================================================
 * RUTĂ PROTEJATĂ PENTRU ADMIN
 * =============================================================================
 * Verifică dacă utilizatorul este autentificat ca admin cu persistență
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store';
import { PageLoader } from '@/components/common/Loader';
import { useAdminSessionRestore } from '@/hooks/useSessionRestore';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({
  children,
}) => {
  const location = useLocation();
  const { isAuthenticated } = useAppSelector((state) => state.admin);
  const { isLoading } = useAdminSessionRestore();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    // Redirect către login admin, păstrând destinația
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
