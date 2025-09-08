import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'tutor';
}

export function RouteGuard({ children, requiredRole }: RouteGuardProps) {
  const { session } = useAuth();

  if (!session.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && session.user?.role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}