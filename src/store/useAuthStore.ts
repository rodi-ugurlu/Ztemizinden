import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'customer' | 'service' | 'admin' | null;

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (role: UserRole, userData: Partial<User>) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed
  hasRole: (role: UserRole) => boolean;
}

/**
 * Authentication Store - Zustand
 *
 * Manages user sessions across three distinct portals:
 * - Customer Portal (Mod A)
 * - Service Provider Portal (Mod X)
 * - Admin/Operations Portal
 *
 * Uses persist middleware to maintain session across browser refreshes.
 * Session data is cleared on logout.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: (role, userData) => {
        const user: User = {
          id: userData.id || crypto.randomUUID(),
          email: userData.email || '',
          name: userData.name || 'User',
          role,
          avatar: userData.avatar,
        };
        set({ user, role, isAuthenticated: true, error: null });
      },

      logout: () => {
        set({
          user: null,
          role: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      hasRole: (role) => get().role === role,
    }),
    {
      name: 'emaintenance-auth-storage',
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(role: UserRole) {
  return useAuthStore((state) => state.role === role);
}

/**
 * Hook to get current user data
 */
export function useCurrentUser() {
  return useAuthStore((state) => state.user);
}
