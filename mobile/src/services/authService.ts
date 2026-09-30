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
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
        },
      },
    });

    if (error) {
      throw new Error(error.message || 'Registration failed.');
    }

    if (data?.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: cleanEmail,
          full_name: cleanName,
          avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200`,
        });
      } catch (profileErr) {
        console.warn('Profile creation notice:', profileErr);
      }
      return data;
    }

    throw new Error('Could not complete account registration.');
  },

  /**
   * Signs in with email and password.
   */
  async signIn({ email, password }: SignInParams) {
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      throw new Error(error.message || 'Invalid email or password.');
    }

    if (data?.user) {
      return data;
    }

    throw new Error('Sign-in failed. Please try again.');
  },

  /**
   * Sign in / Sign up with Google using native WebBrowser OAuth session.
   */
  async signInWithGoogle() {
    const WebBrowser = require('expo-web-browser');
    const AuthSession = require('expo-auth-session');
    WebBrowser.maybeCompleteAuthSession();

    const redirectUrl = AuthSession.makeRedirectUri({
      scheme: 'soloceo',
      path: 'auth/callback',
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      if (
        error.message.toLowerCase().includes('unsupported provider') ||
        error.message.toLowerCase().includes('not enabled')
      ) {
        throw new Error(
          'Google OAuth is not enabled in your Supabase project dashboard. Please sign in or register with Email & Password.'
        );
      }
      throw new Error(error.message || 'Google Sign-In failed.');
    }

    if (!data?.url) {
      throw new Error('Could not initiate Google authentication session.');
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new Error('Google Sign-In was cancelled.');
    }

    if (result.type === 'success' && result.url) {
      const urlStr = result.url;
      const hashIndex = urlStr.indexOf('#');
      const queryIndex = urlStr.indexOf('?');

      const paramStr =
        hashIndex !== -1
          ? urlStr.substring(hashIndex + 1)
          : queryIndex !== -1
          ? urlStr.substring(queryIndex + 1)
          : '';

      const params = new URLSearchParams(paramStr);
      const code = params.get('code');
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      // 1. Handle PKCE Code Exchange
      if (code) {
        const exchangeRes = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeRes.data?.user) {
          const u = exchangeRes.data.user;
          try {
            await supabase.from('profiles').upsert({
              id: u.id,
              email: u.email,
              full_name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Founder',
              avatar_url: u.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
            });
          } catch {}
          return exchangeRes.data;
        }
      }

      // 2. Handle Implicit Hash Tokens
      if (accessToken && refreshToken) {
        const setRes = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (setRes.data?.user) {
          const u = setRes.data.user;
          try {
            await supabase.from('profiles').upsert({
              id: u.id,
              email: u.email,
              full_name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Founder',
              avatar_url: u.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
            });
          } catch {}
          return setRes.data;
        }
      }
    }

    throw new Error('Could not authenticate Google session tokens. Please ensure Google OAuth redirect URLs include soloceo:// in Supabase.');
  },

  /**
   * Signs out current user session.
   */
  async signOut() {
    try {
      await supabase.auth.signOut();
    } catch {}
  },

  /**
   * Sends password reset email.
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: 'soloceo://auth/reset-password',
    });
    if (error) {
      throw new Error(error.message);
    }
  },
};
