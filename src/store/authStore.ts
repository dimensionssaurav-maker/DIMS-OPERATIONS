import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface User {
  id: number;
  username: string;
  role: string;
  name: string;
}

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  loginWithSupabase: (username: string, password: string) => Promise<{ error?: string }>;
}

const DEMO_USERS: User[] = [
  { id: 1, name: 'Arjun Mehta', username: 'admin', role: 'Admin' },
  { id: 2, name: 'Rahul D', username: 'rahul', role: 'Production Manager' },
  { id: 3, name: 'Priya Nair', username: 'priya', role: 'Store Manager' },
  { id: 4, name: 'Suresh K', username: 'suresh', role: 'QC Manager' },
];
const DEMO_PASSWORDS: Record<string, string> = { admin: 'admin123', rahul: 'password', priya: 'password', suresh: 'password' };

function checkDemo(username: string, password: string, set: any) {
  const user = DEMO_USERS.find((u) => u.username === username);
  if (!user || DEMO_PASSWORDS[username] !== password) return { error: 'Invalid username or password.' };
  localStorage.setItem('erp_user', JSON.stringify(user));
  set({ user });
  return {};
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => { try { return JSON.parse(localStorage.getItem('erp_user') || 'null'); } catch { return null; } })(),
  setUser: (user) => { if (user) localStorage.setItem('erp_user', JSON.stringify(user)); else localStorage.removeItem('erp_user'); set({ user }); },
  logout: () => { localStorage.removeItem('erp_user'); set({ user: null }); },
  loginWithSupabase: async (username, password) => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const isConfigured = url && url !== 'https://placeholder.supabase.co' && url !== '';
    if (isConfigured) {
      try {
        const { data, error } = await supabase.from('erp_users').select('id, name, username, role').eq('username', username).eq('password_hash', password).eq('is_active', true).single();
        if (error || !data) return checkDemo(username, password, set);
        const user: User = { id: data.id, name: data.name, username: data.username, role: data.role };
        localStorage.setItem('erp_user', JSON.stringify(user));
        set({ user });
        return {};
      } catch { return checkDemo(username, password, set); }
    }
    return checkDemo(username, password, set);
  },
}));
