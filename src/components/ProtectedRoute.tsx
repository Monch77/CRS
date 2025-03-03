import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'courier';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, isAdmin, isCourier } = useAuth();
  const location = useLocation();
  
  // Check if user is authenticated
  if (!user) {
    // Use replace and state to avoid infinite redirects
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  // Check if a specific role is required
  if (requiredRole === 'admin' && !isAdmin()) {
    // Use replace to avoid infinite redirects
    return <Navigate to="/dashboard" replace />;
  }
  
  if (requiredRole === 'courier' && !isCourier()) {
    // Use replace to avoid infinite redirects
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;