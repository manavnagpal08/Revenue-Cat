import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { UserProfile, Business } from '../types';
import { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  profile: UserProfile | null;
  currentBusiness: Business | null;
  businesses: Business[];
  isLoading: boolean;
  isInitialized: boolean;
  
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setCurrentBusiness: (business: Business | null) => void;
  setBusinesses: (businesses: Business[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  currentBusiness: null,
  businesses: [],
  isLoading: true,
  isInitialized: false,

  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setCurrentBusiness: (currentBusiness) => set({ currentBusiness }),
  setBusinesses: (businesses) => set({ businesses }),
  setIsLoading: (isLoading) => set({ isLoading }),

  initialize: async () => {
    try {
      set({ isLoading: true });
      const { data: { session } } = await supabase.auth.getSession();
      set({ session });

      if (session?.user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) set({ profile: profile as UserProfile });

        // Fetch businesses
        const { data: businesses } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', session.user.id);

        if (businesses && businesses.length > 0) {
          set({
            businesses: businesses as Business[],
            currentBusiness: businesses[0] as Business,
          });
        }
      }
    } catch (err) {
      console.error('Failed to initialize auth state:', err);
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null, currentBusiness: null, businesses: [] });
  },
}));
