import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import Layout from '../components/layout/Layout';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Layout /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;


