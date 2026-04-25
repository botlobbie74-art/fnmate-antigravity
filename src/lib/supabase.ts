import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export type Profile = {
  id: string;
  epic_name: string;
  age?: number;
  country: string;
  bio: string;
  rank: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Elite' | 'Champion' | 'Unreal';
  mode_preference: string;
  avatar_url?: string;
  play_style: string;
  build_score?: number;
  aim_score?: number;
  iq_score?: number;
  role?: string;
  has_badge?: boolean;
  reputation?: number;
  platform?: string;
  plan?: string;
  divin_balance?: number;
  divin_active_until?: string;
  ref_code?: string;
  referred_by?: string;
};

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_toxic?: boolean;
};
