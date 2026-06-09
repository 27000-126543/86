import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginRequest, LoginResponse, ApiResponse } from '@/../shared/types';
import { api } from '@/utils/api';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      loading: false,

      login: async (credentials: LoginRequest) => {
        set({ loading: true });
        try {
          const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
          const { token, user } = response.data.data;
          set({ user, token, loading: false });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ loading: true });
        try {
          await api.post('/auth/logout');
        } finally {
          set({ user: null, token: null, loading: false });
        }
      },

      fetchProfile: async () => {
        set({ loading: true });
        try {
          const response = await api.get<ApiResponse<User>>('/auth/profile');
          set({ user: response.data.data, loading: false });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
