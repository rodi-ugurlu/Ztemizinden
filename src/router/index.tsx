/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, isRouteErrorResponse, Navigate, useRouteError } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './ProtectedRoute';

// Layouts
const CustomerLayout = lazy(() => import('@/layouts/CustomerLayout'));
const ServiceLayout = lazy(() => import('@/layouts/ServiceLayout'));
const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));
const MaintlyLandingPage = lazy(() => import('@/features/landing/MaintlyLandingPage'));

// Auth Pages
const CustomerLogin = lazy(() => import('@/features/auth/CustomerLogin'));
const CustomerRegister = lazy(() => import('@/features/auth/CustomerRegister'));
const ServiceLogin = lazy(() => import('@/features/auth/ServiceLogin'));
const ServiceRegister = lazy(() => import('@/features/auth/ServiceRegister'));
const AdminLogin = lazy(() => import('@/features/auth/AdminLogin'));

// Customer Portal Pages
const CustomerDashboard = lazy(() => import('@/features/customer/CustomerDashboard'));
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

function RouteErrorBoundary() {
  const error = useRouteError();
  const message = routeErrorMessage(error);
  const isChunkError = isDynamicImportError(error);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 flex items-center justify-center">
      <div className="w-full max-w-lg rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-red-600 text-lg font-black text-white">
          !
        </div>
        <h1 className="text-2xl font-black tracking-normal">
          {isChunkError ? 'Yeni sürüm hazır' : 'Ekran yüklenemedi'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          {isChunkError
            ? 'Uygulama güncellendiği için tarayıcı eski bir ekran dosyasını çağırıyor. Sayfayı yenileyince yeni sürüm açılacak.'
            : message}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
          >
            Sayfayı Yenile
          </button>
          <button
            type="button"
            onClick={() => window.location.assign('/customer/login')}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-slate-800"
          >
            Girişe Dön
          </button>
        </div>
      </div>
    </div>
  );
}

function routeErrorMessage(error: unknown) {
  if (isRouteErrorResponse(error)) {
    return error.statusText || `${error.status} hatası`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Beklenmeyen bir hata oluştu.';
}

function isDynamicImportError(error: unknown) {
  const message = routeErrorMessage(error).toLowerCase();
  return (
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('importing a module script failed') ||
    message.includes('chunkloaderror') ||
    message.includes('loading chunk')
  );
}

/**
 * Maintly Router Configuration
 *
 * Three distinct portals with isolated routing:
 * - Customer Portal: /customer/*
 * - Service Provider Portal: /service/*
 * - Admin/Operations Portal: /admin/*
 *
 * Protected routes redirect unauthenticated users to their respective login pages.
 */
export const router = createBrowserRouter([
  // Public landing page
  {
    path: '/',
    element: withPageLoader(<MaintlyLandingPage />),
    errorElement: <RouteErrorBoundary />,
  },

  // ==========================================
  // CUSTOMER PORTAL (Mod A - Fabrika/KOBİ/Ev)
  // ==========================================
  {
    path: '/customer',
    element: withPageLoader(<CustomerLayout />),
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: withPageLoader(
          <ProtectedRoute requiredRole="customer">
            <Navigate to="/customer/dashboard" replace />
          </ProtectedRoute>
        ),
      },
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
            <Navigate to="/customer/asset-tree" replace />
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
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: withPageLoader(
          <ProtectedRoute requiredRole="service">
            <Navigate to="/service/dashboard" replace />
          </ProtectedRoute>
        ),
      },
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
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: withPageLoader(
          <ProtectedRoute requiredRole="admin">
            <Navigate to="/admin/dashboard" replace />
          </ProtectedRoute>
        ),
      },
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
    errorElement: <RouteErrorBoundary />,
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
