// src/contexts/StudentsContext.tsx - UPDATED with real statistics
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  supabase,
  getTutorStudents, 
  getTutorInvitations, 
  getTutorStudentStats,
  searchTutorStudents,
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
  if (!session.user?.id) {
    throw new Error('No authenticated user');
  }

  try {
    setError(null);
    console.log('🔄 Loading students with REAL data from database...');
    
    // Get basic students
    const basicStudents = await getTutorStudents(session.user.id);
    console.log('📊 Basic students from DB:', basicStudents);
    
    // Remove duplicates
    const uniqueStudents = basicStudents.filter((student, index, self) => 
      index === self.findIndex(s => s.student_id === student.student_id)
    );
    
    // Try to get real statistics from the same system as Dashboard
    try {
      console.log('📊 Attempting to get real stats using Dashboard system...');
      const { getTutorStudentsWithRealStats } = await import('../lib/studentStats');
      
      if (typeof getTutorStudentsWithRealStats === 'function') {
        const studentsWithRealStats = await getTutorStudentsWithRealStats(session.user.id);
        console.log('📊 Real stats from Dashboard system:', studentsWithRealStats);
        
        if (studentsWithRealStats && studentsWithRealStats.length > 0) {
          // Convert Dashboard format to StudentsContext format
          const convertedStudents = studentsWithRealStats.map(student => ({
            relationship_id: student.id,
            tutor_id: session.user.id,
            tutor_first_name: '',
            tutor_last_name: '',
            student_id: student.id,
            student_first_name: student.name.split(' ')[0] || 'Student',
            student_last_name: student.name.split(' ').slice(1).join(' ') || '',
            student_email: student.email,
            relationship_created: student.joinedDate,
            is_active: true,
            // REAL STATS from Dashboard system
            level: student.level,
            progress: student.progress,
            lessonsCompleted: student.lessonsCompleted,
            totalHours: student.totalHours
          }));
          
          console.log('✅ SUCCESS: Using real stats from Dashboard system:', convertedStudents);
          setStudents(convertedStudents);
          return;
        }
      }
    } catch (statsError) {
      console.log('⚠️ Could not get stats from Dashboard system:', statsError);
    }
    
    // Fallback: Calculate basic stats from lesson assignments
    console.log('📊 Fallback: Calculating basic stats from student_lessons...');
    const studentsWithCalculatedStats = await Promise.all(
      uniqueStudents.map(async (student) => {
        try {
          // Try to get lessons assigned to this student
          const { supabase } = await import('../lib/supabase');
          const { data: studentLessons } = await supabase
            .from('student_lessons')
            .select('status, progress, time_spent')
            .eq('student_id', student.student_id);
          
          if (studentLessons && studentLessons.length > 0) {
            const completedLessons = studentLessons.filter(l => l.status === 'completed').length;
            const avgProgress = Math.round(
              studentLessons.reduce((sum, l) => sum + (l.progress || 0), 0) / studentLessons.length
            );
            const totalMinutes = studentLessons.reduce((sum, l) => sum + (l.time_spent || 0), 0);
            const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
            
            return {
              ...student,
              level: avgProgress >= 80 ? 'Advanced' : avgProgress >= 50 ? 'Intermediate' : 'Beginner',
              progress: avgProgress,
              lessonsCompleted: completedLessons,
              totalHours: totalHours
            };
          }
        } catch (lessonError) {
          console.log('⚠️ Could not get lessons for student:', student.student_id, lessonError);
        }
        
        // Default stats if no lessons found
        return {
          ...student,
          level: 'Not set',
          progress: 0,
          lessonsCompleted: 0,
          totalHours: 0
        };
      })
    );
    
    console.log('✅ Final students with calculated stats:', studentsWithCalculatedStats);
    setStudents(studentsWithCalculatedStats);
    
  } catch (err: any) {
    console.error('❌ Error loading students:', err);
    setError(err.message || 'Failed to load students');
    throw err;
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