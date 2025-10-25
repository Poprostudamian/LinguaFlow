// src/components/settings/student/MyTutorsSection.tsx
import React, { useState, useEffect } from 'react';
import { Users, MessageCircle, User, Award, CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface Tutor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  is_active: boolean;
  completed_lessons: number;
}

export function MyTutorsSection() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTutors();
  }, [session]);

  const fetchTutors = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);

      // Fetch tutors from tutor_students table
      const { data: relationships, error: relationshipsError } = await supabase
        .from('tutor_students')
        .select(`
          tutor_id,
          is_active,
          users:tutor_id (
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq('student_id', session.user.id);

      if (relationshipsError) throw relationshipsError;

      // Get completed lessons count for each tutor
      const tutorsWithLessons = await Promise.all(
        (relationships || []).map(async (rel: any) => {
          const { count } = await supabase
            .from('student_lessons')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', session.user.id)
            .eq('status', 'completed')
            .in('lesson_id', 
              supabase
                .from('lessons')
                .select('id')
                .eq('tutor_id', rel.tutor_id)
            );

          return {
            id: rel.users.id,
            first_name: rel.users.first_name,
            last_name: rel.users.last_name,
            email: rel.users.email,
            avatar_url: rel.users.avatar_url,
            is_active: rel.is_active,
            completed_lessons: count || 0,
          };
        })
      );

      setTutors(tutorsWithLessons);
    } catch (error) {
      console.error('Error fetching tutors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = (tutorId: string) => {
    navigate('/student/messages', { state: { startConversationWith: tutorId } });
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
            {t.studentSettings.myTutorsSection.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.studentSettings.myTutorsSection.description}
          </p>
        </div>
      </div>

      {/* Tutors List */}
      {tutors.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t.studentSettings.myTutorsSection.noTutors}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.studentSettings.myTutorsSection.noTutorsDescription}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tutors.map((tutor) => (
            <div
              key={tutor.id}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {/* Tutor Info */}
              <div className="flex items-center space-x-4 flex-1">
                {/* Avatar */}
                {tutor.avatar_url ? (
                  <img
                    src={tutor.avatar_url}
                    alt={`${tutor.first_name} ${tutor.last_name}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                )}

                {/* Details */}
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {tutor.first_name} {tutor.last_name}
                  </h4>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <Award className="h-3 w-3 mr-1" />
                      {tutor.completed_lessons} {t.studentSettings.myTutorsSection.lessonsCompleted}
                    </span>
                    <span className="flex items-center text-xs">
                      {tutor.is_active ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1 text-green-600 dark:text-green-400" />
                          <span className="text-green-600 dark:text-green-400">
                            {t.studentSettings.myTutorsSection.active}
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1 text-gray-400" />
                          <span className="text-gray-400">
                            {t.studentSettings.myTutorsSection.inactive}
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleMessage(tutor.id)}
                  className="px-3 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors flex items-center space-x-1"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{t.studentSettings.myTutorsSection.message}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}