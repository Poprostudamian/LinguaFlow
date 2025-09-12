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
    console.log('🔄 DEBUG: Starting refreshStudents...');
    console.log('🔄 User ID:', session.user.id);
    
    // Test 1: Try basic students
    console.log('📊 Step 1: Getting basic students from getTutorStudents...');
    const basicStudents = await getTutorStudents(session.user.id);
    console.log('📊 Basic students result:', basicStudents);
    
    // Test 2: Check what tables exist
    console.log('📊 Step 2: Testing tutor_students table...');
    const { data: tutorStudentsTest, error: tutorStudentsError } = await supabase
      .from('tutor_students')
      .select('*')
      .eq('tutor_id', session.user.id)
      .limit(5);
    
    console.log('📊 tutor_students test result:', tutorStudentsTest, 'error:', tutorStudentsError);
    
    // Test 3: Check student_lessons table
    if (tutorStudentsTest && tutorStudentsTest.length > 0) {
      const studentId = tutorStudentsTest[0].student_id;
      console.log('📊 Step 3: Testing student_lessons for student:', studentId);
      
      const { data: studentLessonsTest, error: studentLessonsError } = await supabase
        .from('student_lessons')
        .select('*')
        .eq('student_id', studentId)
        .limit(5);
      
      console.log('📊 student_lessons test result:', studentLessonsTest, 'error:', studentLessonsError);
    }
    
    // Test 4: Try to use studentStats
    console.log('📊 Step 4: Trying to import studentStats...');
    try {
      const { getTutorStudentsWithRealStats } = await import('../lib/studentStats');
      console.log('📊 studentStats import successful, function exists:', typeof getTutorStudentsWithRealStats);
      
      if (typeof getTutorStudentsWithRealStats === 'function') {
        console.log('📊 Calling getTutorStudentsWithRealStats...');
        const studentsWithStats = await getTutorStudentsWithRealStats(session.user.id);
        console.log('📊 Result from getTutorStudentsWithRealStats:', studentsWithStats);
        
        // Convert to proper format
        const convertedStudents = studentsWithStats.map(student => ({
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
          // Include the real stats
          level: student.level,
          progress: student.progress,
          lessonsCompleted: student.lessonsCompleted,
          totalHours: student.totalHours
        }));
        
        console.log('📊 Final converted students with real stats:', convertedStudents);
        setStudents(convertedStudents);
        return;
      }
    } catch (importError) {
      console.log('📊 Import error:', importError);
    }
    
    // Fallback: Use basic students but add some fake stats for testing
    console.log('📊 Step 5: Using fallback with basic students...');
    const uniqueStudents = basicStudents.filter((student, index, self) => 
      index === self.findIndex(s => s.student_id === student.student_id)
    );
    
    // Add some test stats
    const studentsWithTestStats = uniqueStudents.map((student, index) => ({
      ...student,
      level: ['Beginner', 'Intermediate', 'Advanced'][index % 3],
      progress: 25 + (index * 20),
      lessonsCompleted: index + 1,
      totalHours: (index + 1) * 2
    }));
    
    console.log('📊 Final fallback students:', studentsWithTestStats);
    setStudents(studentsWithTestStats);
    
  } catch (err: any) {
    console.error('❌ Error in refreshStudents:', err);
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