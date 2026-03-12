import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessRoute, getDefaultRouteForRole } from '@/lib/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: string | string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireRole }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireRole) {
    const allowed = Array.isArray(requireRole) ? requireRole : [requireRole];
    const role = (user.role || '').toLowerCase();
    if (!allowed.map((r) => r.toLowerCase()).includes(role)) {
      return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
    }
  }

  if (user.role && path !== '/' && !canAccessRoute(user.role, path)) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  }

  return <>{children}</>;
};
