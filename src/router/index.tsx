import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './ProtectedRoute';

// Layouts
import CustomerLayout from '@/layouts/CustomerLayout';
import ServiceLayout from '@/layouts/ServiceLayout';
import AdminLayout from '@/layouts/AdminLayout';

// Auth Pages
import CustomerLogin from '@/features/auth/CustomerLogin';
import CustomerRegister from '@/features/auth/CustomerRegister';
import ServiceLogin from '@/features/auth/ServiceLogin';
import ServiceRegister from '@/features/auth/ServiceRegister';
import AdminLogin from '@/features/auth/AdminLogin';

// Customer Portal Pages (Phase 2)
import CustomerDashboard from '@/features/customer/CustomerDashboard';
import AssetsPage from '@/features/customer/AssetsPage';
import CreateTicketPage from '@/features/customer/CreateTicketPage';

// Other Portal Dashboards
import ServiceDashboard from '@/features/service/ServiceDashboard';

// Admin Portal Pages (Phase 4)
import AdminDashboard from '@/features/admin/AdminDashboard';
import ProviderManagement from '@/features/admin/ProviderManagement';
import DispatchPage from '@/features/admin/DispatchPage';

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
    element: <CustomerLayout />,
    children: [
      {
        path: 'login',
        element: (
          <PublicRoute role="customer">
            <CustomerLogin />
          </PublicRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <PublicRoute role="customer">
            <CustomerRegister />
          </PublicRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute requiredRole="customer">
            <CustomerDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'assets',
        element: (
          <ProtectedRoute requiredRole="customer">
            <AssetsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'tickets/create',
        element: (
          <ProtectedRoute requiredRole="customer">
            <CreateTicketPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'requests',
        element: (
          <ProtectedRoute requiredRole="customer">
            <div className="p-8">Service History (Phase 3)</div>
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
    element: <ServiceLayout />,
    children: [
      {
        path: 'login',
        element: (
          <PublicRoute role="service">
            <ServiceLogin />
          </PublicRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <PublicRoute role="service">
            <ServiceRegister />
          </PublicRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute requiredRole="service">
            <ServiceDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'tickets',
        element: (
          <ProtectedRoute requiredRole="service">
            <div className="p-8">Service Tickets (Phase 2)</div>
          </ProtectedRoute>
        ),
      },
      {
        path: 'team',
        element: (
          <ProtectedRoute requiredRole="service">
            <div className="p-8">Team Management (Phase 2)</div>
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
    element: <AdminLayout />,
    children: [
      {
        path: 'login',
        element: (
          <PublicRoute role="admin">
            <AdminLogin />
          </PublicRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'providers',
        element: (
          <ProtectedRoute requiredRole="admin">
            <ProviderManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dispatch',
        element: (
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
