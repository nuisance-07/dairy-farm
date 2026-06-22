'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Farm } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  farm: Farm | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshFarm: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  farm: null,
  loading: true,
  signOut: async () => {},
  refreshFarm: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchFarm = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('farms')
      .select('*')
      .eq('user_id', userId)
      .single();
    setFarm(data);
  }, [supabase]);

  const refreshFarm = useCallback(async () => {
    if (user) {
      await fetchFarm(user.id);
    }
  }, [user, fetchFarm]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchFarm(user.id);
      }
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchFarm(session.user.id);
        } else {
          setFarm(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, fetchFarm]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setFarm(null);
  };

  return (
    <AuthContext.Provider value={{ user, farm, loading, signOut, refreshFarm }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
