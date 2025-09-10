// src/pages/TutorLessonManagementPage.tsx
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Edit3, 
  Trash2, 
  Users, 
  Calendar,
  Eye,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useTutorStudents } from '../contexts/StudentsContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  getTutorLessons, 
  createLesson, 
  deleteLesson,
  LessonWithAssignments,
  CreateLessonData
} from '../lib/supabase';

type LessonStatus = 'all' | 'published' | 'draft';

interface NewLesson {
  title: string;
  description: string;
  content: string;
  exerciseType: 'flashcards' | 'written' | 'multiple-choice' | 'word-connection';
  assignedStudentIds: string[];
}

export function TutorLessonManagementPage() {
  const { session } = useAuth();
  const { students, totalStudents, getStudentsByIds } = useTutorStudents();
  console.log('DEBUG - Raw students data:', students);
console.log('DEBUG - First student:', students[0]);
  
  // Real state management for lessons
  const [lessons, setLessons] = useState<LessonWithAssignments[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<LessonWithAssignments[]>([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);
  const [lessonsError, setLessonsError] = useState<string | null>(null);
  
  const [statusFilter, setStatusFilter] = useState<LessonStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [newLesson, setNewLesson] = useState<NewLesson>({
    title: '',
    description: '',
    content: '',
    exerciseType: 'flashcards',
    assignedStudentIds: []
  });

  // Load lessons when component mounts or user changes
  useEffect(() => {
    if (session.isAuthenticated && session.user?.role === 'tutor') {
      loadLessons();
    }
  }, [session.isAuthenticated, session.user?.id]);

  // Load tutor's lessons from database
  const loadLessons = async () => {
    if (!session.user?.id) return;
    
    setIsLoadingLessons(true);
    setLessonsError(null);
    
    try {
      const lessonsData = await getTutorLessons(session.user.id);
      setLessons(lessonsData);
    } catch (error: any) {
      console.error('Error loading lessons:', error);
      setLessonsError(error.message || 'Failed to load lessons');
    } finally {
      setIsLoadingLessons(false);
    }
  };

  // Filter lessons based on status and search
  useEffect(() => {
    let filtered = lessons;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lesson => lesson.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(lesson => 
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lesson.description && lesson.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredLessons(filtered);
  }, [lessons, statusFilter, searchQuery]);

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.user?.id) return;
    
    setIsCreating(true);

    try {
      const lessonData: CreateLessonData = {
        title: newLesson.title.trim(),
        description: newLesson.description.trim() || undefined,
        content: newLesson.content.trim(),
        assignedStudentIds: newLesson.assignedStudentIds,
        status: 'published'
      };

      await createLesson(session.user.id, lessonData);
      
      // Reload lessons to show the new one
      await loadLessons();
      
      // Reset form and close modal
      setNewLesson({
        title: '',
        description: '',
        content: '',
        exerciseType: 'flashcards',
        assignedStudentIds: []
      });
      setShowCreateModal(false);
    } catch (error: any) {
      console.error('Error creating lesson:', error);
      setLessonsError(error.message || 'Failed to create lesson');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setNewLesson(prev => ({
      ...prev,
      assignedStudentIds: prev.assignedStudentIds.includes(studentId)
        ? prev.assignedStudentIds.filter(id => id !== studentId)
        : [...prev.assignedStudentIds, studentId]
    }));
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (window.confirm('Are you sure you want to delete this lesson? This will also remove it from all assigned students.')) {
      try {
        await deleteLesson(lessonId);
        // Reload lessons to reflect the deletion
        await loadLessons();
      } catch (error: any) {
        console.error('Error deleting lesson:', error);
        setLessonsError(error.message || 'Failed to delete lesson');
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'draft':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lesson Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create, edit and manage your lessons for students
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="group relative bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl shadow-lg border border-white/20 backdrop-blur-sm"
        >
          {/* Main Button Content */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Plus className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
              <div className="absolute -inset-1 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="text-left">
              <div className="text-lg font-bold">Create New Lesson</div>
              <div className="text-xs text-purple-100 opacity-90 group-hover:opacity-100 transition-opacity duration-300">
                Choose from 4 exercise types
              </div>
            </div>
          </div>
          
          {/* Exercise Type Icons Preview */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 2h8v2H6V6zm0 4h8v2H6v-2z"/>
              </svg>
            </div>
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
            </div>
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
              </svg>
            </div>
          </div>
          
          {/* Animated Background Elements */}
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute top-2 right-2 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
            <div className="absolute bottom-3 left-3 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-300"></div>
            <div className="absolute top-1/2 right-4 w-1.5 h-1.5 bg-white/25 rounded-full animate-pulse delay-700"></div>
          </div>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Lessons</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{lessons.length}</p>
            </div>
            <BookOpen className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Published</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {lessons.filter(l => l.status === 'published').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Drafts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {lessons.filter(l => l.status === 'draft').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStudents}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LessonStatus)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Lessons List */}
      <div className="space-y-4">
        {isLoadingLessons ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading lessons...</p>
          </div>
        ) : lessonsError ? (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Error loading lessons</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{lessonsError}</p>
            <button
              onClick={loadLessons}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No lessons found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Get started by creating your first lesson'
              }
            </p>
          </div>
        ) : (
          filteredLessons.map((lesson) => {
            const assignedStudentsData = getStudentsByIds(lesson.assignedStudents);
            
            return (
              <div
                key={lesson.id}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {lesson.title}
                      </h3>
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lesson.status)}`}>
                        {getStatusIcon(lesson.status)}
                        <span className="capitalize">{lesson.status}</span>
                      </span>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {lesson.description || 'No description provided'}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{lesson.assignedCount} assigned</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4" />
                        <span>{lesson.completedCount} completed</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Created {new Date(lesson.created_at).toLocaleDateString()}</span>
                      </div>
                      {lesson.updated_at !== lesson.created_at && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Updated {new Date(lesson.updated_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Assigned Students */}
                    {assignedStudentsData.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Assigned to:</p>
                        <div className="flex flex-wrap gap-1">
                          {assignedStudentsData.map((student) => (
                            <span
                              key={student.student_id}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                            >
                              {student.student_first_name} {student.student_last_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => console.log('View lesson:', lesson.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="View Lesson"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => console.log('Edit lesson:', lesson.id)}
                      className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Edit Lesson"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteLesson(lesson.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Delete Lesson"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Lesson Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Lesson</h2>
            </div>
            
            <form onSubmit={handleCreateLesson} className="p-6 space-y-4">
              {/* Exercise Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Exercise Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                    newLesson.exerciseType === 'flashcards' 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500'
                  }`}>
                    <input
                      type="radio"
                      name="exerciseType"
                      value="flashcards"
                      checked={newLesson.exerciseType === 'flashcards'}
                      onChange={(e) => setNewLesson(prev => ({ ...prev, exerciseType: e.target.value as any }))}
                      className="sr-only"
                    />
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mb-2">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 2h8v2H6V6zm0 4h8v2H6v-2z"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white text-center">Flashcards</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">Interactive cards</span>
                  </label>

                  <label className={`relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                    newLesson.exerciseType === 'written' 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500'
                  }`}>
                    <input
                      type="radio"
                      name="exerciseType"
                      value="written"
                      checked={newLesson.exerciseType === 'written'}
                      onChange={(e) => setNewLesson(prev => ({ ...prev, exerciseType: e.target.value as any }))}
                      className="sr-only"
                    />
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mb-2">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white text-center">Written Answers</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">Text responses</span>
                  </label>

                  <label className={`relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                    newLesson.exerciseType === 'multiple-choice' 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500'
                  }`}>
                    <input
                      type="radio"
                      name="exerciseType"
                      value="multiple-choice"
                      checked={newLesson.exerciseType === 'multiple-choice'}
                      onChange={(e) => setNewLesson(prev => ({ ...prev, exerciseType: e.target.value as any }))}
                      className="sr-only"
                    />
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mb-2">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white text-center">ABCD Choice</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">Multiple choice</span>
                  </label>

                  <label className={`relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                    newLesson.exerciseType === 'word-connection' 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500'
                  }`}>
                    <input
                      type="radio"
                      name="exerciseType"
                      value="word-connection"
                      checked={newLesson.exerciseType === 'word-connection'}
                      onChange={(e) => setNewLesson(prev => ({ ...prev, exerciseType: e.target.value as any }))}
                      className="sr-only"
                    />
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mb-2">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white text-center">Word Connection</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">Match languages</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lesson Title
                </label>
                <input
                  type="text"
                  value={newLesson.title}
                  onChange={(e) => setNewLesson(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter lesson title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newLesson.description}
                  onChange={(e) => setNewLesson(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter lesson description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content
                </label>
                <textarea
                  value={newLesson.content}
                  onChange={(e) => setNewLesson(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter lesson content"
                  required
                />
              </div>

              {/* Assign to Students */}
              {students.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assign to Students ({newLesson.assignedStudentIds.length} selected)
                  </label>