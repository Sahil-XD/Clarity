import { createClient, type User as SupabaseUser, type Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing credentials - set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key) => {
        const item = localStorage.getItem(key);
        return item ? Promise.resolve(item) : Promise.resolve(null);
      },
      setItem: (key, value) => {
        localStorage.setItem(key, value);
        return Promise.resolve();
      },
      removeItem: (key) => {
        localStorage.removeItem(key);
        return Promise.resolve();
      },
    },
  },
});

/**
 * Get current Supabase session
 */
export async function getSupabaseSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Get current Supabase user
 */
export async function getSupabaseUser(): Promise<SupabaseUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    console.error('[Supabase] Google OAuth setup error:', error);
    throw error;
  }

  if (data?.url) {
    // Pre-flight check: Verify if Google provider is actually enabled in the Supabase project
    try {
      const check = await fetch(data.url);
      if (!check.ok) {
        const body = await check.json().catch(() => null);
        if (body?.msg?.includes('provider is not enabled') || body?.error_code === 'validation_failed') {
          throw new Error(
            'Google Sign-In is not enabled in your Supabase project (rbhtqvysfkxhcsmvejws). Go to Supabase Dashboard > Authentication > Providers > Google, toggle it ON, and add your Client ID & Secret.'
          );
        }
      }
    } catch (fetchErr: any) {
      if (fetchErr.message?.includes('not enabled')) {
        throw fetchErr;
      }
      // If network/CORS restricts preflight check, proceed with redirect
    }

    // Google provider is enabled: proceed to Google sign-in
    window.location.href = data.url;
    return data;
  }

  return data;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string, username: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  });

  if (error) throw error;

  // Attempt client-side profile upsert if session is active (e.g. email confirmations disabled)
  // Note: docs/supabase-profile-trigger.sql handles this via database trigger automatically
  if (data.user && data.session) {
    try {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username,
        email,
      }, { onConflict: 'id' });
    } catch (profileError) {
      console.warn('[Supabase] Client profile upsert skipped (handled by DB trigger):', profileError);
    }
  }

  return data;
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
