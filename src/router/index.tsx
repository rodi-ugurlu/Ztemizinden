/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './ProtectedRoute';

// Layouts
const CustomerLayout = lazy(() => import('@/layouts/CustomerLayout'));
const ServiceLayout = lazy(() => import('@/layouts/ServiceLayout'));
const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));

// Auth Pages
const CustomerLogin = lazy(() => import('@/features/auth/CustomerLogin'));
const CustomerRegister = lazy(() => import('@/features/auth/CustomerRegister'));
const ServiceLogin = lazy(() => import('@/features/auth/ServiceLogin'));
const ServiceRegister = lazy(() => import('@/features/auth/ServiceRegister'));
const AdminLogin = lazy(() => import('@/features/auth/AdminLogin'));

// Customer Portal Pages
const CustomerDashboard = lazy(() => import('@/features/customer/CustomerDashboard'));
const AssetsPage = lazy(() => import('@/features/customer/AssetsPage'));
const AssetTreePage = lazy(() => import('@/features/customer/AssetTreePage'));
const CreateTicketPage = lazy(() => import('@/features/customer/CreateTicketPage'));
const RequestsPage = lazy(() => import('@/features/customer/RequestsPage'));

// Service Portal Pages
const ServiceDashboard = lazy(() => import('@/features/service/ServiceDashboard'));
const ServiceTicketsPage = lazy(() => import('@/features/service/ServiceTicketsPage'));
const ServiceTeamPage = lazy(() => import('@/features/service/ServiceTeamPage'));

// Admin Portal Pages
const AdminDashboard = lazy(() => import('@/features/admin/AdminDashboard'));
const ProviderManagement = lazy(() => import('@/features/admin/ProviderManagement'));
const DispatchPage = lazy(() => import('@/features/admin/DispatchPage'));

function withPageLoader(element: ReactNode) {
  return <Suspense fallback={<RouteLoading />}>{element}</Suspense>;
}

function RouteLoading() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-slate-700 border-t-indigo-400 animate-spin" />
        <p className="text-sm text-slate-400">Ekran hazırlanıyor...</p>
      </div>
    </div>
  );
}

/**
 * Temizinden Router Configuration
 *
 * Three distinct portals with isolated routing:
 * - Customer Portal: /customer/*
 * - Service Provider Portal: /service/*
 * - Admin/Operations Portal: /admin/*
 *
 * Protected routes redirect unauthenticated users to their respective login pages.
 */
export const router = createBrowserRouter([
  // Root redirect to customer login
  {
    path: '/',
    element: <Navigate to="/customer/login" replace />,
  },

  // ==========================================
  // CUSTOMER PORTAL (Mod A - Fabrika/KOBİ/Ev)
  // ==========================================
  {
    path: '/customer',
    element: withPageLoader(<CustomerLayout />),
    children: [
      {
        path: 'login',
        element: withPageLoader(
          <PublicRoute role="customer">
            <CustomerLogin />
          </PublicRoute>
        ),
      },
      {
        path: 'register',
        element: withPageLoader(
          <PublicRoute role="customer">
            <CustomerRegister />
          </PublicRoute>
        ),
      },
      {
        path: 'dashboard',
        element: withPageLoader(
          <ProtectedRoute requiredRole="customer">
            <CustomerDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'assets',
        element: withPageLoader(
          <ProtectedRoute requiredRole="customer">
            <AssetsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'tickets/create',
        element: withPageLoader(
          <ProtectedRoute requiredRole="customer">
            <CreateTicketPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'requests',
        element: withPageLoader(
          <ProtectedRoute requiredRole="customer">
            <RequestsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'asset-tree',
        element: withPageLoader(
          <ProtectedRoute requiredRole="customer">
            <AssetTreePage />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // ==========================================
  // SERVICE PROVIDER PORTAL (Mod X - Servis)
  // ==========================================
  {
    path: '/service',
    element: withPageLoader(<ServiceLayout />),
    children: [
      {
        path: 'login',
        element: withPageLoader(
          <PublicRoute role="service">
            <ServiceLogin />
          </PublicRoute>
        ),
      },
      {
        path: 'register',
        element: withPageLoader(
          <PublicRoute role="service">
            <ServiceRegister />
          </PublicRoute>
        ),
      },
      {
        path: 'dashboard',
        element: withPageLoader(
          <ProtectedRoute requiredRole="service">
            <ServiceDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'tickets',
        element: withPageLoader(
          <ProtectedRoute requiredRole="service">
            <ServiceTicketsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'team',
        element: withPageLoader(
          <ProtectedRoute requiredRole="service">
            <ServiceTeamPage />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // ==========================================
  // ADMIN/OPERATIONS PORTAL (Ops Center)
  // ==========================================
  {
    path: '/admin',
    element: withPageLoader(<AdminLayout />),
    children: [
      {
        path: 'login',
        element: withPageLoader(
          <PublicRoute role="admin">
            <AdminLogin />
          </PublicRoute>
        ),
      },
      {
        path: 'dashboard',
        element: withPageLoader(
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'providers',
        element: withPageLoader(
          <ProtectedRoute requiredRole="admin">
            <ProviderManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dispatch',
        element: withPageLoader(
          <ProtectedRoute requiredRole="admin">
            <DispatchPage />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // 404 Catch-all
  {
    path: '*',
    element: (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-200 mb-4">404</h1>
          <p className="text-slate-400">Page not found. Return to your portal.</p>
        </div>
      </div>
    ),
  },
]);
