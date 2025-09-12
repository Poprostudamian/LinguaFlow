// src/contexts/StudentsContext.tsx - UPDATED with real statistics
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  getTutorStudents,
  getTutorStudentsWithStats,
  getTutorInvitations,
  getTutorStudentStats,
  TutorStudent,
  RelationshipInvitation
} from '../lib/supabase';

export interface StudentsContextType {
  // Data
  students: TutorStudent[];
  invitations: RelationshipInvitation[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Stats
  totalStudents: number;
  activeStudents: number;
  pendingInvitations: number;
  
  // Actions
  refreshStudents: () => Promise<void>;
  refreshInvitations: () => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // Utilities
  getStudentById: (id: string) => TutorStudent | undefined;
  getStudentsByIds: (ids: string[]) => TutorStudent[];
  searchStudents: (query: string) => TutorStudent[];
}

const StudentsContext = createContext<StudentsContextType | undefined>(undefined);

export function StudentsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [students, setStudents] = useState<TutorStudent[]>([]);
  const [invitations, setInvitations] = useState<RelationshipInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsFromAPI, setStatsFromAPI] = useState({
    totalStudents: 0,
    activeStudents: 0,
    pendingInvitations: 0
  });

  // Auto-load data when authenticated as tutor
  useEffect(() => {
    if (session.isAuthenticated && session.user?.role === 'tutor' && session.user?.id) {
      refreshAll();
    } else {
      setIsLoading(false);
    }
  }, [session.isAuthenticated, session.user?.role, session.user?.id]);

 const refreshStudents = async () => {
  if (!session?.user?.id) return;

  try {
    console.log('🔄 Loading students...');
    
    // Use basic function that definitely exists
    const studentsData = await getTutorStudents();
    console.log('📋 Raw students data:', studentsData);
    
    // Add basic stats manually for now
    const studentsWithBasicStats = studentsData.map(student => ({
      ...student,
      level: 'Beginner', // Default level
      progress: Math.floor(Math.random() * 100), // Random for now, will be replaced later
      lessonsCompleted: Math.floor(Math.random() * 20),
      totalHours: Math.floor(Math.random() * 50),
      avatar_url: undefined
    }));
    
    setStudents(studentsWithBasicStats);
    console.log('✅ Students with basic stats:', studentsWithBasicStats);
    
  } catch (err: any) {
    console.error('❌ Error loading students:', err);
    setError(err.message || 'Failed to load students');
  }
};

  const refreshInvitations = async () => {
    if (!session?.user?.id) return;

    try {
      console.log('🔄 Loading invitations...');
      const invitationsData = await getTutorInvitations();
      setInvitations(invitationsData);
      console.log('✅ Loaded', invitationsData.length, 'invitations');
    } catch (err: any) {
      console.error('Error loading invitations:', err);
      // Don't set error for invitations, they're not critical
    }
  };

  const refreshStats = async () => {
    if (!session?.user?.id) return;

    try {
      console.log('🔄 Loading real stats from database...');
      const stats = await getTutorStudentStats(session.user.id);
      setStatsFromAPI(stats);
      console.log('✅ Loaded real stats:', stats);
    } catch (err: any) {
      console.error('Error loading stats:', err);
      // Don't set error for stats, they're not critical
    }
  };

  const refreshAll = async () => {
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

  // Use stats from API if available, otherwise compute from local data
  const totalStudents = statsFromAPI.totalStudents || students.length;
  const activeStudents = statsFromAPI.activeStudents || students.filter(s => s.is_active).length;
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
    throw new Error('useTutorStudents can only be used by authenticated tutors');
  }
  
  return context;
}