import axios from 'axios';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { useCartStore } from '@/store/useCartStore';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  avatar?: string;
  hasPassword?: boolean;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  logout: () => void;
  setAccessToken: (accessToken: string) => void;
  syncRole: (role: 'USER' | 'ADMIN') => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isLoggedIn: false,
      isAdmin: false,

      login: (accessToken, refreshToken, user) => {
        // Clear cart if a different user is logging in (e.g., user switches account)
        const currentUser = get().user;
        if (currentUser && currentUser.id !== user.id) {
          useCartStore.getState().clear();
        }
        set({ accessToken, refreshToken, user, isLoggedIn: true, isAdmin: user.role === 'ADMIN' });
      },

      logout: () => {
        const { refreshToken } = get();
        // Best-effort call to backend to invalidate the refresh token
        if (refreshToken) {
          const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';
          axios.post(`${baseUrl}/auth/logout`, { refreshToken }).catch(() => {});
        }
        useCartStore.getState().clear();
        set({ accessToken: null, refreshToken: null, user: null, isLoggedIn: false, isAdmin: false });
      },

      setAccessToken: (accessToken) => set({ accessToken }),

      syncRole: (role) =>
        set((state) => ({
          user: state.user ? { ...state.user, role } : null,
          isAdmin: role === 'ADMIN',
        })),
    }),
    { name: 'nebula-auth', version: 2 },
  ),
);
