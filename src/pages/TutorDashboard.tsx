// src/pages/TutorDashboard.tsx - Z PEŁNĄ INTEGRACJĄ BAZY DANYCH

import React, { useState } from 'react';
import { 
  Users, 
  BookOpen, 
  Clock, 
  PlusCircle,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KPICard } from '../components/KPICard';
import { StudentCard } from '../components/StudentCard';
import { useRealTutorData } from '../lib/studentStats';
import { createLessonWithAssignments, CreateLessonInput } from '../lib/lessonManagement';

export function TutorDashboard() {
  const { session } = useAuth();
  const { students, kpis, isLoading, error, refreshData } = useRealTutorData(session.user?.id);

  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    content: '',
    assignedStudentIds: [] as string[]
  });

  const [isCreatingLesson, setIsCreatingLesson] = useState(false);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleStudentToggle = (studentId: string) => {
    setNewLesson(prev => ({
      ...prev,
      assignedStudentIds: prev.assignedStudentIds.includes(studentId)
        ? prev.assignedStudentIds.filter(id => id !== studentId)
        : [...prev.assignedStudentIds, studentId]
    }));
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.user?.id) return;

    setIsCreatingLesson(true);
    setLessonError(null);

    try {
      const lessonData: CreateLessonInput = {
        title: newLesson.title.trim(),
        description: newLesson.description.trim(),
        content: newLesson.content.trim(),
        assignedStudentIds: newLesson.assignedStudentIds,
        status: 'published'
      };

      await createLessonWithAssignments(session.user.id, lessonData);

      // Reset form
      setNewLesson({
        title: '',
        description: '',
        content: '',
        assignedStudentIds: []
      });

      // Show success and refresh data
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      await refreshData();

    } catch (error: any) {
      console.error('Error creating lesson:', error);
      setLessonError(error.message || 'Failed to create lesson');
    } finally {
      setIsCreatingLesson(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tutor Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Loading real data from database...</p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading statistics...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tutor Dashboard
          </h1>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-red-800 dark:text-red-200 font-medium">Database Error</h3>
              <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={refreshData}
            className="mt-3 px-3 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tutor Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time statistics from your database
          </p>
        </div>
        <button
          onClick={refreshData}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Success notification */}
      {showSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 dark:text-green-200 font-medium">
              Lesson created successfully and assigned to students!
            </span>
          </div>
        </div>
      )}

      {/* Real Data Indicator */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-blue-800 dark:text-blue-200 font-medium">
            Live Database Connection
          </span>
        </div>
        <div className="text-blue-600 dark:text-blue-300 text-sm mt-1">
          Students: {students.length} • Teaching Hours: {kpis.teachingHours}h • Completion Rate: {kpis.completionRate}%
        </div>
      </div>

      {/* KPI Cards - REAL DATA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard
          title="Total Students"
          value={kpis.totalStudents}
          icon={Users}
          color="purple"
        />
        <KPICard
          title="Active Students"
          value={kpis.activeStudents}
          icon={TrendingUp}
          color="blue"
        />
        <KPICard
          title="Teaching Hours"
          value={`${kpis.teachingHours}h`}
          icon={Clock}
          color="green"
        />
        <KPICard
          title="Completion Rate"
          value={`${kpis.completionRate}%`}
          icon={CheckCircle}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Student Roster - REAL DATA */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            My Students ({students.length})
          </h2>
          
          {students.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No students found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Add students in the Students tab to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {students.slice(0, 6).map((student) => (
                <div key={student.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{student.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{student.level}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {student.progress}%
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{student.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${student.progress}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{student.lessonsCompleted}/{student.totalLessons} lessons</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{student.totalHours}h</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {students.length > 6 && (
                <div className="text-center pt-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    And {students.length - 6} more students...
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create Lesson Form - REAL FUNCTIONALITY */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Create New Lesson
          </h2>
          
          {lessonError && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-600 dark:text-red-300 text-sm">{lessonError}</p>
            </div>
          )}
          
          <form onSubmit={handleCreateLesson} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  value={newLesson.title}
                  onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Spanish Conversation Practice"
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
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Brief description of the lesson..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content *
                </label>
                <textarea
                  value={newLesson.content}
                  onChange={(e) => setNewLesson({...newLesson, content: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Lesson content, instructions, exercises..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assign to Students ({students.length} available)
                </label>
                {students.length > 0 ? (
                  <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3 space-y-2">
                    {students.map((student) => (
                      <label key={student.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newLesson.assignedStudentIds.includes(student.id)}
                          onChange={() => handleStudentToggle(student.id)}
                          className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 dark:focus:ring-purple-400"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{student.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">({student.level})</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No students available to assign
                  </p>
                )}
                {newLesson.assignedStudentIds.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {newLesson.assignedStudentIds.length} student(s) selected
                  </p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={isCreatingLesson || !newLesson.title.trim() || !newLesson.content.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-2 px-4 rounded-md font-medium transition-all duration-200 hover:transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isCreatingLesson ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="h-4 w-4" />
                )}
                <span>{isCreatingLesson ? 'Creating...' : 'Create Lesson'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}