// src/pages/TutorLessonManagementPage.tsx - NAPRAWIONA WERSJA
import React, { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, Calendar, Clock, Users, PlusCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { LessonCard } from '../components/LessonCard';
import { useTutorStudents } from '../contexts/StudentsContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  getTutorLessons, 
  createLesson, 
  updateLesson,
  deleteLesson,
  assignLessonToStudents,
  unassignLessonFromStudents,
  LessonWithAssignments, 
  CreateLessonData,
  UpdateLessonData } from '../lib/supabase';

export function TutorLessonManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lessons, setLessons] = useState<LessonWithAssignments[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New lesson form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLesson, setNewLesson] = useState<CreateLessonData>({
    title: '',
    description: '',
    content: '',
    assignedStudentIds: [],
    status: 'published'
  });
  const [isCreating, setIsCreating] = useState(false);

  const { session } = useAuth();
  const { students } = useTutorStudents();

  // Load lessons on component mount
  useEffect(() => {
    if (session.user?.id) {
      loadLessons();
    }
  }, [session.user?.id]);

  const loadLessons = async () => {
    if (!session.user?.id) {
      setError('No authenticated user');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const lessonsData = await getTutorLessons(session.user.id);
      setLessons(lessonsData);
    } catch (err: any) {
      console.error('Error loading lessons:', err);
      setError(err.message || 'Failed to load lessons');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditLesson = async (lessonId: string, updates: UpdateLessonData) => {
  try {
    console.log('🔄 Editing lesson:', lessonId, updates);
    await updateLesson(lessonId, updates);
    await loadLessons(); // Reload lessons
    console.log('✅ Lesson updated successfully');
  } catch (error) {
    console.error('❌ Error updating lesson:', error);
    throw error;
  }
};

const handleDeleteLesson = async (lessonId: string) => {
  try {
    console.log('🗑️ Deleting lesson:', lessonId);
    await deleteLesson(lessonId);
    await loadLessons(); // Reload lessons
    console.log('✅ Lesson deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting lesson:', error);
    throw error;
  }
};

const handleAssignStudents = async (lessonId: string, studentIds: string[]) => {
  try {
    console.log('👥 Assigning students:', lessonId, studentIds);
    await assignLessonToStudents(lessonId, studentIds);
    await loadLessons(); // Reload lessons
    console.log('✅ Students assigned successfully');
  } catch (error) {
    console.error('❌ Error assigning students:', error);
    throw error;
  }
};

const handleUnassignStudents = async (lessonId: string, studentIds: string[]) => {
  try {
    console.log('👥 Unassigning students:', lessonId, studentIds);
    await unassignLessonFromStudents(lessonId, studentIds);
    await loadLessons(); // Reload lessons
    console.log('✅ Students unassigned successfully');
  } catch (error) {
    console.error('❌ Error unassigning students:', error);
    throw error;
  }
};

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session.user?.id) {
      setError('No authenticated user');
      return;
    }

    if (!newLesson.title.trim()) {
      setError('Lesson title is required');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await createLesson(session.user.id, {
        ...newLesson,
        title: newLesson.title.trim(),
        description: newLesson.description?.trim() || undefined,
        content: newLesson.content.trim() || 'Lesson content will be added here.'
      });

      // Reset form
      setNewLesson({
        title: '',
        description: '',
        content: '',
        assignedStudentIds: [],
        status: 'published'
      });
      
      setShowCreateForm(false);
      
      // Reload lessons
      await loadLessons();
      
    } catch (err: any) {
      console.error('Error creating lesson:', err);
      setError(err.message || 'Failed to create lesson');
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

  // Filter lessons
  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lesson.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const publishedLessons = filteredLessons.filter(l => l.status === 'published');
  const draftLessons = filteredLessons.filter(l => l.status === 'draft');

  if (isLoading && lessons.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading lessons...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Lesson Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage your lessons
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Create Lesson</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={loadLessons}
              className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Lessons</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {lessons.length}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Published</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {publishedLessons.length}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Drafts</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {draftLessons.length}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Assignments</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {lessons.reduce((sum, l) => sum + l.assignedCount, 0)}
          </p>
        </div>
      </div>

      {/* Create Lesson Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Create New Lesson
          </h2>
          
          <form onSubmit={handleCreateLesson} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lesson Title *
              </label>
              <input
                type="text"
                value={newLesson.title}
                onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Spanish Grammar Basics"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={newLesson.description}
                onChange={(e) => setNewLesson({...newLesson, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                placeholder="Brief description of the lesson..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content
              </label>
              <textarea
                value={newLesson.content}
                onChange={(e) => setNewLesson({...newLesson, content: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                placeholder="Lesson content, instructions, materials..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assign to Students ({newLesson.assignedStudentIds.length} selected)
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3">
                {students.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No students available. Add students first in the Students tab.
                  </p>
                ) : (
                  students.map((student) => (
                    <label key={student.student_id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newLesson.assignedStudentIds.includes(student.student_id)}
                        onChange={() => handleStudentToggle(student.student_id)}
                        className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 dark:focus:ring-purple-400"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {student.student_first_name} {student.student_last_name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({student.student_email})
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isCreating || !newLesson.title.trim()}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{isCreating ? 'Creating...' : 'Create Lesson'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                disabled={isCreating}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search lessons by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          
          <button
            onClick={loadLessons}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Lessons List */}
      {filteredLessons.length === 0 && !isLoading ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {lessons.length === 0 ? 'No lessons yet' : 'No lessons found'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {lessons.length === 0 
              ? 'Create your first lesson to get started!' 
              : 'Try adjusting your search or filter criteria.'}
          </p>
          {lessons.length === 0 && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create Your First Lesson</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Published Lessons */}
          {publishedLessons.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Published Lessons ({publishedLessons.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {publishedLessons.map((lesson) => (
                  <LessonCard 
    key={lesson.id} 
    lesson={lesson} 
    onEdit={handleEditLesson}
    onDelete={handleDeleteLesson}
    onAssignStudents={handleAssignStudents}
    onUnassignStudents={handleUnassignStudents}
  />
                ))}
              </div>
            </div>
          )}

          {/* Draft Lessons */}
          {draftLessons.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Draft Lessons ({draftLessons.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {draftLessons.map((lesson) => (
                  <LessonCard 
                    key={lesson.id} 
                    lesson={lesson} 
                    onEdit={handleEditLesson}
                    onDelete={handleDeleteLesson}
                    onAssignStudents={handleAssignStudents}
                    onUnassignStudents={handleUnassignStudents}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}