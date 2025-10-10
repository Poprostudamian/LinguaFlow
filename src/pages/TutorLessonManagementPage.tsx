// src/pages/TutorLessonManagementPage.tsx - MODERN REDESIGN

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  PlusCircle,
  BookOpen,
  Users,
  Calendar,
  RefreshCw,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  X,
  CheckCircle,
  Clock,
  TrendingUp,
  Award,
  Activity,
  FileText,
  Target,
  Layers
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useTutorStudents } from '../contexts/StudentsContext';

// ============================================================================
// TYPES
// ============================================================================
interface LessonWithAssignments {
  id: string;
  tutor_id: string;
  title: string;
  description?: string;
  content?: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  assignedCount?: number;
  completedCount?: number;
}

type TabType = 'all' | 'published' | 'draft';

// ============================================================================
// TOAST COMPONENT
// ============================================================================
interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

function Toast({ message, type, onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <AlertCircle className="h-5 w-5 text-red-600" />
  };

  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in-right max-w-md">
      <div className={`${colors[type]} border rounded-lg p-4 shadow-lg flex items-start space-x-3`}>
        {icons[type]}
        <div className="flex-1">
          <p className="font-medium">{message}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// KPI CARD COMPONENT
// ============================================================================
interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'purple' | 'blue' | 'green' | 'orange';
  subtitle?: string;
}

function KPICard({ title, value, icon: Icon, color, subtitle }: KPICardProps) {
  const colors = {
    purple: 'from-purple-600 to-purple-700',
    blue: 'from-blue-600 to-blue-700',
    green: 'from-green-600 to-green-700',
    orange: 'from-orange-600 to-orange-700'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`bg-gradient-to-r ${colors[color]} p-3 rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

// ============================================================================
// ENHANCED LESSON CARD
// ============================================================================
interface EnhancedLessonCardProps {
  lesson: LessonWithAssignments;
  onView: (lesson: LessonWithAssignments) => void;
  onEdit: (lesson: LessonWithAssignments) => void;
  onDelete: (lessonId: string) => void;
}

function EnhancedLessonCard({ lesson, onView, onEdit, onDelete }: EnhancedLessonCardProps) {
  const getStatusConfig = (status: string) => {
    return status === 'published'
      ? {
          color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
          icon: CheckCircle,
          label: 'Published'
        }
      : {
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
          icon: Clock,
          label: 'Draft'
        };
  };

  const config = getStatusConfig(lesson.status);
  const StatusIcon = config.icon;

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mb-2">
            {lesson.title}
          </h3>
          {lesson.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {lesson.description}
            </p>
          )}
        </div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {config.label}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <Users className="h-5 w-5 text-blue-500" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Assigned</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{lesson.assignedCount || 0}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{lesson.completedCount || 0}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <Target className="h-5 w-5 text-purple-500" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Rate</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {lesson.assignedCount ? Math.round(((lesson.completedCount || 0) / lesson.assignedCount) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Created Date */}
      <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mb-4">
        <Calendar className="h-3 w-3" />
        <span>Created {new Date(lesson.created_at).toLocaleDateString()}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onView(lesson)}
          className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-medium text-sm"
        >
          <Eye className="h-4 w-4" />
          <span>View</span>
        </button>
        <button
          onClick={() => onEdit(lesson)}
          className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors font-medium text-sm"
        >
          <Edit className="h-4 w-4" />
          <span>Edit</span>
        </button>
        <button
          onClick={() => {
            if (window.confirm(`Delete "${lesson.title}"?`)) {
              onDelete(lesson.id);
            }
          }}
          className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function TutorLessonManagementPage() {
  const { session } = useAuth();
  const { students } = useTutorStudents();

  // State
  const [lessons, setLessons] = useState<LessonWithAssignments[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Create form state
  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    content: '',
    assignedStudentIds: [] as string[],
    status: 'published' as 'draft' | 'published'
  });
  const [isCreating, setIsCreating] = useState(false);

  // Load lessons
  useEffect(() => {
    if (session?.user?.id) {
      loadLessons();
    }
  }, [session?.user?.id]);

  const loadLessons = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('tutor_id', session.user.id)
        .order('updated_at', { ascending: false });

      if (lessonsError) throw lessonsError;

      // Get assignment counts
      const lessonsWithCounts = await Promise.all(
        (data || []).map(async (lesson) => {
          const { count: assignedCount } = await supabase
            .from('student_lessons')
            .select('*', { count: 'exact', head: true })
            .eq('lesson_id', lesson.id);

          const { count: completedCount } = await supabase
            .from('student_lessons')
            .select('*', { count: 'exact', head: true })
            .eq('lesson_id', lesson.id)
            .eq('status', 'completed');

          return {
            ...lesson,
            assignedCount: assignedCount || 0,
            completedCount: completedCount || 0
          };
        })
      );

      setLessons(lessonsWithCounts);
    } catch (err: any) {
      setError(err.message || 'Failed to load lessons');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter lessons
  const filteredLessons = useMemo(() => {
    let filtered = lessons;

    // Search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(lesson =>
        lesson.title.toLowerCase().includes(query) ||
        (lesson.description?.toLowerCase() || '').includes(query)
      );
    }

    // Tab filter
    if (activeTab !== 'all') {
      filtered = filtered.filter(l => l.status === activeTab);
    }

    return filtered;
  }, [lessons, searchTerm, activeTab]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = lessons.length;
    const published = lessons.filter(l => l.status === 'published').length;
    const draft = lessons.filter(l => l.status === 'draft').length;
    const totalAssignments = lessons.reduce((sum, l) => sum + (l.assignedCount || 0), 0);
    const avgAssignments = total > 0 ? Math.round(totalAssignments / total) : 0;

    return { total, published, draft, avgAssignments };
  }, [lessons]);

  // Handle create lesson
  const handleCreateLesson = async () => {
    if (!session?.user?.id || !newLesson.title.trim()) {
      setToast({ type: 'error', message: 'Please enter a lesson title' });
      return;
    }

    setIsCreating(true);

    try {
      // Create lesson
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          tutor_id: session.user.id,
          title: newLesson.title.trim(),
          description: newLesson.description.trim() || null,
          content: newLesson.content.trim() || `<h2>${newLesson.title}</h2>`,
          status: newLesson.status,
          is_published: newLesson.status === 'published'
        })
        .select()
        .single();

      if (lessonError) throw lessonError;

      // Assign students
      if (newLesson.assignedStudentIds.length > 0) {
        const assignments = newLesson.assignedStudentIds.map(studentId => ({
          lesson_id: lesson.id,
          student_id: studentId,
          status: 'assigned' as const,
          progress: 0,
          score: null,
          time_spent: 0
        }));

        const { error: assignError } = await supabase
          .from('student_lessons')
          .insert(assignments);

        if (assignError) throw assignError;
      }

      setToast({ 
        type: 'success', 
        message: `Lesson "${newLesson.title}" created and assigned to ${newLesson.assignedStudentIds.length} student(s)!` 
      });

      // Reset and reload
      setNewLesson({
        title: '',
        description: '',
        content: '',
        assignedStudentIds: [],
        status: 'published'
      });
      setShowCreateModal(false);
      loadLessons();

    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to create lesson' });
    } finally {
      setIsCreating(false);
    }
  };

  // Handle delete
  const handleDelete = async (lessonId: string) => {
    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;

      setToast({ type: 'success', message: 'Lesson deleted successfully' });
      loadLessons();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to delete lesson' });
    }
  };

  // Loading state
  if (isLoading && lessons.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading lessons...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* CSS Animations */}
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Lesson Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 flex items-center space-x-2">
            <Activity className="h-4 w-4 text-green-500" />
            <span>Create and manage your lessons</span>
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadLessons}
            className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Lesson</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-600 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard
          title="Total Lessons"
          value={stats.total}
          icon={BookOpen}
          color="purple"
        />
        <KPICard
          title="Published"
          value={stats.published}
          icon={CheckCircle}
          color="green"
        />
        <KPICard
          title="Drafts"
          value={stats.draft}
          icon={FileText}
          color="orange"
        />
        <KPICard
          title="Avg. Assignments"
          value={stats.avgAssignments}
          icon={TrendingUp}
          color="blue"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-1 inline-flex space-x-1">
        {[
          { id: 'all' as TabType, label: 'All Lessons', count: lessons.length },
          { id: 'published' as TabType, label: 'Published', count: stats.published },
          { id: 'draft' as TabType, label: 'Drafts', count: stats.draft }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search lessons by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white shadow-sm"
          />
        </div>
      </div>

      {/* Lessons Grid */}
      {filteredLessons.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Layers className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No lessons found' : 'No lessons yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Create your first lesson to get started'
            }
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create Lesson</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {filteredLessons.map(lesson => (
            <EnhancedLessonCard
              key={lesson.id}
              lesson={lesson}
              onView={(l) => console.log('View:', l)}
              onEdit={(l) => console.log('Edit:', l)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <PlusCircle className="h-5 w-5 text-purple-600" />
                <span>Create New Lesson</span>
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  value={newLesson.title}
                  onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                  placeholder="e.g., Spanish Grammar Basics"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newLesson.description}
                  onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                  placeholder="Brief description of the lesson..."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lesson Content
                </label>
                <textarea
                  value={newLesson.content}
                  onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                  placeholder="Enter lesson content, instructions, exercises..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm resize-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="flex space-x-4">
                  {[
                    { value: 'published' as const, label: 'Published', icon: CheckCircle },
                    { value: 'draft' as const, label: 'Draft', icon: FileText }
                  ].map(option => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setNewLesson({ ...newLesson, status: option.value })}
                        className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                          newLesson.status === option.value
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                            : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-purple-300 dark:hover:border-purple-700'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assign Students */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assign to Students ({newLesson.assignedStudentIds.length} selected)
                </label>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                  {students.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No students available
                    </p>
                  ) : (
                    students.map(student => (
                      <label
                        key={student.student_id}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={newLesson.assignedStudentIds.includes(student.student_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewLesson({
                                ...newLesson,
                                assignedStudentIds: [...newLesson.assignedStudentIds, student.student_id]
                              });
                            } else {
                              setNewLesson({
                                ...newLesson,
                                assignedStudentIds: newLesson.assignedStudentIds.filter(id => id !== student.student_id)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {student.student_first_name} {student.student_last_name}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateLesson}
                  disabled={isCreating || !newLesson.title.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4" />
                      <span>Create Lesson</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}