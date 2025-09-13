// src/lib/studentLessons.ts - API dla lekcji studenta
import { supabase } from './supabase';

export interface StudentLesson {
  id: string;
  student_id: string;
  lesson_id: string;
  assigned_at: string;
  started_at: string | null;
  completed_at: string | null;
  status: 'assigned' | 'in_progress' | 'completed';
  score: number | null;
  time_spent: number; // w minutach
  progress: number; // 0-100
  updated_at: string;
  // Dane lekcji z join
  lesson: {
    id: string;
    title: string;
    description: string | null;
    content: string;
    created_at: string;
    tutor_id: string;
    // Dane tutora z join
    tutor: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

export interface StudentLessonStats {
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  assignedLessons: number;
  averageScore: number;
  totalStudyTime: number; // w minutach
  averageProgress: number;
  longestStreak: number;
  currentStreak: number;
}

/**
 * Pobierz wszystkie lekcje przypisane do studenta
 */
export async function getStudentLessons(studentId: string): Promise<StudentLesson[]> {
  try {
    const { data, error } = await supabase
      .from('student_lessons')
      .select(`
        id,
        student_id,
        lesson_id,
        assigned_at,
        started_at,
        completed_at,
        status,
        score,
        time_spent,
        progress,
        updated_at,
        lessons!inner (
          id,
          title,
          description,
          content,
          created_at,
          tutor_id,
          users!lessons_tutor_id_fkey (
            first_name,
            last_name,
            email
          )
        )
      `)
      .eq('student_id', studentId)
      .order('assigned_at', { ascending: false });

    if (error) throw error;

    // Transform data to match interface
    return (data || []).map(item => ({
      id: item.id,
      student_id: item.student_id,
      lesson_id: item.lesson_id,
      assigned_at: item.assigned_at,
      started_at: item.started_at,
      completed_at: item.completed_at,
      status: item.status as 'assigned' | 'in_progress' | 'completed',
      score: item.score,
      time_spent: item.time_spent,
      progress: item.progress,
      updated_at: item.updated_at,
      lesson: {
        id: item.lessons.id,
        title: item.lessons.title,
        description: item.lessons.description,
        content: item.lessons.content,
        created_at: item.lessons.created_at,
        tutor_id: item.lessons.tutor_id,
        tutor: {
          first_name: item.lessons.users.first_name,
          last_name: item.lessons.users.last_name,
          email: item.lessons.users.email
        }
      }
    }));
  } catch (error) {
    console.error('Error fetching student lessons:', error);
    throw error;
  }
}

/**
 * Pobierz statystyki lekcji studenta
 */
export async function getStudentLessonStats(studentId: string): Promise<StudentLessonStats> {
  try {
    const lessons = await getStudentLessons(studentId);
    
    const totalLessons = lessons.length;
    const completedLessons = lessons.filter(l => l.status === 'completed').length;
    const inProgressLessons = lessons.filter(l => l.status === 'in_progress').length;
    const assignedLessons = lessons.filter(l => l.status === 'assigned').length;
    
    // Oblicz średnią ocenę z ukończonych lekcji
    const completedWithScores = lessons.filter(l => l.status === 'completed' && l.score !== null);
    const averageScore = completedWithScores.length > 0 
      ? Math.round(completedWithScores.reduce((sum, l) => sum + (l.score || 0), 0) / completedWithScores.length)
      : 0;
    
    // Oblicz całkowity czas nauki
    const totalStudyTime = lessons.reduce((sum, l) => sum + l.time_spent, 0);
    
    // Oblicz średni postęp
    const averageProgress = totalLessons > 0 
      ? Math.round(lessons.reduce((sum, l) => sum + l.progress, 0) / totalLessons)
      : 0;
    
    // Oblicz streak (uproszczony algorytm)
    const sortedByDate = lessons
      .filter(l => l.status === 'completed')
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime());
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = new Date();
    for (let i = 0; i < sortedByDate.length; i++) {
      const completedDate = new Date(sortedByDate[i].completed_at!);
      const daysDiff = Math.floor((today.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (i === 0 && daysDiff <= 1) {
        currentStreak = 1;
        tempStreak = 1;
      } else if (i > 0) {
        const prevDate = new Date(sortedByDate[i-1].completed_at!);
        const daysBetween = Math.floor((prevDate.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysBetween <= 1) {
          tempStreak++;
          if (i === 0 || currentStreak > 0) currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
          if (i === 0) currentStreak = 0;
        }
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
    
    return {
      totalLessons,
      completedLessons,
      inProgressLessons,
      assignedLessons,
      averageScore,
      totalStudyTime,
      averageProgress,
      longestStreak,
      currentStreak
    };
  } catch (error) {
    console.error('Error calculating student lesson stats:', error);
    throw error;
  }
}

/**
 * Rozpocznij lekcję (zmień status na 'in_progress')
 */
export async function startLesson(studentId: string, lessonId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('student_lessons')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('student_id', studentId)
      .eq('lesson_id', lessonId);

    if (error) throw error;
  } catch (error) {
    console.error('Error starting lesson:', error);
    throw error;
  }
}

/**
 * Aktualizuj postęp w lekcji
 */
export async function updateLessonProgress(
  studentId: string, 
  lessonId: string, 
  progress: number,
  timeSpent?: number
): Promise<void> {
  try {
    const updateData: any = {
      progress: Math.max(0, Math.min(100, progress)), // Ogranicz do 0-100
      updated_at: new Date().toISOString()
    };

    if (timeSpent !== undefined) {
      updateData.time_spent = timeSpent;
    }

    // Automatycznie zmień status na 'in_progress' jeśli był 'assigned'
    if (progress > 0) {
      const { data: currentLesson } = await supabase
        .from('student_lessons')
        .select('status')
        .eq('student_id', studentId)
        .eq('lesson_id', lessonId)
        .single();

      if (currentLesson?.status === 'assigned') {
        updateData.status = 'in_progress';
        updateData.started_at = new Date().toISOString();
      }
    }

    const { error } = await supabase
      .from('student_lessons')
      .update(updateData)
      .eq('student_id', studentId)
      .eq('lesson_id', lessonId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    throw error;
  }
}

/**
 * Ukończ lekcję z oceną
 */
export async function completeLesson(
  studentId: string, 
  lessonId: string, 
  score: number,
  totalTimeSpent: number
): Promise<void> {
  try {
    const { error } = await supabase
      .from('student_lessons')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        score: Math.max(0, Math.min(100, score)), // Ogranicz do 0-100
        progress: 100,
        time_spent: totalTimeSpent,
        updated_at: new Date().toISOString()
      })
      .eq('student_id', studentId)
      .eq('lesson_id', lessonId);

    if (error) throw error;
  } catch (error) {
    console.error('Error completing lesson:', error);
    throw error;
  }
}

/**
 * Przeszukaj lekcje studenta
 */
export async function searchStudentLessons(
  studentId: string, 
  query: string
): Promise<StudentLesson[]> {
  try {
    const allLessons = await getStudentLessons(studentId);
    
    if (!query.trim()) {
      return allLessons;
    }
    
    const searchTerm = query.toLowerCase().trim();
    
    return allLessons.filter(lesson => 
      lesson.lesson.title.toLowerCase().includes(searchTerm) ||
      lesson.lesson.description?.toLowerCase().includes(searchTerm) ||
      `${lesson.lesson.tutor.first_name} ${lesson.lesson.tutor.last_name}`.toLowerCase().includes(searchTerm)
    );
  } catch (error) {
    console.error('Error searching student lessons:', error);
    throw error;
  }
}

/**
 * Hook do używania w React komponencie
 */
export function useStudentLessons(studentId: string | undefined) {
  const [lessons, setLessons] = React.useState<StudentLesson[]>([]);
  const [stats, setStats] = React.useState<StudentLessonStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refreshLessons = React.useCallback(async () => {
    if (!studentId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [lessonsData, statsData] = await Promise.all([
        getStudentLessons(studentId),
        getStudentLessonStats(studentId)
      ]);
      
      setLessons(lessonsData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Error loading student lessons:', err);
      setError(err.message || 'Failed to load lessons');
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  React.useEffect(() => {
    refreshLessons();
  }, [refreshLessons]);

  return {
    lessons,
    stats,
    isLoading,
    error,
    refreshLessons
  };
}