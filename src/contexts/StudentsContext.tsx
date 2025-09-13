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
  console.log('🎯 useEffect TRIGGERED');
  console.log('🎯 session.isAuthenticated:', session.isAuthenticated);
  console.log('🎯 session.user?.role:', session.user?.role);
  console.log('🎯 session.user?.id:', session.user?.id);
  
  if (session.isAuthenticated && session.user?.role === 'tutor') {
    console.log('✅ Conditions met, calling refreshAll...');
    refreshAll();
  } else {
    console.log('❌ Conditions not met, clearing data');
    setStudents([]);
    setInvitations([]);
    setStatsFromAPI({ totalStudents: 0, activeStudents: 0, pendingInvitations: 0 });
    setError(null);
  }
}, [session.isAuthenticated, session.user?.role, session.user?.id]);

const refreshStudents = async () => {
  console.log('🚀 refreshStudents START');
  
  if (!session.user?.id) {
    console.log('❌ No user ID');
    throw new Error('No authenticated user');
  }
  
  console.log('✅ User ID:', session.user.id);

  try {
    setError(null);
    console.log('🔄 Step 1: Starting refresh...');
    
    // Test basic function
    console.log('🔄 Step 2: Calling getTutorStudents...');
    const basicStudents = await getTutorStudents(session.user.id);
    console.log('📊 Step 3: getTutorStudents result:', basicStudents);
    console.log('📊 Step 3: Number of students:', basicStudents?.length);
    
    if (!basicStudents || basicStudents.length === 0) {
      console.log('❌ No students found, setting empty array');
      setStudents([]);
      return;
    }
    
    console.log('🔄 Step 4: Removing duplicates...');
    const uniqueStudents = basicStudents.filter((student, index, self) => 
      index === self.findIndex(s => s.student_id === student.student_id)
    );
    console.log('📊 Step 5: Unique students:', uniqueStudents.length);
    
    // SUPER SIMPLE VERSION - just set students with basic info first
    console.log('🔄 Step 6: Creating students with basic stats...');
    const studentsWithBasicStats = uniqueStudents.map((student, index) => {
      const basic = {
        ...student,
        level: `Test Level ${index + 1}`,
        progress: 50 + (index * 10),
        lessonsCompleted: index + 1,
        totalHours: (index + 1) * 2
      };
      console.log(`📊 Student ${index + 1}:`, basic);
      return basic;
    });
    
    console.log('🔄 Step 7: Setting students state...');
    console.log('📊 Final students array:', studentsWithBasicStats);
    setStudents(studentsWithBasicStats);
    console.log('✅ Step 8: setStudents called successfully');
    
  } catch (err: any) {
    console.error('❌ ERROR in refreshStudents:', err);
    console.error('❌ Error stack:', err.stack);
    setError(err.message || 'Failed to load students');
    throw err;
  }
  
  console.log('🏁 refreshStudents END');
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

// const debugAndFixLessons = (async () => {
//   try {
//     console.log('🔍 Checking database tables...');
    
//     // Import supabase
//     const { supabase } = await import('/src/lib/supabase.js');
    
//     // Check current user
//     const { data: { user } } = await supabase.auth.getUser();
//     console.log('👤 Current user:', user?.id);
    
//     if (user) {
//       // 1. Check tutor's lessons
//       const { data: lessons } = await supabase
//         .from('lessons')
//         .select('id, title, status')
//         .eq('tutor_id', user.id);
//       console.log('📚 Tutor lessons:', lessons);
      
//       // 2. Check student_lessons table
//       const { data: studentLessons } = await supabase
//         .from('student_lessons')
//         .select('*')
//         .limit(10);
//       console.log('📋 Student lessons table:', studentLessons);
      
//       // 3. Check students
//       const { data: students } = await supabase
//         .from('user_relationships')
//         .select('student_id')
//         .eq('tutor_id', user.id)
//         .eq('is_active', true);
//       console.log('👥 Students:', students);
      
//       // 4. If we have lessons and students but no assignments, create them
//       if (lessons && students && lessons.length > 0 && students.length > 0) {
//         const assignments = studentLessons?.filter(sl => 
//           lessons.some(l => l.id === sl.lesson_id) && 
//           students.some(s => s.student_id === sl.student_id)
//         ) || [];
        
//         console.log('🎯 Existing assignments for this tutor:', assignments);
        
//         if (assignments.length === 0) {
//           console.log('⚠️ NO ASSIGNMENTS FOUND! Creating test assignments...');
          
//           const testAssignments = [];
//           for (const student of students.slice(0, 2)) { // Max 2 students
//             for (const lesson of lessons.slice(0, 3)) { // Max 3 lessons
//               testAssignments.push({
//                 student_id: student.student_id,
//                 lesson_id: lesson.id,
//                 status: 'completed',
//                 progress: 75 + Math.floor(Math.random() * 20), // 75-95%
//                 time_spent: 60 + Math.floor(Math.random() * 60), // 60-120 minutes
//                 score: 80 + Math.floor(Math.random() * 15) // 80-95 score
//               });
//             }
//           }
          
//           const { data: created, error } = await supabase
//             .from('student_lessons')
//             .insert(testAssignments)
//             .select();
          
//           if (error) {
//             console.error('❌ Error creating assignments:', error);
//           } else {
//             console.log('✅ Created test assignments:', created);
//             console.log('🔄 Now refresh the Students page to see the changes!');
//           }
//         }
//       }
//     }
//   } catch (error) {
//     console.error('❌ Debug error:', error);
//   }
// })();
