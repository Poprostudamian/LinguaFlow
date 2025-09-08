import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthSession } from '../types';
import { supabase, getCurrentUser as getSupabaseUser, signOut } from '../lib/supabase';
import { BookOpen } from "lucide-react";


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
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        
        if (authSession?.user) {
          const user = await getSupabaseUser();
          if (user) {
            setSession({ user, isAuthenticated: true });
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, authSession) => {
        console.log('Auth state changed:', event, authSession?.user?.email);
        
        if (event === 'SIGNED_IN' && authSession?.user) {
          try {
            const user = await getSupabaseUser();
            if (user) {
              setSession({ user, isAuthenticated: true });
            }
          } catch (error) {
            console.error('Error getting user after sign in:', error);
            setSession({ user: null, isAuthenticated: false });
          }
        } else if (event === 'SIGNED_OUT') {
          setSession({ user: null, isAuthenticated: false });
        }
        
        setLoading(false);
      }
    );

    return () => {
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

      // Session will be updated automatically via onAuthStateChange
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    signOut().catch(console.error);
    // Session will be updated automatically via onAuthStateChange
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}