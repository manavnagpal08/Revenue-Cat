import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

export interface SignUpParams {
  fullName: string;
  email: string;
  password: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export const authService = {
  /**
   * Registers a new user account and creates their profile record.
   */
  async signUp({ fullName, email, password }: SignUpParams) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      // Create initial profile record
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        email: email.trim(),
        full_name: fullName.trim(),
        avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200`,
      });

      if (profileError) {
        console.warn('Profile auto-creation note:', profileError.message);
      }
    }

    return data;
  },

  /**
   * Signs in with email and password.
   */
  async signIn({ email, password }: SignInParams) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) throw error;
    return data;
  },

  /**
   * 1-Click Sign in / Sign up with Google.
   */
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'soloceo://auth/callback',
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Signs out current user session.
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Returns current active session.
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * Returns current authenticated user.
   */
  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },
};
