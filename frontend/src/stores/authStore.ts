import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Role } from '../types';

interface AuthState {
  token: string | null;
  email: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  setAuth: (token: string, email: string, role: Role) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      email: null,
      role: null,
      isAuthenticated: false,
      setAuth: (token, email, role) =>
        set({
          token,
          email,
          role,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          token: null,
          email: null,
          role: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'insureverify-auth',
      storage: createJSONStorage(() => sessionStorage), // or localStorage, sessionStorage is fine and resets cleanly if needed
    }
  )
);
