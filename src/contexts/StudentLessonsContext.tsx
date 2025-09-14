// CAŁKOWITA NAPRAWA src/contexts/StudentLessonsContext.tsx
// Zastąp cały plik tym kodem:

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  getStudentLessons, 
  startStudentLesson, 
  updateLessonProgress,
  completeStudentLesson 
} from '../lib/supabase';

// Types for student lessons
export interface StudentLessonData {
  id: string;
  student_id: string;
  lesson_id: string;
  assigned_at: string;
  started_at: string | null;
  completed_at: string | null;
  status: 'assigned' | 'in_progress' | 'completed';
  score: number | null;
  time_spent: number;
  progress: number;
  lessons: {
    id: string;
    title: string;
    description: string | null;
    content: string;
    status: 'draft' | 'published';
    created_at: string;
    updated_at: string;
    tutor_id: string;
    users: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

export interface StudentLessonsStats {
  totalLessons: number;
  upcomingLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  completionRate: number;
  averageScore: number;
  totalStudyTime: number;
}

interface StudentLessonsContextType {
  lessons: StudentLessonData[];
  stats: StudentLessonsStats;
  isLoading: boolean;
  error: string | null;
  refreshLessons: () => Promise<void>;
  
  // Utility functions
  getLessonsByStatus: (status: string) => StudentLessonData[];
  searchLessons: (query: string) => StudentLessonData[];
  startLesson: (lessonId: string) => Promise<void>;
  updateProgress: (lessonId: string, progress: number) => Promise<void>;
}

const StudentLessonsContext = createContext<StudentLessonsContextType | undefined>(undefined);

export function useStudentLessons() {
  const context = useContext(StudentLessonsContext);
  if (context === undefined) {
    throw new Error('useStudentLessons must be used within a StudentLessonsProvider');
  }
  return context;
}

export function StudentLessonsProvider({ children }: { children: React.ReactNode }) {
  const [lessons, setLessons] = useState<StudentLessonData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  // Calculate stats from lessons data
  const stats: StudentLessonsStats = React.useMemo(() => {
    const totalLessons = lessons.length;
    const completedLessons = lessons.filter(l => l.status === 'completed').length;
    const inProgressLessons = lessons.filter(l => l.status === 'in_progress').length;
    const upcomingLessons = lessons.filter(l => l.status === 'assigned').length;
    
    const completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    
    const scores = lessons.filter(l => l.score !== null).map(l => l.score!);
    const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    
    const totalStudyTime = lessons.reduce((total, lesson) => total + lesson.time_spent, 0);

    return {
      totalLessons,
      upcomingLessons,
      completedLessons,
      inProgressLessons,
      completionRate,
      averageScore,
      totalStudyTime
    };
  }, [lessons]);

  // Load lessons from database - UPROSZCZONA WERSJA BEZ testStudentLessonsAccess
  const refreshLessons = async () => {
    if (!session?.user?.id) {
      console.log('❌ No authenticated user, skipping lessons load');
      setError('Not authenticated');
      return;
    }

    console.log('🔄 Starting lesson refresh for user:', session.user.id, 'role:', session.user.role);
    setIsLoading(true);
    setError(null);

    try {
      // Sprawdź czy user ma rolę student
      if (session.user.role !== 'student') {
        throw new Error(`Invalid role: ${session.user.role}. Expected: student`);
      }

      console.log('🔍 Loading lessons for student:', session.user.id);
      const studentLessons = await getStudentLessons(session.user.id);
      
      console.log('✅ Loaded', studentLessons.length, 'lessons');
      
      if (studentLessons.length === 0) {
        console.log('ℹ️ No lessons found - this might be normal for new students');
      } else {
        console.log('📋 Sample lesson:', studentLessons[0]);
      }
      
      setLessons(studentLessons);
      setError(null);
    } catch (err: any) {
      console.error('❌ Error loading student lessons:', err);
      
      let errorMessage = 'Failed to load lessons';
      
      if (err.message?.includes('infinite recursion')) {
        errorMessage = 'Database configuration error - please run the RLS fix SQL';
      } else if (err.message?.includes('RLS') || err.message?.includes('policies')) {
        errorMessage = 'Access denied - database policies need to be fixed';
      } else if (err.message?.includes('not authenticated')) {
        errorMessage = 'Please log in again';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLessons([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load lessons when component mounts or user changes
  useEffect(() => {
    if (session?.user?.id && session.user.role === 'student') {
      refreshLessons();
    }
  }, [session?.user?.id, session?.user?.role]);

  // Utility functions
  const getLessonsByStatus = (status: string): StudentLessonData[] => {
    if (status === 'all') return lessons;
    return lessons.filter(lesson => lesson.status === status);
  };

  const searchLessons = (query: string): StudentLessonData[] => {
    if (!query.trim()) return lessons;
    
    const lowerQuery = query.toLowerCase();
    return lessons.filter(lesson => {
      const title = lesson.lessons.title.toLowerCase();
      const tutorName = `${lesson.lessons.users.first_name} ${lesson.lessons.users.last_name}`.toLowerCase();
      const description = (lesson.lessons.description || '').toLowerCase();
      
      return title.includes(lowerQuery) || 
             tutorName.includes(lowerQuery) || 
             description.includes(lowerQuery);
    });
  };

  const startLesson = async (lessonId: string): Promise<void> => {
    if (!session?.user?.id) throw new Error('Not authenticated');

    try {
      console.log('Starting lesson:', lessonId);
      await startStudentLesson(session.user.id, lessonId);
      
      // Refresh lessons after starting
      await refreshLessons();
    } catch (error) {
      console.error('Error starting lesson:', error);
      throw error;
    }
  };

  const updateProgress = async (lessonId: string, progress: number): Promise<void> => {
    if (!session?.user?.id) throw new Error('Not authenticated');

    try {
      console.log('Updating progress for lesson:', lessonId, 'to', progress);
      await updateLessonProgress(session.user.id, lessonId, progress);
      
      // Refresh lessons after updating
      await refreshLessons();
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  };

  const value: StudentLessonsContextType = {
    lessons,
    stats,
    isLoading,
    error,
    refreshLessons,
    getLessonsByStatus,
    searchLessons,
    startLesson,
    updateProgress
  };

  return (
    <StudentLessonsContext.Provider value={value}>
      {children}
    </StudentLessonsContext.Provider>
  );
}