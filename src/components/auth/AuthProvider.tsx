'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const autoLogin = localStorage.getItem('autogrowth_auto_login') === 'true';

    supabase.auth.getSession().then(({ data: { session } }) => {
      // 자동 로그인이 꺼져 있고, 명시적 로그인이 아닌 경우 세션 무시
      if (session && !autoLogin && !sessionStorage.getItem('autogrowth_session_active')) {
        supabase.auth.signOut();
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session) sessionStorage.setItem('autogrowth_session_active', 'true');
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) sessionStorage.setItem('autogrowth_session_active', 'true');
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    sessionStorage.removeItem('autogrowth_session_active');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
