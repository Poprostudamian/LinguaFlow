// src/components/AdvancedLessonCard.tsx
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
import { LessonWithAssignments } from '../lib/supabase';
import { useTutorStudents } from '../contexts/StudentsContext';

interface AdvancedLessonCardProps {
  lesson: LessonWithAssignments;
  onEdit?: (lessonId: string, updates: any) => Promise<void>;
  onDelete?: (lessonId: string) => Promise<void>;
  onAssignStudents?: (lessonId: string, studentIds: string[]) => Promise<void>;
  onUnassignStudents?: (lessonId: string, studentIds: string[]) => Promise<void>;
}

export function AdvancedLessonCard({ 
  lesson, 
  onEdit, 
  onDelete, 
  onAssignStudents, 
  onUnassignStudents 
}: AdvancedLessonCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showStudentManagement, setShowStudentManagement] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { students } = useTutorStudents();
  
  // Edit form state
  const [editData, setEditData] = useState({
    title: lesson.title,
    description: lesson.description || '',
    content: lesson.content,
    status: lesson.status
  });

  // Student management state
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  // Get students not yet assigned to this lesson
  const unassignedStudents = students.filter(student => 
    !lesson.assignedStudents.includes(student.student_id)
  );

  // Get assigned student details
  const assignedStudentDetails = students.filter(student =>
    lesson.assignedStudents.includes(student.student_id)
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        {isEditing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full text-lg font-semibold bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 outline-none text-gray-900 dark:text-white"
              placeholder="Lesson title..."
            />
            <div className="flex items-center space-x-2">
              <select
                value={editData.status}
                onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {lesson.title}
              </h3>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                lesson.status === 'published' 
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
                  : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
              }`}>
                {lesson.status.charAt(0).toUpperCase() + lesson.status.slice(1)}
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsEditing(true)}
                disabled={isLoading}
                className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                title="Edit lesson"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                title="View details"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                title="Delete lesson"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Basic Info */}
      <div className="p-4 space-y-3">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editData.description}
              onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              placeholder="Lesson description..."
            />
            <textarea
              value={editData.content}
              onChange={(e) => setEditData(prev => ({ ...prev, content: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              placeholder="Lesson content..."
            />
            <div className="flex space-x-2">
              <button
                onClick={handleSaveEdit}
                disabled={isLoading || !editData.title.trim()}
                className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors"
              >
                <Save className="h-3 w-3" />
                <span>{isLoading ? 'Saving...' : 'Save'}</span>
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditData({
                    title: lesson.title,
                    description: lesson.description || '',
                    content: lesson.content,
                    status: lesson.status
                  });
                }}
                disabled={isLoading}
                className="flex items-center space-x-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors"
              >
                <X className="h-3 w-3" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {lesson.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {lesson.description}
              </p>
            )}
            
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(lesson.created_at)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Updated {formatDate(lesson.updated_at)}</span>
                </div>
              </div>
            </div>

            {/* Students info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  {lesson.assignedCount} student{lesson.assignedCount !== 1 ? 's' : ''} assigned
                </span>
                {lesson.completedCount > 0 && (
                  <span className="text-green-600 dark:text-green-400">
                    • {lesson.completedCount} completed
                  </span>
                )}
              </div>
              
              <button
                onClick={() => setShowStudentManagement(!showStudentManagement)}
                className="flex items-center space-x-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
              >
                <UserPlus className="h-3 w-3" />
                <span>Manage</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Expandable Details */}
      {showDetails && !isEditing && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content Preview</h4>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {lesson.content.substring(0, 200)}
                  {lesson.content.length > 200 && '...'}
                </p>
              </div>
            </div>
            
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

      {/* Student Management */}
      {showStudentManagement && !isEditing && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Assign Students</h4>
          
          {unassignedStudents.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              All available students are already assigned to this lesson.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="max-h-32 overflow-y-auto space-y-2">
                {unassignedStudents.map((student) => (
                  <label key={student.student_id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.student_id)}
                      onChange={() => toggleStudentSelection(student.student_id)}
                      className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 dark:focus:ring-purple-400"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {student.student_first_name} {student.student_last_name}
                    </span>
                  </label>
                ))}
              </div>
              
              {selectedStudents.length > 0 && (
                <button
                  onClick={handleAssignStudents}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>
                    {isLoading 
                      ? 'Assigning...' 
                      : `Assign ${selectedStudents.length} student${selectedStudents.length !== 1 ? 's' : ''}`
                    }
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Expand/Collapse Details Button */}
      {!isEditing && (
        <div className="px-4 pb-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-center space-x-2 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <span>{showDetails ? 'Hide Details' : 'Show Details'}</span>
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      )}
    </div>
  );
}