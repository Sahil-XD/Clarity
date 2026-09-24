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
 * Sign in with Google OAuth (opens system browser)
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      skipBrowserRedirect: false,
    },
  });

  if (error) {
    console.error('[Supabase] Google sign-in error:', error);
    throw error;
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

  // Create profile in Supabase
  if (data.user) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      username,
      email,
    });

    if (profileError) {
      console.error('[Supabase] Profile creation error:', profileError);
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
