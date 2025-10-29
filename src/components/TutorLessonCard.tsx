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
  Shield,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTutorStudents } from '../contexts/StudentsContext';
import { useLanguage } from '../contexts/LanguageContext';

// ✅ ENHANCED: Extended lesson interface
interface LessonWithAssignments {
  id: string;
  tutor_id: string;
  title: string;
  description?: string;
  content?: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  assignedCount: number;
  completedCount: number;
  assignedStudents?: string[];
  student_lessons: Array<{
    student_id: string;
    status: 'assigned' | 'in_progress' | 'completed';
    completed_at?: string | null;
  }>;
  // ✅ Lock properties
  isLocked?: boolean;
  lockReason?: 'all_students_completed' | 'other';
  canEdit?: boolean;
  canDelete?: boolean;
}

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

  const { session } = useAuth();
  const { students } = useTutorStudents();
  const { t } = useLanguage();

  // Edit form state
  const [editData, setEditData] = useState({
    title: lesson.title,
    description: lesson.description || '',
    status: lesson.status
  });

  // ✅ Handle save edit (only if unlocked)
  const handleSaveEdit = async () => {
    if (!onEdit || !editData.title.trim() || lesson.isLocked) return;
    
    setIsLoading(true);
    try {
      await onEdit(lesson.id);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving lesson:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

const handleDelete = async () => {
  if (!onDelete) return;
  
  const confirmMessage = lesson.assignedCount > 0
    ? `Delete "${lesson.title}"?\n\n⚠️ Warning: ${lesson.assignedCount} student(s) are assigned. All progress will be lost.\n\nThis cannot be undone.`
    : `Delete "${lesson.title}"?\n\nThis cannot be undone.`;
  
  if (!confirm(confirmMessage)) return;

  setIsLoading(true);
  try {
    await onDelete(lesson.id);
  } catch (error) {
    console.error('Error deleting lesson:', error);
    alert('Failed to delete lesson. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
 
const handleAssignStudents = async () => {
  if (!onAssignStudents || selectedStudents.length === 0) return;
  
  setIsLoading(true);
  try {
    await onAssignStudents(lesson.id, selectedStudents);
    setSelectedStudents([]);
    setShowStudentManagement(false);
  } catch (error) {
    console.error('Error assigning students:', error);
    alert('Failed to assign students. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

  // Toggle student selection
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200">
      
      {/* HEADER */}
      <div className="p-4">
        {isEditing ? (
          // Edit Mode
          <div className="space-y-3">
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              placeholder="Lesson title"
            />
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white resize-none"
              placeholder="Description (optional)"
              rows={2}
            />
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveEdit}
                disabled={isLoading || !editData.title.trim()}
                className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
              >
                <Save className="h-3 w-3" />
                <span>Save</span>
              </button>
              <button
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
                className="flex items-center space-x-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
              >
                <X className="h-3 w-3" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        ) : (
          // View Mode
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {lesson.title}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  lesson.status === 'published' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {lesson.status === 'published' ? 'Published' : 'Draft'}
                </span>
              </div>
              
              {lesson.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                  {lesson.description}
                </p>
              )}
              
              <div className="flex items-center flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{lesson.assignedCount} assigned</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{lesson.completedCount} completed</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(lesson.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            {/* ACTION BUTTONS */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              {/* View */}
              <button
                onClick={() => onView?.(lesson.id)}
                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="View lesson"
              >
                <Eye className="h-4 w-4" />
              </button>
              
              {/* Edit */}
              <button
                onClick={() => setIsEditing(true)}
                disabled={lesson.canEdit === false}
                className={`p-2 rounded-lg transition-colors ${
                  lesson.canEdit !== false
                    ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700' 
                    : 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                }`}
                title="Edit lesson"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              
              {/* Delete */}
              <button
                onClick={handleDelete}
                disabled={isLoading || lesson.canDelete === false}
                className={`p-2 rounded-lg transition-colors ${
                  lesson.canDelete !== false
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' 
                    : 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                }`}
                title="Delete lesson"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              
              {/* Toggle Details */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ✅ COMPLETION PROGRESS BAR */}
      {lesson.assignedCount > 0 && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1.5">
            <span className="font-medium">Completion Progress</span>
            <span>
              {lesson.completedCount}/{lesson.assignedCount} 
              ({Math.round((lesson.completedCount / lesson.assignedCount) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                lesson.isLocked 
                  ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                  : lesson.completedCount === lesson.assignedCount 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}
              style={{ width: `${(lesson.completedCount / lesson.assignedCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* DETAILS SECTION */}
      {showDetails && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4 bg-gray-50 dark:bg-gray-900/30">
          
          {/* Assigned Students */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Assigned Students ({lesson.assignedCount})
              </h4>
              {/* Assign button */}
                <button
                  onClick={() => setShowStudentManagement(!showStudentManagement)}
                  className="flex items-center space-x-1 text-xs px-2 py-1 rounded-lg font-medium transition-colors text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  title="Manage students"
                >
                  <UserPlus className="h-3 w-3" />
                  <span>Manage</span>
                </button>
            </div>
            
            {assignedStudentDetails.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No students assigned yet
              </p>
            ) : (
              <div className="space-y-1.5">
                {assignedStudentDetails.map((student) => {
                  const studentLesson = lesson.student_lessons.find(
                    sl => sl.student_id === student.student_id
                  );
                  return (
                    <div key={student.student_id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-900 dark:text-white font-medium">
                          {student.student_first_name} {student.student_last_name}
                        </span>
                        {studentLesson && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            studentLesson.status === 'completed' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : studentLesson.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}>
                            {studentLesson.status === 'completed' ? '✓ Completed' 
                             : studentLesson.status === 'in_progress' ? '⏳ In Progress' 
                             : '📋 Assigned'}
                          </span>
                        )}
                      </div>
                      {/* ✅ Unassign button - ALWAYS enabled (to unlock) */}
                      <button
                        onClick={() => handleUnassignStudent(student.student_id)}
                        disabled={isLoading}
                        className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                        title={lesson.isLocked ? '💡 Unassign to unlock lesson' : 'Remove student'}
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Student Management Panel */}
          {showStudentManagement && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Assign New Students
              </h4>
              
              {unassignedStudents.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  All students are already assigned
                </p>
              ) : (
                <>
                  <div className="space-y-1.5 mb-3 max-h-40 overflow-y-auto">
                    {unassignedStudents.map((student) => (
                      <label
                        key={student.student_id}
                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.student_id)}
                          onChange={() => toggleStudentSelection(student.student_id)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {student.student_first_name} {student.student_last_name}
                        </span>
                      </label>
                    ))}
                  </div>
                  
                  <button
                    onClick={handleAssignStudents}
                    disabled={isLoading || selectedStudents.length === 0}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>
                      Assign {selectedStudents.length > 0 && `(${selectedStudents.length})`}
                    </span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}