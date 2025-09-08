// src/contexts/AuthContext.tsx - UPROSZCZONA WERSJA
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthSession } from '../types';
import { supabase, getCurrentUser as getSupabaseUser, signOut } from '../lib/supabase';

interface AuthContextType {
  session: AuthSession;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession>({
    user: null,
    isAuthenticated: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('🔄 Checking auth...');
        
        // Sprawdź czy mamy sesję
        const { data: { session: authSession } } = await supabase.auth.getSession();
        
        if (authSession?.user && mounted) {
          console.log('✅ Found session for:', authSession.user.email);
          
          // UPROSZCZONE - użyj danych z auth session
          const user = {
            id: authSession.user.id,
            email: authSession.user.email || '',
            role: (authSession.user.user_metadata?.role as 'student' | 'tutor') || 'student',
            first_name: authSession.user.user_metadata?.first_name || 'User',
            last_name: authSession.user.user_metadata?.last_name || '',
          };
          
          setSession({ user, isAuthenticated: true });
        }
      } catch (error) {
        console.error('❌ Auth init error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // UPROSZCZONY listener - bez dodatkowych zapytań
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, authSession) => {
        if (!mounted) return;
        
        console.log('Auth event:', event);
        
        if (event === 'SIGNED_IN' && authSession?.user) {
          const user = {
            id: authSession.user.id,
            email: authSession.user.email || '',
            role: (authSession.user.user_metadata?.role as 'student' | 'tutor') || 'student',
            first_name: authSession.user.user_metadata?.first_name || 'User',
            last_name: authSession.user.user_metadata?.last_name || '',
          };
          
          if (mounted) {
            setSession({ user, isAuthenticated: true });
            setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          if (mounted) {
            setSession({ user: null, isAuthenticated: false });
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setSession({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Krótszy loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const value: AuthContextType = {
    session,
    login: handleLogin,
    logout: handleLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}