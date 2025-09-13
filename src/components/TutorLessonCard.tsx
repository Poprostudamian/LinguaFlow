// src/components/TutorLessonCard.tsx - ODDZIELNY komponent dla tutorów

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
import { useTutorStudents } from '../contexts/StudentsContext';

// Database lesson interface
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

interface TutorLessonCardProps {
  lesson: DatabaseLesson;
  onEdit?: (lessonId: string, updates: any) => Promise<void>;
  onDelete?: (lessonId: string) => Promise<void>;
  onAssignStudents?: (lessonId: string, studentIds: string[]) => Promise<void>;
  onUnassignStudents?: (lessonId: string, studentIds: string[]) => Promise<void>;
}

export function TutorLessonCard({ 
  lesson, 
  onEdit, 
  onDelete, 
  onAssignStudents, 
  onUnassignStudents 
}: TutorLessonCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showStudentManagement, setShowStudentManagement] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // ✅ SAFE: Only call in tutor context
  const { students } = useTutorStudents();
  
  // Edit form state
  const [editData, setEditData] = useState({
    title: lesson.title,
    description: lesson.description || '',
    content: lesson.content || '',
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

  const getStatusBadge = (status: string) => {
    const bgColor = status === 'published' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-yellow-100 dark:bg-yellow-900/20';
    const textColor = status === 'published' ? 'text-green-800 dark:text-green-400' : 'text-yellow-800 dark:text-yellow-400';

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

  // Get students data
  const unassignedStudents = students.filter(student => 
    !(lesson.assignedStudents || []).includes(student.student_id)
  );

  const assignedStudentDetails = students.filter(student =>
    (lesson.assignedStudents || []).includes(student.student_id)
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        {isEditing ? (
          // Edit mode
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