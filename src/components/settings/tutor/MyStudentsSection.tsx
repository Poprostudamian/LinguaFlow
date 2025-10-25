// src/components/settings/tutor/MyStudentsSection.tsx
import React, { useState, useEffect } from 'react';
import { Users, MessageCircle, User, BookOpen, CheckCircle, Clock } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  is_active: boolean;
  assigned_lessons: number;
  completed_lessons: number;
  in_progress_lessons: number;
}

export function MyStudentsSection() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, [session]);

  const fetchStudents = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);

      // Fetch students from tutor_students table
      const { data: relationships, error: relationshipsError } = await supabase
        .from('tutor_students')
        .select(`
          student_id,
          is_active,
          users:student_id (
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq('tutor_id', session.user.id);

      if (relationshipsError) throw relationshipsError;

      // Get lesson statistics for each student
      const studentsWithStats = await Promise.all(
        (relationships || []).map(async (rel: any) => {
          // Count assigned lessons
          const { count: assignedCount } = await supabase
            .from('student_lessons')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', rel.student_id);

          // Count completed lessons
          const { count: completedCount } = await supabase
            .from('student_lessons')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', rel.student_id)
            .eq('status', 'completed');

          // Count in-progress lessons
          const { count: inProgressCount } = await supabase
            .from('student_lessons')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', rel.student_id)
            .eq('status', 'in_progress');

          return {
            id: rel.users.id,
            first_name: rel.users.first_name,
            last_name: rel.users.last_name,
            email: rel.users.email,
            avatar_url: rel.users.avatar_url,
            is_active: rel.is_active,
            assigned_lessons: assignedCount || 0,
            completed_lessons: completedCount || 0,
            in_progress_lessons: inProgressCount || 0,
          };
        })
      );

      setStudents(studentsWithStats);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = (studentId: string) => {
    navigate('/tutor/messages', { state: { startConversationWith: studentId } });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 flex items-center justify-center">
          <Users className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t.tutorSettings?.studentsSection?.title || 'My Students'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.tutorSettings?.studentsSection?.description || 'Students you are currently teaching'}
          </p>
        </div>
      </div>

      {/* Students List */}
      {students.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t.tutorSettings?.studentsSection?.noStudents || "You don't have any students yet"}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.tutorSettings?.studentsSection?.noStudentsDescription || 'Students will appear here once they accept your invitation'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {students.map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {/* Student Info */}
              <div className="flex items-center space-x-4 flex-1">
                {/* Avatar */}
                {student.avatar_url ? (
                  <img
                    src={student.avatar_url}
                    alt={`${student.first_name} ${student.last_name}`}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-pink-100 dark:ring-pink-900"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center ring-2 ring-pink-100 dark:ring-pink-900">
                    <User className="h-6 w-6 text-white" />
                  </div>
                )}

                {/* Name and Stats */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {student.first_name} {student.last_name}
                    </h4>
                    {student.is_active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t.tutorSettings?.studentsSection?.active || 'Active'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {t.tutorSettings?.studentsSection?.inactive || 'Inactive'}
                      </span>
                    )}
                  </div>

                  {/* Lesson Stats */}
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>
                        {student.assigned_lessons} {t.tutorSettings?.studentsSection?.assigned || 'assigned'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3.5 w-3.5 text-orange-500" />
                      <span>
                        {student.in_progress_lessons} {t.tutorSettings?.studentsSection?.inProgress || 'in progress'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      <span>
                        {student.completed_lessons} {t.tutorSettings?.studentsSection?.completed || 'completed'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleMessage(student.id)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm font-medium"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{t.tutorSettings?.studentsSection?.message || 'Message'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {students.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {students.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t.tutorSettings?.studentsSection?.totalStudents || 'Total Students'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {students.filter(s => s.is_active).length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t.tutorSettings?.studentsSection?.activeStudents || 'Active Students'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {students.reduce((sum, s) => sum + s.completed_lessons, 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t.tutorSettings?.studentsSection?.totalCompletedLessons || 'Lessons Completed'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}