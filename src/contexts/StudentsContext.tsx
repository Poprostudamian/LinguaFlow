// src/contexts/StudentsContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { 
  getTutorStudents, 
  getTutorInvitations, 
  getStudentsStats,
  TutorStudent, 
  RelationshipInvitation,
  StudentStats 
} from '../lib/supabase';

interface StudentsContextType {
  // Data
  students: TutorStudent[];
  invitations: RelationshipInvitation[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Stats (computed)
  totalStudents: number;
  activeStudents: number;
  pendingInvitations: number;
  
  // Actions
  refreshStudents: () => Promise<void>;
  refreshInvitations: () => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // Utility functions
  getStudentById: (id: string) => TutorStudent | undefined;
  getStudentsByIds: (ids: string[]) => TutorStudent[];
  searchStudents: (query: string) => TutorStudent[];
}

const StudentsContext = createContext<StudentsContextType | undefined>(undefined);

interface StudentsProviderProps {
  children: ReactNode;
}

export function StudentsProvider({ children }: StudentsProviderProps) {
  const { session } = useAuth();
  const [students, setStudents] = useState<TutorStudent[]>([]);
  const [invitations, setInvitations] = useState<RelationshipInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data when tutor logs in
  useEffect(() => {
    if (session.isAuthenticated && session.user?.role === 'tutor') {
      refreshAll();
    } else {
      // Clear data when not authenticated or not a tutor
      setStudents([]);
      setInvitations([]);
      setError(null);
    }
  }, [session.isAuthenticated, session.user?.role]);

  const refreshStudents = async () => {
    try {
      setError(null);
      const studentsData = await getTutorStudents();
      setStudents(studentsData);
    } catch (err: any) {
      console.error('Error loading students:', err);
      setError('Failed to load students');
      throw err;
    }
  };

  const refreshInvitations = async () => {
    try {
      setError(null);
      const invitationsData = await getTutorInvitations();
      setInvitations(invitationsData);
    } catch (err: any) {
      console.error('Error loading invitations:', err);
      setError('Failed to load invitations');
      throw err;
    }
  };

  const refreshAll = async () => {
    if (!session.isAuthenticated || session.user?.role !== 'tutor') {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        refreshStudents(),
        refreshInvitations()
      ]);
    } catch (err: any) {
      console.error('Error loading students data:', err);
      setError('Failed to load students data');
    } finally {
      setIsLoading(false);
    }
  };

  // Utility functions
  const getStudentById = (id: string): TutorStudent | undefined => {
    return students.find(student => student.student_id === id);
  };

  const getStudentsByIds = (ids: string[]): TutorStudent[] => {
    return students.filter(student => ids.includes(student.student_id));
  };

  const searchStudents = (query: string): TutorStudent[] => {
    if (!query.trim()) return students;
    
    const lowerQuery = query.toLowerCase();
    return students.filter(student => {
      const fullName = `${student.student_first_name} ${student.student_last_name}`.toLowerCase();
      const email = student.student_email.toLowerCase();
      return fullName.includes(lowerQuery) || email.includes(lowerQuery);
    });
  };

  // Computed stats
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.is_active).length;
  const pendingInvitations = invitations.filter(inv => inv.status === 'pending').length;

  const value: StudentsContextType = {
    // Data
    students,
    invitations,
    
    // Loading states
    isLoading,
    error,
    
    // Stats
    totalStudents,
    activeStudents,
    pendingInvitations,
    
    // Actions
    refreshStudents,
    refreshInvitations,
    refreshAll,
    
    // Utilities
    getStudentById,
    getStudentsByIds,
    searchStudents,
  };

  return (
    <StudentsContext.Provider value={value}>
      {children}
    </StudentsContext.Provider>
  );
}

// Hook to use the students context
export function useStudents(): StudentsContextType {
  const context = useContext(StudentsContext);
  if (context === undefined) {
    throw new Error('useStudents must be used within a StudentsProvider');
  }
  return context;
}

// Hook specifically for tutors (with role check)
export function useTutorStudents(): StudentsContextType {
  const { session } = useAuth();
  const context = useContext(StudentsContext);
  
  if (context === undefined) {
    throw new Error('useTutorStudents must be used within a StudentsProvider');
  }
  
  if (!session.isAuthenticated || session.user?.role !== 'tutor') {
    throw new Error('useTutorStudents can only be used by authenticated tutors');
  }
  
  return context;
}