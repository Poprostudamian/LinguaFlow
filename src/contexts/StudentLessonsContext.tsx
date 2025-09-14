// src/contexts/StudentLessonsContext.tsx - UPROSZCZONA WERSJA

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface StudentLessonsContextType {
  // Placeholder for future functionality
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const StudentLessonsContext = createContext<StudentLessonsContextType | undefined>(undefined);

interface StudentLessonsProviderProps {
  children: ReactNode;
}

export function StudentLessonsProvider({ children }: StudentLessonsProviderProps) {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!session?.user?.id) return;
    
    setIsLoading(true);
    try {
      // Placeholder - actual functionality moved to individual components
      console.log('StudentLessonsProvider: refresh called');
    } catch (err: any) {
      setError(err.message || 'Failed to refresh');
    } finally {
      setIsLoading(false);
    }
  };

  const value: StudentLessonsContextType = {
    isLoading,
    error,
    refresh,
  };

  return (
    <StudentLessonsContext.Provider value={value}>
      {children}
    </StudentLessonsContext.Provider>
  );
}

export function useStudentLessons(): StudentLessonsContextType {
  const context = useContext(StudentLessonsContext);
  if (context === undefined) {
    throw new Error('useStudentLessons must be used within a StudentLessonsProvider');
  }
  return context;
}