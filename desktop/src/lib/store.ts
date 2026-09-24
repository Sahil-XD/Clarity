import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "./api";
import { supabase, getSupabaseUser, signOut } from "./supabase";
import type { LoginRequest, RegisterRequest } from "./types";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AuthState {
  userId: number | null;
  username: string | null;
  email: string | null;
  avatarUrl: string | null;
  token: string | null;
  supabaseUser: SupabaseUser | null;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  setSupabaseAuth: (user: SupabaseUser) => Promise<void>;
  initAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      userId: null,
      username: null,
      email: null,
      avatarUrl: null,
      token: null,
      supabaseUser: null,
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

      setSupabaseAuth: async (user: SupabaseUser) => {
        // User authenticated with Supabase, sync to local SQLite
        const localUser = await api.ensureSupabaseUser(
          user.id,
          user.email!,
          user.user_metadata?.username || user.email!.split('@')[0]
        );

        set({
          userId: localUser.userId,
          username: localUser.username,
          email: user.email || null,
          avatarUrl: user.user_metadata?.avatar_url || null,
          token: null, // Not needed with Supabase
          supabaseUser: user,
          isAuthenticated: true,
        });
      },

      initAuth: async () => {
        const user = await getSupabaseUser();
        if (user) {
          await get().setSupabaseAuth(user);
        }
      },

      logout: async () => {
        await signOut();
        set({
          userId: null,
          username: null,
          email: null,
          avatarUrl: null,
          token: null,
          supabaseUser: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "clarity-auth",
    }
  )
);
