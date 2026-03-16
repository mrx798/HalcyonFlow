import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProtectedRoute from './ProtectedRoute';

// Lazy load pages
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const WorkflowListPage = lazy(() => import('../pages/WorkflowListPage'));
const WorkflowEditorPage = lazy(() => import('../pages/WorkflowEditorPage'));
const ExecutionViewPage = lazy(() => import('../pages/ExecutionViewPage'));
const AuditLogPage = lazy(() => import('../pages/AuditLogPage'));
const NotificationsPage = lazy(() => import('../pages/NotificationsPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const RuleEditorPage = lazy(() => import('../pages/RuleEditorPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-slate-400">Loading...</div>}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/workflows" element={<WorkflowListPage />} />
          <Route path="/workflows/:id" element={<WorkflowEditorPage />} />
          <Route path="/executions" element={<AuditLogPage />} />
          <Route path="/executions/:id" element={<ExecutionViewPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/rules/:id" element={<RuleEditorPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};


export default AppRoutes;
