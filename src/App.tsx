import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';

/**
 * Temizinden - Main Application Component
 *
 * Three distinct portals with isolated routing:
 * - Customer Portal: /customer/* (Mod A - Fabrika/KOBİ/Ev)
 * - Service Provider Portal: /service/* (Mod X - Servis Firması)
 * - Admin/Operations Portal: /admin/* (Ops Center)
 */
function App() {
  return <RouterProvider router={router} />;
}

export default App;
