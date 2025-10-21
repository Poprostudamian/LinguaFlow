// src/components/TutorLessonCard.tsx - Enhanced with Lesson Locking

import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  Edit3, 
  Eye, 
  Trash2, 
  UserPlus, 
  UserMinus,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Lock,
  LockOpen,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTutorStudents } from '../contexts/StudentsContext';
import { LessonWithAssignments } from '../types/lesson.types';
import { useLanguage } from '../contexts/LanguageContext';

interface TutorLessonCardProps {
  lesson: LessonWithAssignments;
  onEdit?: (lessonId: string) => void;
  onView?: (lessonId: string) => void;
  onDelete?: (lessonId: string) => Promise<void>;
  onAssignStudents?: (lessonId: string, studentIds: string[]) => Promise<void>;
  onUnassignStudents?: (lessonId: string, studentIds: string[]) => Promise<void>;
}

export function TutorLessonCard({ 
  lesson, 
  onEdit, 
  onView,
  onDelete, 
  onAssignStudents, 
  onUnassignStudents 
}: TutorLessonCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showStudentManagement, setShowStudentManagement] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showLockInfo, setShowLockInfo] = useState(false);

  const { session } = useAuth();
  const { students } = useTutorStudents();
  const { t } = useLanguage();

  // Edit form state
  const [editData, setEditData] = useState({
    title: lesson.title,
    description: lesson.description || '',
    status: lesson.status
  });

  const handleSaveEdit = async () => {
    if (!onEdit || !editData.title.trim()) return;
    
    setIsLoading(true);
    try {
      await onEdit(lesson.id);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving lesson:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    // ✅ ENHANCED: Check lock status before confirming deletion
    if (lesson.isLocked) {
      alert(t.tutorLessonManagementPage.cannotDeleteLockedLesson);
      return;
    }
    
    if (confirm(`${t.tutorLessonManagementPage.deleteConfirmation}\n\n${t.tutorLessonManagementPage.deleteWarning}`)) {
      setIsLoading(true);
      try {
        await onDelete(lesson.id);
      } catch (error) {
        console.error('Error deleting lesson:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleAssignStudents = async () => {
    if (!onAssignStudents || selectedStudents.length === 0) return;
    
    // ✅ ENHANCED: Check if lesson allows new assignments
    if (lesson.isLocked) {
      alert(t.tutorLessonManagementPage.cannotAssignToLockedLesson);
      return;
    }
    
    setIsLoading(true);
    try {
      await onAssignStudents(lesson.id, selectedStudents);
      setSelectedStudents([]);
      setShowStudentManagement(false);
    } catch (error) {
      console.error('Error assigning students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassignStudent = async (studentId: string) => {
    if (!onUnassignStudents) return;
    
    setIsLoading(true);
    try {
      await onUnassignStudents(lesson.id, [studentId]);
    } catch (error) {
      console.error('Error unassigning student:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Get students data
  const unassignedStudents = students.filter(student => 
    !(lesson.assignedStudents || []).includes(student.student_id)
  );

  const assignedStudentDetails = students.filter(student =>
    (lesson.assignedStudents || []).includes(student.student_id)
  );

  // ✅ NEW: Format lock status message
  const getLockStatusMessage = () => {
    if (!lesson.isLocked) return null;
    
    switch (lesson.lockReason) {
      case 'all_students_completed':
        return t.tutorLessonManagementPage.lessonLockedAllCompleted
          .replace('{count}', lesson.assignedCount.toString());
      default:
        return t.tutorLessonManagementPage.lessonLockedGeneric;
    }
  };

  // ✅ NEW: Get appropriate lock icon and color
  const getLockIcon = () => {
    if (lesson.isLocked) {
      return <Lock className="h-4 w-4 text-red-500" />;
    }
    return <LockOpen className="h-4 w-4 text-green-500" />;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border transition-all duration-200 ${
      lesson.isLocked 
        ? 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-900/10' 
        : 'border-gray-200 dark:border-gray-700 hover:shadow-md'
    }`}>
      {/* ✅ NEW: Lock Status Banner */}
      {lesson.isLocked && (
        <div className="bg-red-100 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-800 dark:text-red-300">
                {t.tutorLessonManagementPage.lessonLocked}
              </span>
            </div>
            <button
              onClick={() => setShowLockInfo(!showLockInfo)}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
          
          {showLockInfo && (
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              {getLockStatusMessage()}
              <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                {t.tutorLessonManagementPage.unlockHint}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        {isEditing && !lesson.isLocked ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder={t.tutorLessonManagementPage.lessonTitle}
            />
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder={t.tutorLessonManagementPage.description}
              rows={2}
            />
            <div className="flex items-center justify-between">
              <select
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value as 'draft' | 'published' })}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="draft">{t.tutorLessonManagementPage.draft}</option>
                <option value="published">{t.tutorLessonManagementPage.published}</option>
              </select>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-3 py-1.5 rounded text-sm"
                >
                  <X className="h-4 w-4" />
                  <span>{t.tutorLessonManagementPage.cancel}</span>
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isLoading || !editData.title.trim()}
                  className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1.5 rounded text-sm"
                >
                  <Save className="h-4 w-4" />
                  <span>{t.tutorLessonManagementPage.save}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {lesson.title}
                </h3>
                {getLockIcon()}
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  lesson.status === 'published' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {lesson.status === 'published' ? t.tutorLessonManagementPage.published : t.tutorLessonManagementPage.draft}
                </span>
              </div>
              
              {lesson.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                  {lesson.description}
                </p>
              )}
              
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>
                    {lesson.assignedCount} {t.tutorLessonManagementPage.assigned}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {lesson.completedCount} {t.tutorLessonManagementPage.completed}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {t.tutorLessonManagementPage.created}: {new Date(lesson.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => onView?.(lesson.id)}
                className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 px-2 py-1 rounded text-sm"
                title={t.tutorLessonManagementPage.view}
              >
                <Eye className="h-4 w-4" />
              </button>
              
              {/* ✅ ENHANCED: Edit button disabled for locked lessons */}
              <button
                onClick={() => lesson.canEdit ? setIsEditing(true) : null}
                disabled={!lesson.canEdit}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-sm transition-colors ${
                  lesson.canEdit 
                    ? 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200' 
                    : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                }`}
                title={lesson.canEdit ? t.tutorLessonManagementPage.edit : t.tutorLessonManagementPage.cannotEditLocked}
              >
                <Edit3 className="h-4 w-4" />
              </button>
              
              {/* ✅ ENHANCED: Delete button disabled for locked lessons */}
              <button
                onClick={lesson.canDelete ? handleDelete : undefined}
                disabled={isLoading || !lesson.canDelete}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-sm transition-colors ${
                  lesson.canDelete 
                    ? 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300' 
                    : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                }`}
                title={lesson.canDelete ? t.tutorLessonManagementPage.delete : t.tutorLessonManagementPage.cannotDeleteLocked}
              >
                <Trash2 className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-2 py-1 rounded text-sm"
              >
                {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ✅ ENHANCED: Completion Progress Bar */}
      {lesson.assignedCount > 0 && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>{t.tutorLessonManagementPage.completionProgress}</span>
            <span>{lesson.completedCount}/{lesson.assignedCount} ({Math.round((lesson.completedCount / lesson.assignedCount) * 100)}%)</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                lesson.isLocked 
                  ? 'bg-red-500' 
                  : lesson.completedCount === lesson.assignedCount 
                    ? 'bg-green-500' 
                    : 'bg-blue-500'
              }`}
              style={{ width: `${(lesson.completedCount / lesson.assignedCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Details Section */}
      {showDetails && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-3">
            {/* Student Management */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t.tutorLessonManagementPage.assignedStudents} ({lesson.assignedCount})
                </h4>
                {/* ✅ ENHANCED: Assignment button considers lock status */}
                <button
                  onClick={() => setShowStudentManagement(!showStudentManagement)}
                  disabled={lesson.isLocked}
                  className={`flex items-center space-x-1 text-xs px-2 py-1 rounded transition-colors ${
                    lesson.isLocked
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300'
                  }`}
                  title={lesson.isLocked ? t.tutorLessonManagementPage.cannotAssignToLocked : undefined}
                >
                  <UserPlus className="h-3 w-3" />
                  <span>{t.tutorLessonManagementPage.manageStudents}</span>
                </button>
              </div>
              
              {assignedStudentDetails.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.tutorLessonManagementPage.noStudentsAssigned}
                </p>
              ) : (
                <div className="space-y-1">
                  {assignedStudentDetails.map((student) => {
                    const studentLesson = lesson.student_lessons.find(sl => sl.student_id === student.student_id);
                    return (
                      <div key={student.student_id} className="flex items-center justify-between py-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {student.student_first_name} {student.student_last_name}
                          </span>
                          {studentLesson && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              studentLesson.status === 'completed' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : studentLesson.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                            }`}>
                              {studentLesson.status === 'completed' ? t.tutorLessonManagementPage.completed 
                               : studentLesson.status === 'in_progress' ? t.tutorLessonManagementPage.inProgress 
                               : t.tutorLessonManagementPage.assigned}
                            </span>
                          )}
                        </div>
                        {/* ✅ Allow unassigning even for locked lessons (to unlock them) */}
                        <button
                          onClick={() => handleUnassignStudent(student.student_id)}
                          disabled={isLoading}
                          className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50"
                          title={lesson.isLocked ? t.tutorLessonManagementPage.unassignToUnlock : t.tutorLessonManagementPage.removeStudent}
                        >
                          <UserMinus className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student Management Panel */}
      {showStudentManagement && !isEditing && !lesson.isLocked && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t.tutorLessonManagementPage.assignStudents}
          </h4>
          
          {unassignedStudents.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t.tutorLessonManagementPage.allStudentsAssigned}
            </p>
          ) : (
            <>
              <div className="space-y-2 mb-3">
                {unassignedStudents.map((student) => (
                  <label key={student.student_id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.student_id)}
                      onChange={() => toggleStudentSelection(student.student_id)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {student.student_first_name} {student.student_last_name}
                    </span>
                  </label>
                ))}
              </div>
              
              <button
                onClick={handleAssignStudents}
                disabled={selectedStudents.length === 0 || isLoading}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-3 py-1.5 rounded text-sm"
              >
                {t.tutorLessonManagementPage.assignSelected} ({selectedStudents.length})
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}