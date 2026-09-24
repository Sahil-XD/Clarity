import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase, signOut, signInWithGoogle, signInWithEmail, signUpWithEmail } from "./supabase";
import { api } from "./api";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AuthState {
  supabaseUser: SupabaseUser | null;
  username: string | null;
  email: string | null;
  avatarUrl: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, username: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  initAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      supabaseUser: null,
      username: null,
      email: null,
      avatarUrl: null,
      isAuthenticated: false,
      isLoading: true,

      loginWithEmail: async (email, password) => {
        const { user } = await signInWithEmail(email, password);
        if (!user) throw new Error("Login failed");

        // Ensure profile exists or fallback to metadata
        let profile = await api.getProfile().catch(() => null);
        if (!profile) {
          profile = await api.upsertProfile({
            username: user.user_metadata?.username || email.split("@")[0],
            email,
          }).catch(() => null);
        }

        set({
          supabaseUser: user,
          username: profile?.username || user.user_metadata?.username || email.split("@")[0],
          email: user.email || null,
          avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || null,
          isAuthenticated: true,
        });
      },

      registerWithEmail: async (email, password, username) => {
        const res = await signUpWithEmail(email, password, username);
        // If auto-confirm is enabled and session returned, log in immediately
        if (res.session?.user) {
          set({
            supabaseUser: res.session.user,
            username,
            email,
            avatarUrl: null,
            isAuthenticated: true,
          });
        }
      },

      loginWithGoogle: async () => {
        await signInWithGoogle();
        // OAuth redirects — the session will be picked up by initAuth on return
      },

      initAuth: async () => {
        set({ isLoading: true });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            let profile = await api.getProfile().catch(() => null);
            if (!profile) {
              profile = await api.upsertProfile({
                username: user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split("@")[0] || "user",
                email: user.email || "",
              }).catch(() => null);
            }

            set({
              supabaseUser: user,
              username: profile?.username || user.user_metadata?.username || user.email?.split("@")[0] || "user",
              email: user.email || null,
              avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || null,
              isAuthenticated: true,
            });
          } else {
            // Check if cached session exists
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              set({
                supabaseUser: session.user,
                isAuthenticated: true,
              });
            } else {
              set({
                supabaseUser: null,
                username: null,
                email: null,
                avatarUrl: null,
                isAuthenticated: false,
              });
            }
          }
        } catch (err) {
          console.warn("[Auth] Network or auth error during initAuth:", err);
          // If offline but state was previously authenticated, keep user in app
          const state = get();
          if (state.isAuthenticated && (state.email || state.username)) {
            console.info("[Auth] Retaining offline session for:", state.username || state.email);
          } else {
            set({ isAuthenticated: false });
          }
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        await signOut();
        set({
          supabaseUser: null,
          username: null,
          email: null,
          avatarUrl: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "clarity-auth",
      partialize: (state) => ({
        // Only persist these fields — not the full SupabaseUser (session is managed by Supabase)
        username: state.username,
        email: state.email,
        avatarUrl: state.avatarUrl,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
