// src/contexts/StudentsContext.tsx - NAPRAWIONY z stabilną referencją tablicy
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from 'react';
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
  const [studentsData, setStudentsData] = useState<TutorStudent[]>([]);
  const [invitations, setInvitations] = useState<RelationshipInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Stats from API
  const [statsFromAPI, setStatsFromAPI] = useState({
    totalStudents: 0,
    activeStudents: 0,
    pendingInvitations: 0
  });

  // ✅ STABILIZUJ referencję tablicy students
  const students = useMemo(() => {
    console.log('🔄 CONTEXT: Stabilizing students array reference');
    console.log('🔄 CONTEXT: studentsData length:', studentsData.length);
    console.log('🔄 CONTEXT: studentsData reference:', studentsData);
    return studentsData;
  }, [studentsData]);

  // ✅ STABILIZUJ funkcje callback
  const refreshStudents = useCallback(async () => {
    console.log('🔄 CONTEXT: refreshStudents called');
    if (!session.user?.id) {
      throw new Error('No authenticated user');
    }

    try {
      setError(null);
      const newStudentsData = await getTutorStudents(session.user.id);
      console.log('📥 CONTEXT: New students data loaded:', newStudentsData.length, 'students');
      setStudentsData(newStudentsData);
    } catch (err: any) {
      console.error('Error loading students:', err);
      setError(err.message || 'Failed to load students');
      throw err;
    }
  }, [session.user?.id]);

  const refreshInvitations = useCallback(async () => {
    if (!session.user?.id) {
      throw new Error('No authenticated user');
    }

    try {
      setError(null);
      const invitationsData = await getTutorInvitations(session.user.id);
      setInvitations(invitationsData);
    } catch (err: any) {
      console.error('Error loading invitations:', err);
      setError(err.message || 'Failed to load invitations');
      throw err;
    }
  }, [session.user?.id]);

  const refreshStats = useCallback(async () => {
    if (!session.user?.id) {
      return;
    }

    try {
      const stats = await getTutorStudentStats(session.user.id);
      setStatsFromAPI(stats);
    } catch (err: any) {
      console.error('Error loading stats:', err);
      // Don't set error for stats, they're not critical
    }
  }, [session.user?.id]);

  const refreshAll = useCallback(async () => {
    console.log('🔄 CONTEXT: refreshAll called');
    if (!session.isAuthenticated || session.user?.role !== 'tutor' || !session.user?.id) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        refreshStudents(),
        refreshInvitations(),
        refreshStats()
      ]);
    } catch (err: any) {
      console.error('Error loading students data:', err);
      setError(err.message || 'Failed to load students data');
    } finally {
      setIsLoading(false);
    }
  }, [refreshStudents, refreshInvitations, refreshStats, session.isAuthenticated, session.user?.role, session.user?.id]);

  // ✅ STABILIZUJ utility functions
  const getStudentById = useCallback((id: string): TutorStudent | undefined => {
    return students.find(student => student.student_id === id);
  }, [students]);

  const getStudentsByIds = useCallback((ids: string[]): TutorStudent[] => {
    return students.filter(student => ids.includes(student.student_id));
  }, [students]);

  const searchStudents = useCallback((query: string): TutorStudent[] => {
    if (!query.trim()) return students;
    
    const lowerQuery = query.toLowerCase();
    return students.filter(student => {
      const fullName = `${student.student_first_name} ${student.student_last_name}`.toLowerCase();
      const email = student.student_email.toLowerCase();
      return fullName.includes(lowerQuery) || email.includes(lowerQuery);
    });
  }, [students]);

  // Load data when tutor logs in
  useEffect(() => {
    console.log('🔄 CONTEXT: useEffect triggered', {
      isAuthenticated: session.isAuthenticated,
      role: session.user?.role,
      userId: session.user?.id
    });
    
    if (session.isAuthenticated && session.user?.role === 'tutor') {
      refreshAll();
    } else {
      // Clear data when not authenticated or not a tutor
      setStudentsData([]);
      setInvitations([]);
      setStatsFromAPI({ totalStudents: 0, activeStudents: 0, pendingInvitations: 0 });
      setError(null);
    }
  }, [session.isAuthenticated, session.user?.role, session.user?.id, refreshAll]);

  // Use stats from API if available, otherwise compute from local data
  const totalStudents = statsFromAPI.totalStudents || students.length;
  const activeStudents = statsFromAPI.activeStudents || students.filter(s => s.student_is_active).length;
  const pendingInvitations = statsFromAPI.pendingInvitations || invitations.filter(inv => 
    inv.status === 'pending' && new Date(inv.expires_at) > new Date()
  ).length;

  // ✅ STABILIZUJ cały value object
  const value = useMemo<StudentsContextType>(() => ({
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
  }), [
    students,
    invitations,
    isLoading,
    error,
    totalStudents,
    activeStudents,
    pendingInvitations,
    refreshStudents,
    refreshInvitations,
    refreshAll,
    getStudentById,
    getStudentsByIds,
    searchStudents,
  ]);

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