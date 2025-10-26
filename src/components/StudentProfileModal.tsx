// src/components/StudentProfileModal.tsx
import React, { useState, useEffect } from 'react';
import { X, User, Mail, Calendar, BookOpen, Clock, Award, TrendingUp, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

interface StudentProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  about_me: string | null;
  learning_goals: string[] | null;
  created_at: string;
  relationship_created: string;
  // Stats
  total_lessons: number;
  completed_lessons: number;
  in_progress_lessons: number;
  average_score: number;
  total_study_time: number;
  progress: number;
}

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
}

export function StudentProfileModal({ isOpen, onClose, studentId }: StudentProfileModalProps) {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && studentId) {
      fetchStudentProfile();
    }
  }, [isOpen, studentId]);

  const fetchStudentProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 [PROFILE MODAL] Fetching profile for student:', studentId);

      // Fetch basic student info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', studentId)
        .single();

      if (userError) throw userError;

      // Fetch relationship info
      const { data: relationshipData } = await supabase
        .from('tutor_students')
        .select('created_at')
        .eq('student_id', studentId)
        .maybeSingle();

      // Fetch lesson stats
      const { data: lessonAssignments } = await supabase
        .from('student_lessons')
        .select('status, score, time_spent, progress')
        .eq('student_id', studentId);

      // Calculate stats
      const totalLessons = lessonAssignments?.length || 0;
      const completedLessons = lessonAssignments?.filter(l => l.status === 'completed').length || 0;
      const inProgressLessons = lessonAssignments?.filter(l => l.status === 'in_progress').length || 0;
      
      const scores = lessonAssignments?.filter(l => l.score !== null).map(l => l.score) || [];
      const averageScore = scores.length > 0 
        ? Math.round(scores.reduce((sum, score) => sum + (score || 0), 0) / scores.length)
        : 0;

      const totalStudyTime = lessonAssignments?.reduce((sum, l) => sum + (l.time_spent || 0), 0) || 0;
      
      const progressValues = lessonAssignments?.map(l => l.progress || 0) || [];
      const averageProgress = progressValues.length > 0
        ? Math.round(progressValues.reduce((sum, p) => sum + p, 0) / progressValues.length)
        : 0;

      setProfile({
        ...userData,
        relationship_created: relationshipData?.created_at || userData.created_at,
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        in_progress_lessons: inProgressLessons,
        average_score: averageScore,
        total_study_time: Math.round(totalStudyTime / 60), // Convert to minutes
        progress: averageProgress
      });

      console.log('✅ [PROFILE MODAL] Profile loaded successfully');
    } catch (err: any) {
      console.error('❌ [PROFILE MODAL] Error fetching profile:', err);
      setError(err.message || 'Failed to load student profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t.tutorStudentsPage?.studentProfile || 'Student Profile'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
              <div className="text-red-600 dark:text-red-400 font-medium mb-2">
                {t.tutorStudentsPage?.errorLoadingProfile || 'Failed to load profile'}
              </div>
              <p className="text-red-500 dark:text-red-300 text-sm">{error}</p>
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center space-x-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={`${profile.first_name} ${profile.last_name}`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.first_name} {profile.last_name}
                  </h3>
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mt-1">
                    <Mail className="h-4 w-4" />
                    <span>{profile.email}</span>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mt-1">
                      <span>📞 {profile.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      {t.tutorStudentsPage?.totalLessons || 'Total Lessons'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {profile.total_lessons}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {t.tutorStudentsPage?.completed || 'Completed'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {profile.completed_lessons}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {t.tutorStudentsPage?.inProgress || 'In Progress'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {profile.in_progress_lessons}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                      {t.tutorStudentsPage?.averageScore || 'Avg Score'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                    {profile.average_score}%
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                      {t.tutorStudentsPage?.studyTime || 'Study Time'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {profile.total_study_time}m
                  </p>
                </div>

                <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 border border-pink-200 dark:border-pink-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                    <span className="text-sm font-medium text-pink-600 dark:text-pink-400">
                      {t.tutorStudentsPage?.progress || 'Progress'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-pink-900 dark:text-pink-100">
                    {profile.progress}%
                  </p>
                </div>
              </div>

              {/* About Me */}
              {profile.about_me && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {t.tutorStudentsPage?.aboutStudent || 'About'}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {profile.about_me}
                  </p>
                </div>
              )}

              {/* Learning Goals */}
              {profile.learning_goals && profile.learning_goals.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    {t.tutorStudentsPage?.learningGoals || 'Learning Goals'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.learning_goals.map((goal, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
                      >
                        {goal}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Member Since */}
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {t.tutorStudentsPage?.memberSince || 'Member since'}:{' '}
                    {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {t.tutorStudentsPage?.studentSince || 'Your student since'}:{' '}
                    {new Date(profile.relationship_created).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            {t.tutorStudentsPage?.close || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}