// src/pages/TutorDashboard.tsx - Z PEŁNYMI TŁUMACZENIAMI

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
import { useLanguage } from '../contexts/LanguageContext'; // ← DODANE
import { KPICard } from '../components/KPICard';
import { StudentCard } from '../components/StudentCard';
import { useRealTutorData } from '../lib/studentStats';
import { createLessonWithAssignments, CreateLessonInput } from '../lib/lessonManagement';

export function TutorDashboard() {
  const { session } = useAuth();
  const { t } = useLanguage(); // ← DODANE
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
            {t.tutorDashboard.title}  
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.tutorDashboard.loading}  
          </p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            {t.tutorDashboard.loadingStats}  
          </span>
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
            {t.tutorDashboard.title}  
          </h1>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-red-800 dark:text-red-200 font-medium">
                {t.tutorDashboard.databaseError}  
              </h3>
              <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={refreshData}
            className="mt-3 px-3 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            {t.tutorDashboard.tryAgain}  
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
            {t.tutorDashboard.title}  
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.tutorDashboard.subtitle}  
          </p>
        </div>
        <button
          onClick={refreshData}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>{t.tutorDashboard.refresh}</span>  
        </button>
      </div>

      {/* Success notification */}
      {showSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 dark:text-green-200 font-medium">
              {t.tutorDashboard.lessonCreatedSuccess}  
            </span>
          </div>
        </div>
      )}

      {/* Real Data Indicator */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-blue-800 dark:text-blue-200 font-medium">
            {t.tutorDashboard.liveDatabaseConnection}  
          </span>
        </div>
        <div className="text-blue-600 dark:text-blue-300 text-sm mt-1">
          {t.tutorDashboard.studentsCount}: {students.length} •  
          {t.tutorDashboard.teachingHoursCount}: {kpis.teachingHours}h •  
          {t.tutorDashboard.completionRateCount}: {kpis.completionRate}%  
        </div>
      </div>

      {/* KPI Cards - REAL DATA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard
          title={t.tutorDashboard.totalStudents}  
          value={kpis.totalStudents}
          icon={Users}
          color="purple"
        />
        <KPICard
          title={t.tutorDashboard.activeStudents}  
          value={kpis.activeStudents}
          icon={TrendingUp}
          color="blue"
        />
        <KPICard
          title={t.tutorDashboard.teachingHours}  
          value={`${kpis.teachingHours}h`}
          icon={Clock}
          color="green"
        />
        <KPICard
          title={t.tutorDashboard.completionRate}  
          value={`${kpis.completionRate}%`}
          icon={CheckCircle}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Student Roster - REAL DATA */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t.tutorDashboard.myStudents} ({students.length})  
          </h2>
          
          {students.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                {t.tutorDashboard.noStudentsFound}  
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {t.tutorDashboard.addStudentsHint}  
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
                      <span>{t.tutorDashboard.progress}</span>  
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
                      <span>{student.lessonsCompleted}/{student.totalLessons} {t.tutorDashboard.lessons}</span>  
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{student.totalHours}{t.tutorDashboard.hours}</span>  
                    </div>
                  </div>
                </div>
              ))}
              
              {students.length > 6 && (
                <div className="text-center pt-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {t.tutorDashboard.andMoreStudents.replace('{count}', String(students.length - 6))}  
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create Lesson Form - REAL FUNCTIONALITY */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t.tutorDashboard.createNewLesson}  
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
                  {t.tutorDashboard.lessonTitle} {t.tutorDashboard.required}  
                </label>
                <input
                  type="text"
                  value={newLesson.title}
                  onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder={t.tutorDashboard.lessonTitlePlaceholder}  
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.tutorDashboard.description}  
                </label>
                <textarea
                  value={newLesson.description}
                  onChange={(e) => setNewLesson({...newLesson, description: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder={t.tutorDashboard.descriptionPlaceholder}  
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.tutorDashboard.content} {t.tutorDashboard.required}  
                </label>
                <textarea
                  value={newLesson.content}
                  onChange={(e) => setNewLesson({...newLesson, content: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder={t.tutorDashboard.contentPlaceholder}  
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.tutorDashboard.assignToStudents.replace('{count}', String(students.length))}  
                </label>
                {students.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3">
                    <label className="flex items-center space-x-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newLesson.assignedStudentIds.length === students.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewLesson({...newLesson, assignedStudentIds: students.map(s => s.student_id)});
                          } else {
                            setNewLesson({...newLesson, assignedStudentIds: []});
                          }
                        }}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="font-medium">
                        {t.tutorDashboard.selectAll}  
                      </span>
                    </label>
                    {students.map((student) => (
                      <label key={student.student_id} className="flex items-center space-x-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newLesson.assignedStudentIds.includes(student.student_id)}
                          onChange={() => handleStudentToggle(student.student_id)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span>{student.name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t.tutorDashboard.noStudentsAvailable}  
                  </p>
                )}
                {students.length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {t.tutorDashboard.addStudentsFirst}  
                  </p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={isCreatingLesson || !newLesson.title || !newLesson.content}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isCreatingLesson ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>{t.tutorDashboard.creating}</span>  
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4" />
                    <span>{t.tutorDashboard.createLesson}</span>  
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}