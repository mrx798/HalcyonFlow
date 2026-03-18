import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, refreshToken: string | null, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (token, refreshToken, user) => {
        set({ 
          token, 
          refreshToken, 
          user, 
          isAuthenticated: true 
        });
        localStorage.setItem('accessToken', token);
      },
      logout: () => {
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
        localStorage.removeItem('accessToken');
      },
      updateUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
