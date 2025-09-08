// src/contexts/AuthContext.tsx - Zabezpieczona wersja
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
    let timeoutId: NodeJS.Timeout;

    // Timeout protection - jeśli ładowanie trwa więcej niż 10 sekund
    const timeoutProtection = setTimeout(() => {
      if (mounted) {
        console.warn('Auth loading timeout - proceeding without authentication');
        setLoading(false);
      }
    }, 10000); // 10 sekund

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔄 Getting initial session...');
        
        const { data: { session: authSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Auth session error:', error);
          throw error;
        }

        if (authSession?.user && mounted) {
          console.log('✅ Auth session found, getting user data...');
          const user = await getSupabaseUser();
          if (user && mounted) {
            console.log('✅ User data loaded:', user.email, user.role);
            setSession({ user, isAuthenticated: true });
          }
        } else {
          console.log('ℹ️ No auth session found');
        }
      } catch (error) {
        console.error('❌ Error getting initial session:', error);
        if (mounted) {
          setSession({ user: null, isAuthenticated: false });
        }
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(timeoutProtection);
        }
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, authSession) => {
        if (!mounted) return;
        
        console.log('🔄 Auth state changed:', event, authSession?.user?.email);
        
        if (event === 'SIGNED_IN' && authSession?.user) {
          try {
            const user = await getSupabaseUser();
            if (user && mounted) {
              console.log('✅ User signed in:', user.email, user.role);
              setSession({ user, isAuthenticated: true });
            }
          } catch (error) {
            console.error('❌ Error getting user after sign in:', error);
            if (mounted) {
              setSession({ user: null, isAuthenticated: false });
            }
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('ℹ️ User signed out');
          if (mounted) {
            setSession({ user: null, isAuthenticated: false });
          }
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    // Cleanup
    return () => {
      mounted = false;
      clearTimeout(timeoutProtection);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔄 Attempting login for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log('✅ Login successful');
      return true;
    } catch (error) {
      console.error('❌ Login failed:', error);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🔄 Logging out...');
      await signOut();
      setSession({ user: null, isAuthenticated: false });
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout failed:', error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Initializing application...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            If this takes too long, check your internet connection
          </p>
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