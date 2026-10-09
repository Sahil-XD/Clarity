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
    (set) => ({
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
        // OAuth redirects - the session will be picked up by initAuth on return
      },

      initAuth: async () => {
        try {
          // 1. Check local session from Supabase storage first (instant, 0ms, works offline)
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            // Instantly unlock UI with cached session so user NEVER stares at a frozen loading screen
            set({
              supabaseUser: session.user,
              username: session.user.user_metadata?.username || session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "user",
              email: session.user.email || null,
              avatarUrl: session.user.user_metadata?.avatar_url || null,
              isAuthenticated: true,
              isLoading: false,
            });

            // 2. Perform live server verification asynchronously with a 4s timeout in background
            const verifyPromise = Promise.race([
              supabase.auth.getUser(),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Auth verification timeout")), 4000)
              ),
            ]);

            verifyPromise
              .then(async ({ data: { user }, error: userError }) => {
                if (user) {
                  api.getProfile().then((profile) => {
                    if (profile) {
                      set({
                        username: profile.username || user.user_metadata?.username || user.email?.split("@")[0] || "user",
                        avatarUrl: profile.avatar_url || user.user_metadata?.avatar_url || null,
                      });
                    }
                  }).catch(() => {});
                } else if (userError) {
                  console.warn("[Auth] Session explicitly revoked by server:", userError.message);
                  set({
                    supabaseUser: null,
                    username: null,
                    email: null,
                    avatarUrl: null,
                    isAuthenticated: false,
                  });
                }
              })
              .catch((err) => {
                console.info("[Auth] Network verification slow/offline, continuing with cached session:", err.message);
              });

            return;
          } else {
            // No session exists
            set({
              supabaseUser: null,
              username: null,
              email: null,
              avatarUrl: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (err) {
          console.warn("[Auth] Error during initAuth:", err);
          set({
            supabaseUser: null,
            isAuthenticated: false,
            isLoading: false,
          });
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
      version: 2,
      migrate: (persistedState: any) => {
        // Strip legacy isAuthenticated from previous store versions
        if (persistedState) {
          delete persistedState.isAuthenticated;
        }
        return persistedState;
      },
      partialize: (state) => ({
        // Only persist profile metadata - session authentication is verified live via Supabase
        username: state.username,
        email: state.email,
        avatarUrl: state.avatarUrl,
      }),
    }
  )
);
