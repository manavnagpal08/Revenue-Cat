import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { UserProfile, Business } from '../types';
import { Session, User } from '@supabase/supabase-js';
import { profileService } from '../services/profileService';
import { workspaceService, CreateBusinessInput } from '../services/workspaceService';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  currentBusiness: Business | null;
  businesses: Business[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  setCurrentBusiness: (business: Business | null) => void;
  switchBusiness: (businessId: string) => void;
  refreshBusinesses: () => Promise<void>;
  createBusiness: (input: CreateBusinessInput) => Promise<Business>;
  updateBusiness: (businessId: string, updates: Partial<Business>) => Promise<Business>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  currentBusiness: null,
  businesses: [],
  isLoading: true,
  isInitialized: false,
  error: null,

  clearError: () => set({ error: null }),

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      // 1. Get current session — protected with 2000ms timeout
      let session = null;
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), 2000)
        );
        const res: any = await Promise.race([supabase.auth.getSession(), timeoutPromise]);
        session = res?.data?.session || null;
      } catch (netErr: any) {
        console.warn('Network or timeout getting session:', netErr);
      }
      
      if (!session?.user) {
        set({
          session: null,
          user: null,
          profile: null,
          currentBusiness: null,
          businesses: [],
          isLoading: false,
          isInitialized: true,
        });
        return;
      }

      set({ session, user: session.user });

      // 2. Fetch Profile from Supabase with timeout
      let profile = null;
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Profile timeout')), 2000)
        );
        profile = await Promise.race([
          profileService.getCurrentProfile(session.user.id),
          timeoutPromise as any,
        ]);
      } catch {}

      if (profile) {
        set({ profile });
      } else {
        const newProfile: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || 'Founder',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        };
        set({ profile: newProfile });
      }

      // 3. Fetch User Businesses with timeout
      let businesses: Business[] = [];
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Businesses timeout')), 2000)
        );
        businesses = await Promise.race([
          workspaceService.getUserBusinesses(session.user.id),
          timeoutPromise as any,
        ]);
      } catch {}
      
      let activeBiz: Business | null = null;
      if (businesses.length > 0) {
        const prevId = get().currentBusiness?.id;
        activeBiz = businesses.find((b) => b.id === prevId) || businesses[0];
      }

      set({
        businesses,
        currentBusiness: activeBiz,
        isLoading: false,
        isInitialized: true,
      });
    } catch (err: any) {
      console.error('Error initializing Auth / Workspace state:', err);
      set({
        error: null, // Don't show error to user, just proceed to auth
        session: null,
        user: null,
        profile: null,
        currentBusiness: null,
        businesses: [],
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  setCurrentBusiness: (business) => {
    set({ currentBusiness: business });
  },

  switchBusiness: (businessId: string) => {
    const { businesses } = get();
    const target = businesses.find((b) => b.id === businessId);
    if (target) {
      set({ currentBusiness: target });
    }
  },

  refreshBusinesses: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const businesses = await workspaceService.getUserBusinesses(user.id);
      const current = get().currentBusiness;
      const matched = businesses.find((b) => b.id === current?.id) || businesses[0] || null;
      set({ businesses, currentBusiness: matched });
    } catch (err: any) {
      console.warn('Failed to refresh businesses:', err);
    }
  },

  createBusiness: async (input: CreateBusinessInput) => {
    const { user } = get();
    if (!user) throw new Error('User is not authenticated');

    const newBiz = await workspaceService.createBusiness(user.id, input);
    const updated = [...get().businesses, newBiz];
    set({ businesses: updated, currentBusiness: newBiz });
    return newBiz;
  },

  updateBusiness: async (businessId: string, updates: Partial<Business>) => {
    const updatedBiz = await workspaceService.updateBusiness(businessId, updates);
    const updatedList = get().businesses.map((b) => (b.id === businessId ? updatedBiz : b));
    set({
      businesses: updatedList,
      currentBusiness: get().currentBusiness?.id === businessId ? updatedBiz : get().currentBusiness,
    });
    return updatedBiz;
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    const { user } = get();
    if (!user) throw new Error('User is not authenticated');

    const updated = await profileService.updateProfile(user.id, updates);
    set({ profile: updated });
    return updated;
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    } finally {
      set({
        session: null,
        user: null,
        profile: null,
        currentBusiness: null,
        businesses: [],
        isLoading: false,
      });
    }
  },
}));
