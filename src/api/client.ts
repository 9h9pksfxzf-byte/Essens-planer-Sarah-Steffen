import { createClient } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/react-query-persist-client';

const SUPABASE_URL = 'https://nfpnfhdbwclengtronnj.supabase.co';
const SUPABASE_ANON_KEY = 'Sb_publishable_cIeZYFoZAoS7LynIwSx4pA_FQHsyZZB';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24 * 30, // 30 Tage Offline-Cache
      staleTime: 1000 * 60 * 5,
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'MEAL_PLANNER_OFFLINE_CACHE',
});
