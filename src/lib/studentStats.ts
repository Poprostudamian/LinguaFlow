// src/lib/studentStats.ts - API dla prawdziwych statystyk z bazy

import { supabase } from './supabase';

export interface StudentWithRealStats {
  id: string;
  name: string;
  email: string;
  level: string;
  progress: number; // średni wynik z lekcji
  lessonsCompleted: number;
  totalHours: number;
  joinedDate: string;
  lastActivity: string | null;
  totalLessons: number;
  inProgressLessons: number;
}

export interface TutorKPIs {
  totalStudents: number;
  activeLessons: number;
  teachingHours: number;
  activeStudents: number;
  completionRate: number;
}

// Pobierz studentów tutora z prawdziwymi statystykami z bazy
export async function getTutorStudentsWithRealStats(tutorId: string): Promise<StudentWithRealStats[]> {
  try {
    // Pobierz relacje tutor-student
    const { data: tutorStudents, error: relationError } = await supabase
      .from('tutor_students')
      .select(`
        created_at,
        users!student_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('tutor_id', tutorId)
      .eq('is_active', true);

    if (relationError) throw relationError;

    if (!tutorStudents || tutorStudents.length === 0) {
      return [];
    }

    // Dla każdego studenta pobierz statystyki z lekcji
    const studentsWithStats = await Promise.all(
      tutorStudents.map(async (relation: any) => {
        const student = relation.users;
        
        // Pobierz wszystkie przypisane lekcje studenta
        const { data: lessonStats } = await supabase
          .from('student_lessons')
          .select('status, score, progress, time_spent, completed_at, assigned_at')
          .eq('student_id', student.id);

        // Oblicz statystyki
        const totalLessons = lessonStats?.length || 0;
        const completedLessons = lessonStats?.filter(l => l.status === 'completed').length || 0;
        const inProgressLessons = lessonStats?.filter(l => l.status === 'in_progress').length || 0;
        
        // Całkowity czas nauki w minutach i godzinach
        const totalMinutes = lessonStats?.reduce((acc, l) => acc + (l.time_spent || 0), 0) || 0;
        const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

        // Średni wynik tylko z ukończonych lekcji
        const completedScores = lessonStats?.filter(l => l.score !== null && l.score > 0).map(l => l.score) || [];
        const averageScore = completedScores.length > 0 
          ? Math.round(completedScores.reduce((acc, score) => acc + score, 0) / completedScores.length)
          : 0;

        // Ostatnia aktywność
        const activities = lessonStats?.filter(l => l.completed_at || l.assigned_at)
          .map(l => new Date(l.completed_at || l.assigned_at))
          .sort((a, b) => b.getTime() - a.getTime()) || [];
        
        const lastActivity = activities.length > 0 ? activities[0].toISOString() : null;

        // Określ poziom na podstawie wyników i ilości lekcji
        const level = determineLevelFromStats(averageScore, completedLessons, totalLessons);

        return {
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          email: student.email,
          level: level,
          progress: averageScore,
          lessonsCompleted: completedLessons,
          totalHours: totalHours,
          joinedDate: relation.created_at,
          lastActivity: lastActivity,
          totalLessons: totalLessons,
          inProgressLessons: inProgressLessons
        };
      })
    );

    return studentsWithStats;
  } catch (error) {
    console.error('Error fetching students with real stats:', error);
    throw error;
  }
}

// Pobierz KPI tutora z prawdziwymi danymi
export async function getTutorRealKPIs(tutorId: string): Promise<TutorKPIs> {
  try {
    // Liczba studentów
    const { count: totalStudents } = await supabase
      .from('tutor_students')
      .select('*', { count: 'exact', head: true })
      .eq('tutor_id', tutorId)
      .eq('is_active', true);

    // Liczba opublikowanych lekcji
    const { count: activeLessons } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('tutor_id', tutorId)
      .eq('is_published', true);

    // Studenci z przynajmniej jedną lekcją
    const { data: activeStudentData } = await supabase
      .from('student_lessons')
      .select('student_id')
      .in('lesson_id', 
        supabase
          .from('lessons')
          .select('id')
          .eq('tutor_id', tutorId)
      );

    const activeStudents = new Set(activeStudentData?.map(s => s.student_id)).size;

    // Całkowite godziny nauczania
    const { data: completedLessons } = await supabase
      .from('student_lessons')
      .select('time_spent')
      .eq('status', 'completed')
      .in('lesson_id',
        supabase
          .from('lessons')
          .select('id')
          .eq('tutor_id', tutorId)
      );

    const totalMinutes = completedLessons?.reduce((acc, l) => acc + (l.time_spent || 0), 0) || 0;
    const teachingHours = Math.round(totalMinutes / 60 * 10) / 10;

    // Współczynnik ukończenia lekcji
    const { data: allAssignments } = await supabase
      .from('student_lessons')
      .select('status')
      .in('lesson_id',
        supabase
          .from('lessons')
          .select('id')
          .eq('tutor_id', tutorId)
      );

    const totalAssignments = allAssignments?.length || 0;
    const completedAssignments = allAssignments?.filter(a => a.status === 'completed').length || 0;
    const completionRate = totalAssignments > 0 
      ? Math.round((completedAssignments / totalAssignments) * 100)
      : 0;

    return {
      totalStudents: totalStudents || 0,
      activeLessons: activeLessons || 0,
      teachingHours: teachingHours,
      activeStudents: activeStudents,
      completionRate: completionRate
    };
  } catch (error) {
    console.error('Error fetching tutor KPIs:', error);
    throw error;
  }
}

// Funkcja do określenia poziomu studenta
function determineLevelFromStats(averageScore: number, completedLessons: number, totalLessons: number): string {
  if (completedLessons === 0) return 'Beginner';
  
  const completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  
  if (completedLessons >= 10 && averageScore >= 85) return 'Advanced';
  if (completedLessons >= 5 && averageScore >= 70) return 'Intermediate';
  if (completionRate >= 50 && averageScore >= 60) return 'Intermediate';
  
  return 'Beginner';
}

// Hook do używania w komponentach
export function useRealTutorData(tutorId: string | undefined) {
  const [students, setStudents] = React.useState<StudentWithRealStats[]>([]);
  const [kpis, setKpis] = React.useState<TutorKPIs>({
    totalStudents: 0,
    activeLessons: 0,
    teachingHours: 0,
    activeStudents: 0,
    completionRate: 0
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    if (!tutorId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [studentsData, kpisData] = await Promise.all([
        getTutorStudentsWithRealStats(tutorId),
        getTutorRealKPIs(tutorId)
      ]);

      setStudents(studentsData);
      setKpis(kpisData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [tutorId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    students,
    kpis,
    isLoading,
    error,
    refreshData: loadData
  };
}

// Import React for hook
import React from 'react';