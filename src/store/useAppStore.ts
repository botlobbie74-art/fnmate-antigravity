import { create } from 'zustand';
import { Profile } from '../lib/supabase';

interface AppState {
  isAuthLoading: boolean;
  setIsAuthLoading: (loading: boolean) => void;

  authUserId: string | null;
  setAuthUserId: (id: string | null) => void;
  
  // Auth simulation for demo (or real if hooked up)
  currentUser: Profile | null;
  setCurrentUser: (user: Profile | null) => void;
  
  // Realtime messages
  unreadCount: number;
  incrementUnread: () => void;
  resetUnread: () => void;
  
  // Demo online users
  onlineUsers: Profile[];
  setOnlineUsers: (users: Profile[]) => void;

  toxicityFilterEnabled: boolean;
  toggleToxicityFilter: () => void;

  showTutorial: boolean;
  setShowTutorial: (show: boolean) => void;

  fetchSessionToken: () => Promise<string | null>;
}

export const useAppStore = create<AppState>((set) => ({
  isAuthLoading: true,
  setIsAuthLoading: (loading) => set({ isAuthLoading: loading }),
  
  authUserId: null,
  setAuthUserId: (id) => set({ authUserId: id }),
  
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  
  unreadCount: 0,
  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  resetUnread: () => set({ unreadCount: 0 }),
  
  onlineUsers: [],
  setOnlineUsers: (users) => set({ onlineUsers: users }),

  toxicityFilterEnabled: false,
  toggleToxicityFilter: () => set((state) => ({ toxicityFilterEnabled: !state.toxicityFilterEnabled })),

  showTutorial: false,
  setShowTutorial: (show) => set({ showTutorial: show }),

  fetchSessionToken: async () => {
    const { supabase } = await import('../lib/supabase');
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }
}));
