// src/components/LessonCard.tsx
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
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// ✅ DODAJ: Interface dla legacy lesson (ze StudentDashboard)
interface LegacyLesson {
  id: string;
  title: string;
  date: string;
  time: string;
  tutor: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  assignedStudentIds?: string[];
}

// ✅ DODAJ: Interface dla database lesson (z TutorDashboard)
interface DatabaseLesson {
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
  assignedStudents?: string[];
}

// ✅ Union type dla wszystkich typów lekcji
type AnyLesson = LegacyLesson | DatabaseLesson;

interface LessonCardProps {
  lesson: AnyLesson;
  // Tutor-specific props (optional)
  onEdit?: (lessonId: string, updates: any) => Promise<void>;
  onDelete?: (lessonId: string) => Promise<void>;
  onAssignStudents?: (lessonId: string, studentIds: string[]) => Promise<void>;
  onUnassignStudents?: (lessonId: string, studentIds: string[]) => Promise<void>;
}

export function LessonCard({ 
  lesson, 
  onEdit, 
  onDelete, 
  onAssignStudents, 
  onUnassignStudents 
}: LessonCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showStudentManagement, setShowStudentManagement] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { session } = useAuth();
  const isStudent = session.user?.role === 'student';
  const isTutor = session.user?.role === 'tutor';
  
  // ✅ CONDITIONAL: Only import students hook if user is tutor
  const studentsData = React.useMemo(() => {
    if (!isTutor) return { students: [] };
    
    // Dynamic import only for tutors
    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { useTutorStudents } = require('../contexts/StudentsContext');
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useTutorStudents();
    } catch (error) {
      console.warn('Could not load tutor students:', error);
      return { students: [] };
    }
  }, [isTutor]);

  const { students = [] } = studentsData;
  
  // Edit form state
  const [editData, setEditData] = useState({
    title: lesson.title,
    description: ('description' in lesson) ? lesson.description || '' : '',
    content: ('content' in lesson) ? lesson.content || '' : '',
    status: ('status' in lesson) ? lesson.status : 'upcoming'
  });

  // Student management state
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // ✅ HELPER: Check if this is a database lesson
  const isDatabaseLesson = (lesson: AnyLesson): lesson is DatabaseLesson => {
    return 'tutor_id' in lesson;
  };

  // ✅ HELPER: Format date for both lesson types
  const formatDate = (lesson: AnyLesson): string => {
    if (isDatabaseLesson(lesson)) {
      return new Date(lesson.created_at).toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      // Legacy lesson format
      return `${lesson.date} at ${lesson.time}`;
    }
  };

  // ✅ HELPER: Get lesson status badge
  const getStatusBadge = (lesson: AnyLesson) => {
    let status, bgColor, textColor;
    
    if (isDatabaseLesson(lesson)) {
      status = lesson.status;
      bgColor = lesson.status === 'published' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-yellow-100 dark:bg-yellow-900/20';
      textColor = lesson.status === 'published' ? 'text-green-800 dark:text-green-400' : 'text-yellow-800 dark:text-yellow-400';
    } else {
      status = lesson.status;
      bgColor = lesson.status === 'completed' ? 'bg-green-100 dark:bg-green-900/20' : 
                lesson.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900/20' : 
                'bg-blue-100 dark:bg-blue-900/20';
      textColor = lesson.status === 'completed' ? 'text-green-800 dark:text-green-400' : 
                  lesson.status === 'cancelled' ? 'text-red-800 dark:text-red-400' : 
                  'text-blue-800 dark:text-blue-400';
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${bgColor} ${textColor}`}>
        {status}
      </span>
    );
  };

  const handleSaveEdit = async () => {
    if (!onEdit) return;
    
    setIsLoading(true);
    try {
      await onEdit(lesson.id, editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating lesson:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (confirm(`Are you sure you want to delete "${lesson.title}"? This action cannot be undone.`)) {
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

  // Get students data only for tutors
  const unassignedStudents = isTutor && isDatabaseLesson(lesson) ? 
    students.filter(student => 
      !(lesson.assignedStudents || []).includes(student.student_id)
    ) : [];

  const assignedStudentDetails = isTutor && isDatabaseLesson(lesson) ? 
    students.filter(student =>
      (lesson.assignedStudents || []).includes(student.student_id)
    ) : [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        {isEditing && isTutor ? (
          // Edit mode (only for tutors)
          <div className="space-y-3">
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({...editData, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              placeholder="Lesson title"
            />
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({...editData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              rows={2}
              placeholder="Description (optional)"
            />
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveEdit}
                disabled={isLoading || !editData.title.trim()}
                className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1.5 rounded text-sm"
              >
                <Save className="h-3 w-3" />
                <span>Save</span>
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center space-x-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-sm"
              >
                <X className="h-3 w-3" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        ) : (
          // View mode
          <>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {lesson.title}
                </h3>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(lesson)}</span>
                  </div>
                  
                  {isDatabaseLesson(lesson) && isTutor && (
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{lesson.assignedCount || 0} assigned</span>
                    </div>
                  )}
                  
                  {!isDatabaseLesson(lesson) && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>with {lesson.tutor}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {getStatusBadge(lesson)}
                
                {/* Tutor-only actions */}
                {isTutor && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setShowDetails(!showDetails)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Toggle details"
                    >
                      {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    
                    {onEdit && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Edit lesson"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    )}
                    
                    {onDelete && (
                      <button
                        onClick={handleDelete}
                        className="p-1.5 text-red-400 hover:text-red-600"
                        title="Delete lesson"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Description for database lessons */}
            {isDatabaseLesson(lesson) && lesson.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {lesson.description}
              </p>
            )}
          </>
        )}
      </div>

      {/* Expandable Details - Only for tutors */}
      {showDetails && !isEditing && isTutor && isDatabaseLesson(lesson) && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="space-y-3">
            {lesson.content && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content Preview</h4>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {lesson.content.substring(0, 200)}
                    {lesson.content.length > 200 && '...'}
                  </p>
                </div>
              </div>
            )}
            
            {assignedStudentDetails.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assigned Students</h4>
                <div className="space-y-1">
                  {assignedStudentDetails.map((student) => (
                    <div key={student.student_id} className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {student.student_first_name} {student.student_last_name}
                      </span>
                      <button
                        onClick={() => handleUnassignStudent(student.student_id)}
                        disabled={isLoading}
                        className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50"
                        title="Remove student"
                      >
                        <UserMinus className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Student Management - Only for tutors */}
      {showStudentManagement && !isEditing && isTutor && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Assign Students</h4>
          
          {unassignedStudents.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">All students are already assigned to this lesson.</p>
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
                Assign Selected ({selectedStudents.length})
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}