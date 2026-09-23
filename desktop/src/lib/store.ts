import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "./api";
import type { LoginRequest, RegisterRequest } from "./types";

interface AuthState {
  userId: number | null;
  username: string | null;
  email: string | null;
  avatarUrl: string | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      username: null,
      email: null,
      avatarUrl: null,
      token: null,
      isAuthenticated: false,

      login: async (data) => {
        const res = await api.login(data);
        set({
          userId: res.userId,
          username: res.username,
          email: res.email || null,
          avatarUrl: res.avatarUrl || null,
          token: res.token || null,
          isAuthenticated: true,
        });
      },

      register: async (data) => {
        const res = await api.register(data);
        set({
          userId: res.userId,
          username: res.username,
          email: res.email || null,
          avatarUrl: res.avatarUrl || null,
          token: res.token || null,
          isAuthenticated: true,
        });
      },

      googleLogin: async (idToken) => {
        const res = await api.googleLogin(idToken);
        set({
          userId: res.userId,
          username: res.username,
          email: res.email || null,
          avatarUrl: res.avatarUrl || null,
          token: res.token || null,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          userId: null,
          username: null,
          email: null,
          avatarUrl: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "clarity-auth",
    }
  )
);
