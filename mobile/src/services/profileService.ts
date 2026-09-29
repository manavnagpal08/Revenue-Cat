import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

export const profileService = {
  /**
   * Fetches the current user profile from Supabase.
   */
  async getCurrentProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching profile:', error.message);
      return null;
    }
    return data as UserProfile | null;
  },

  /**
   * Updates user profile name and avatar.
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as UserProfile;
  },
};
