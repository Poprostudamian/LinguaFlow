// src/components/StudentProfileModal.tsx

import React, { useEffect, useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Calendar, 
  BookOpen, 
  Clock, 
  Award, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Activity
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// ============================================================================
// TYPES
// ============================================================================
interface LessonHistory {
  id: string;
  title: string;
  completedAt: string;
  score: number;
  timeSpent: number;
  status: 'completed' | 'in_progress' | 'assigned';
}

interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  level: string;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  totalHours: number;
  joinedDate: string;
  lastActive?: string;
  lessonHistory: LessonHistory[];
}

interface StudentProfileModalProps {
  studentId: string;
  onClose: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function StudentProfileModal({ studentId, onClose }: StudentProfileModalProps) {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentProfile();
  }, [studentId]);

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Import dynamicznie aby uniknąć circular dependencies
      const { getStudentDetailedProfile } = await import('../lib/studentProfile');
      const data = await getStudentDetailedProfile(studentId);
      
      setProfile(data);
    } catch (err) {
      console.error('Error fetching student profile:', err);
      setError(t.tutorStudentsPage.errorLoadingProfile || 'Failed to load student profile');
    } finally {
      setLoading(false);
    }
  };

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const getLevelColor = (level: string) => {
    const colors = {
      'Beginner': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'Intermediate': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'Advanced': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    };
    return colors[level as keyof typeof colors] || colors['Beginner'];
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'completed': 'text-green-600 dark:text-green-400',
      'in_progress': 'text-yellow-600 dark:text-yellow-400',
      'assigned': 'text-gray-600 dark:text-gray-400',
    };
    return colors[status as keyof typeof colors] || colors['assigned'];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTimeSpent = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <User className="h-6 w-6" />
            <span>{t.tutorStudentsPage.studentProfile || 'Student Profile'}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
              <button
                onClick={fetchStudentProfile}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {t.tutorStudentsPage.retry || 'Retry'}
              </button>
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-start space-x-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={`${profile.firstName} ${profile.lastName}`}
                      className="w-24 h-24 rounded-full object-cover border-4 border-purple-200 dark:border-purple-800"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center border-4 border-purple-200 dark:border-purple-800">
                      <span className="text-3xl font-bold text-white">
                        {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Basic Info */}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {profile.firstName} {profile.lastName}
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                      <Mail className="h-4 w-4" />
                      <span>{profile.email}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>{t.tutorStudentsPage.joined || 'Joined'}: {formatDate(profile.joinedDate)}</span>
                    </div>

                    {profile.lastActive && (
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <Activity className="h-4 w-4" />
                        <span>{t.tutorStudentsPage.lastActive || 'Last active'}: {formatDate(profile.lastActive)}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(profile.level)}`}>
                      {t.tutorStudentsPage.level || 'Level'}: {profile.level}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Progress */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-2xl font-bold text-purple-900 dark:text-purple-100">{profile.progress}%</span>
                  </div>
                  <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                    {t.tutorStudentsPage.progress || 'Progress'}
                  </p>
                </div>

                {/* Lessons */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {profile.lessonsCompleted}/{profile.totalLessons}
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    {t.tutorStudentsPage.lessons || 'Lessons'}
                  </p>
                </div>

                {/* Hours */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-2xl font-bold text-green-900 dark:text-green-100">{profile.totalHours}h</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                    {t.tutorStudentsPage.hours || 'Hours'}
                  </p>
                </div>

                {/* Average Score */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center justify-between mb-2">
                    <Award className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <span className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                      {profile.lessonHistory.length > 0 
                        ? Math.round(profile.lessonHistory.reduce((acc, l) => acc + l.score, 0) / profile.lessonHistory.length)
                        : 0}%
                    </span>
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                    {t.tutorStudentsPage.avgScore || 'Avg Score'}
                  </p>
                </div>
              </div>

              {/* Lesson History */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>{t.tutorStudentsPage.lessonHistory || 'Lesson History'}</span>
                </h4>

                {profile.lessonHistory.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {t.tutorStudentsPage.noLessonHistory || 'No lesson history yet'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {profile.lessonHistory.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                            {lesson.title}
                          </h5>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{formatDate(lesson.completedAt)}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{formatTimeSpent(lesson.timeSpent)}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          {/* Status */}
                          <div className={`flex items-center space-x-1 ${getStatusColor(lesson.status)}`}>
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-medium capitalize">{lesson.status.replace('_', ' ')}</span>
                          </div>

                          {/* Score */}
                          {lesson.status === 'completed' && (
                            <div className="flex items-center space-x-1">
                              <Award className="h-4 w-4 text-yellow-500" />
                              <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {lesson.score}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            {t.tutorStudentsPage.close || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}