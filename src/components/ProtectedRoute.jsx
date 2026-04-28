import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import LoadingSkeleton from './LoadingSkeleton';
import { useAuth } from '../contexts/AuthContext';
import { normalizeRole } from '../constants/roles';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 container">
        <LoadingSkeleton count={4} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const currentRole = normalizeRole(user?.role || user?.accountType || user?.roleLabel);
  const allowedRoles = (roles || []).map(normalizeRole);

  if (allowedRoles.length && !allowedRoles.includes(currentRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
