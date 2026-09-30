import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      if (Platform.OS === 'web') {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      }
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.warn('SecureStore getItem notice:', e);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
        return;
      }
      if (value && value.length < 2040) {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (e) {
      console.warn('SecureStore setItem notice:', e);
    }
  },
  removeItem: async (key: string) => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.warn('SecureStore removeItem notice:', e);
    }
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ullnvtgketmsljqbwxvv.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbG52dGdrZXRtc2xqcWJ3eHZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2MzQ0NzEsImV4cCI6MjEwNjIxMDQ3MX0.zpVRiMcw1P5V1yHEapYKhlNBfjv9rD-05DgO2Xy-t74';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
