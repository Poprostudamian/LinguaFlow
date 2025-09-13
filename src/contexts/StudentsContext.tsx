// src/contexts/StudentsContext.tsx - FIXED VERSION
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { 
  getTutorStudents, 
  getTutorInvitations, 
  getTutorStudentStats,
  searchTutorStudents,
  TutorStudent, 
  RelationshipInvitation
} from '../lib/supabase';

interface StudentsContextType {
  // Data
  students: TutorStudent[];
  invitations: RelationshipInvitation[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Stats (computed from API)
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
  
  // Stats from API
  const [statsFromAPI, setStatsFromAPI] = useState({
    totalStudents: 0,
    activeStudents: 0,
    pendingInvitations: 0
  });

  // ✅ FIX: Only load data for tutors, not students
  const refreshStudents = async () => {
    // Don't load tutor data for student users
    if (!session.isAuthenticated || session.user?.role !== 'tutor') {
      return;
    }

    if (!session.user?.id) {
      setError('No authenticated user');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const studentsData = await getTutorStudents();
      setStudents(studentsData || []);
    } catch (err: any) {
      console.error('Error fetching students:', err);
      setError(err.message || 'Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshInvitations = async () => {
    // Don't load tutor data for student users
    if (!session.isAuthenticated || session.user?.role !== 'tutor') {
      return;
    }

    if (!session.user?.id) {
      setError('No authenticated user');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const invitationsData = await getTutorInvitations();
      setInvitations(invitationsData || []);
    } catch (err: any) {
      console.error('Error fetching invitations:', err);
      setError(err.message || 'Failed to load invitations');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAll = async () => {
    // Don't load tutor data for student users
    if (!session.isAuthenticated || session.user?.role !== 'tutor') {
      return;
    }

    if (!session.user?.id) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const [studentsData, invitationsData, statsData] = await Promise.all([
        getTutorStudents().catch(() => []),
        getTutorInvitations().catch(() => []),
        getTutorStudentStats(session.user.id).catch(() => ({
          totalStudents: 0,
          activeStudents: 0,
          pendingInvitations: 0
        }))
      ]);

      setStudents(studentsData || []);
      setInvitations(invitationsData || []);
      setStatsFromAPI(statsData);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FIX: Only trigger data loading for tutors
  useEffect(() => {
    if (session.isAuthenticated && session.user?.role === 'tutor') {
      refreshAll();
    } else {
      // Reset data for non-tutor users
      setStudents([]);
      setInvitations([]);
      setStatsFromAPI({
        totalStudents: 0,
        activeStudents: 0,
        pendingInvitations: 0
      });
      setIsLoading(false);
      setError(null);
    }
  }, [session.isAuthenticated, session.user?.role, session.user?.id]);

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

  // Calculate stats (fallback to computed values if API fails)
  const totalStudents = statsFromAPI.totalStudents || students.length;
  const activeStudents = statsFromAPI.activeStudents || students.filter(s => s.student_is_active).length;
  const pendingInvitations = statsFromAPI.pendingInvitations || invitations.filter(inv => 
    inv.status === 'pending' && new Date(inv.expires_at) > new Date()
  ).length;

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
    // ✅ FIX: Return safe defaults for students instead of throwing error
    return {
      students: [],
      invitations: [],
      isLoading: false,
      error: null,
      totalStudents: 0,
      activeStudents: 0,
      pendingInvitations: 0,
      refreshStudents: async () => {},
      refreshInvitations: async () => {},
      refreshAll: async () => {},
      getStudentById: () => undefined,
      getStudentsByIds: () => [],
      searchStudents: () => [],
    };
  }
  
  return context;
}