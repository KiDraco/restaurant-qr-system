import React from 'react';
import { Navigate } from 'react-router-dom';
import api from '../../services/api';

export default function AuthGuard({ children }) {
  if (!api.isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
