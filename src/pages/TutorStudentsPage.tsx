// src/pages/TutorStudentsPage.tsx
// ✅ UPDATED: Added MEDIUM PRIORITY features
// - Bulk Actions (multi-select, bulk assign, bulk message)
// - Export to CSV functionality
// - Skeleton Loading States

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTutorStudents } from '../contexts/StudentsContext';
import { inviteStudent } from '../lib/supabase';
import {
  Users,
  UserPlus,
  Search,
  Mail,
  User,
  BookOpen,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  X,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  CheckSquare,
  Square,
  Trash2,
  Archive,
  Send
} from 'lucide-react';
import { StudentProfileModal } from '../components/StudentProfileModal';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type TabType = 'all' | 'active' | 'invitations';
type SortOption = 'name' | 'progress' | 'lessons' | 'hours' | 'joined';
type SortDirection = 'asc' | 'desc';

interface StudentCardData {
  id: string;
  name: string;
  email: string;
  level: string;
  progress: number;
  lessonsCompleted: number;
  totalHours: number;
  status: string;
  joinedDate?: string;
}

// ============================================================================
// ✅ NEW: SKELETON LOADING COMPONENT
// ============================================================================

function StudentCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
        <div className="w-16 h-6 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
      </div>

      {/* Badge Skeleton */}
      <div className="mb-4">
        <div className="w-20 h-6 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
      </div>

      {/* Progress Bar Skeleton */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-8"></div>
        </div>
        <div className="w-full h-2.5 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
          <div className="space-y-1">
            <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded w-12"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-8"></div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
          <div className="space-y-1">
            <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded w-12"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-8"></div>
          </div>
        </div>
      </div>

      {/* Buttons Skeleton */}
      <div className="flex space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex-1 h-10 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
        <div className="flex-1 h-10 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  );
}

// ============================================================================
// ✅ NEW: BULK ACTION TOOLBAR
// ============================================================================

interface BulkActionToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkAssignLessons: () => void;
  onBulkSendMessages: () => void;
  onBulkArchive: () => void;
}

function BulkActionToolbar({
  selectedCount,
  onClearSelection,
  onBulkAssignLessons,
  onBulkSendMessages,
  onBulkArchive
}: BulkActionToolbarProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6 animate-slide-down">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CheckSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span className="font-medium text-gray-900 dark:text-white">
              {selectedCount} {t.tutorStudentsPage?.selected || 'selected'}
            </span>
          </div>
          
          <button
            onClick={onClearSelection}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {t.tutorStudentsPage?.clearSelection || 'Clear selection'}
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onBulkAssignLessons}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <BookOpen className="h-4 w-4" />
            <span>{t.tutorStudentsPage?.bulkAssignLessons || 'Assign Lessons'}</span>
          </button>

          <button
            onClick={onBulkSendMessages}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Send className="h-4 w-4" />
            <span>{t.tutorStudentsPage?.bulkSendMessages || 'Send Messages'}</span>
          </button>

          <button
            onClick={onBulkArchive}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Archive className="h-4 w-4" />
            <span>{t.tutorStudentsPage?.bulkArchive || 'Archive'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getProgressColor = (progress: number): string => {
  if (progress >= 80) return 'from-green-500 to-emerald-500';
  if (progress >= 50) return 'from-blue-500 to-cyan-500';
  if (progress >= 25) return 'from-yellow-500 to-orange-500';
  return 'from-red-500 to-pink-500';
};

const translateLevel = (level: string): string => {
  const levelMap: { [key: string]: string } = {
    'Beginner': 'Początkujący',
    'Intermediate': 'Średniozaawansowany',
    'Advanced': 'Zaawansowany',
    'Native': 'Ojczysty'
  };
  return levelMap[level] || level;
};

// ✅ NEW: Export to CSV function
const exportToCSV = (students: StudentCardData[], filename: string = 'students.csv') => {
  // CSV headers
  const headers = ['Name', 'Email', 'Level', 'Progress (%)', 'Lessons Completed', 'Study Hours', 'Status', 'Joined Date'];
  
  // CSV rows
  const rows = students.map(student => [
    student.name,
    student.email,
    student.level,
    student.progress.toString(),
    student.lessonsCompleted.toString(),
    student.totalHours.toString(),
    student.status,
    student.joinedDate ? new Date(student.joinedDate).toLocaleDateString() : 'N/A'
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ============================================================================
// TOAST COMPONENT
// ============================================================================

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
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
}

function KPICard({ title, value, icon: Icon, color }: KPICardProps) {
  const colors = {
    purple: 'from-purple-600 to-purple-700',
    blue: 'from-blue-600 to-blue-700',
    green: 'from-green-600 to-green-700',
    orange: 'from-orange-600 to-orange-700'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`w-12 h-12 bg-gradient-to-br ${colors[color]} rounded-lg flex items-center justify-center`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ENHANCED STUDENT CARD WITH CHECKBOX
// ============================================================================

interface EnhancedStudentCardProps {
  student: StudentCardData;
  onSendMessage?: (id: string) => void;
  onViewProfile?: (id: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  selectionMode?: boolean;
}

function EnhancedStudentCard({ 
  student, 
  onSendMessage, 
  onViewProfile,
  isSelected = false,
  onToggleSelect,
  selectionMode = false
}: EnhancedStudentCardProps) {
  const { t } = useLanguage();

  return (
    <div className={`
      bg-white dark:bg-gray-800 rounded-xl border-2 transition-all duration-200
      ${isSelected 
        ? 'border-purple-500 dark:border-purple-400 shadow-lg' 
        : 'border-gray-200 dark:border-gray-700 hover:shadow-md'
      }
    `}>
      {/* Header with Avatar */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1">
            {/* ✅ NEW: Selection Checkbox */}
            {selectionMode && (
              <button
                onClick={() => onToggleSelect?.(student.id)}
                className="flex-shrink-0"
              >
                {isSelected ? (
                  <CheckSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                ) : (
                  <Square className="h-5 w-5 text-gray-400 hover:text-purple-600 transition-colors" />
                )}
              </button>
            )}

            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md">
              {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {student.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {student.email}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            student.status === 'active' 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
          }`}>
            {student.status === 'active' ? t.tutorStudentsPage.active : t.tutorStudentsPage.inactive}
          </span>
        </div>

        {/* Level Badge */}
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
            {translateLevel(student.level)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.tutorStudentsPage.progress}
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {student.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full bg-gradient-to-r ${getProgressColor(student.progress)} transition-all duration-300`}
              style={{ width: `${student.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.tutorStudentsPage.lessons}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{student.lessonsCompleted}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.tutorStudentsPage.hours}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{student.totalHours}h</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onViewProfile?.(student.id)}
            className="flex-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 hover:scale-105"
          >
            <User className="h-4 w-4" />
            <span>{t.tutorStudentsPage.viewProfile || 'View Profile'}</span>
          </button>
          
          <button
            onClick={() => onSendMessage?.(student.id)}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 hover:scale-105"
          >
            <Mail className="h-4 w-4" />
            <span>{t.tutorStudentsPage.sendMessage}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SORT DROPDOWN COMPONENT
// ============================================================================

interface SortDropdownProps {
  sortBy: SortOption;
  sortDirection: SortDirection;
  onSortChange: (option: SortOption) => void;
  onDirectionToggle: () => void;
}

function SortDropdown({ sortBy, sortDirection, onSortChange, onDirectionToggle }: SortDropdownProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const sortOptions: { value: SortOption; label: string; icon: React.ElementType }[] = [
    { value: 'name', label: t.tutorStudentsPage.sortByName || 'Name', icon: User },
    { value: 'progress', label: t.tutorStudentsPage.sortByProgress || 'Progress', icon: TrendingUp },
    { value: 'lessons', label: t.tutorStudentsPage.sortByLessons || 'Lessons Completed', icon: BookOpen },
    { value: 'hours', label: t.tutorStudentsPage.sortByHours || 'Study Hours', icon: Clock },
    { value: 'joined', label: t.tutorStudentsPage.sortByJoined || 'Date Joined', icon: Calendar }
  ];

  const currentOption = sortOptions.find(opt => opt.value === sortBy);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <ArrowUpDown className="h-4 w-4" />
        <span className="text-sm font-medium">{t.tutorStudentsPage.sortBy || 'Sort by'}: {currentOption?.label}</span>
        {sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
            <div className="p-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2">
                {t.tutorStudentsPage.sortBy || 'Sort by'}
              </p>
              {sortOptions.map(option => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSortChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                      sortBy === option.value
                        ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{option.label}</span>
                    {sortBy === option.value && <CheckCircle className="h-4 w-4 ml-auto" />}
                  </button>
                );
              })}
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 p-2">
              <button
                onClick={() => {
                  onDirectionToggle();
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {sortDirection === 'asc' ? (
                  <div className="flex items-center space-x-1">
                    <ArrowUp className="h-4 w-4" />
                    <span>{t.tutorStudentsPage.ascending || 'Ascending'}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <ArrowDown className="h-4 w-4" />
                    <span>{t.tutorStudentsPage.descending || 'Descending'}</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TutorStudentsPage() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const navigate = useNavigate();
  const { students, invitations, refreshAll, isLoading, error } = useTutorStudents();
  
  // State
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ studentEmail: '', message: '' });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Sorting state
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Profile Modal State
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // ✅ NEW: Bulk selection state
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  // Convert students
  const convertedStudents = useMemo(() => {
    return students.map(tutorStudent => ({
      id: tutorStudent.student_id,
      name: `${tutorStudent.student_first_name} ${tutorStudent.student_last_name}`,
      email: tutorStudent.student_email,
      level: tutorStudent.level || 'Beginner',
      progress: tutorStudent.progress || 0,
      lessonsCompleted: tutorStudent.lessonsCompleted || 0,
      totalHours: tutorStudent.totalHours || 0,
      status: tutorStudent.status || 'active',
      joinedDate: tutorStudent.relationship_created
    }));
  }, [students]);

  // Filter students
  const filteredStudents = useMemo(() => {
    let filtered = convertedStudents;

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query)
      );
    }

    if (activeTab === 'active') {
      filtered = filtered.filter(s => s.status === 'active');
    }

    return filtered;
  }, [convertedStudents, searchTerm, activeTab]);

  // Sort students
  const sortedStudents = useMemo(() => {
    const sorted = [...filteredStudents].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'progress':
          comparison = a.progress - b.progress;
          break;
        case 'lessons':
          comparison = a.lessonsCompleted - b.lessonsCompleted;
          break;
        case 'hours':
          comparison = a.totalHours - b.totalHours;
          break;
        case 'joined':
          const dateA = new Date(a.joinedDate || 0).getTime();
          const dateB = new Date(b.joinedDate || 0).getTime();
          comparison = dateA - dateB;
          break;
        default:
          comparison = 0;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredStudents, sortBy, sortDirection]);

  // ✅ NEW: Handle bulk selection
  const handleToggleSelect = (studentId: string) => {
    setSelectedStudentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.size === sortedStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(sortedStudents.map(s => s.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedStudentIds(new Set());
    setSelectionMode(false);
  };

  // ✅ NEW: Bulk actions handlers
  const handleBulkAssignLessons = () => {
    const selectedCount = selectedStudentIds.size;
    setToast({ 
      type: 'success', 
      message: `Opening lesson assignment for ${selectedCount} student${selectedCount > 1 ? 's' : ''}...` 
    });
    // TODO: Implement bulk lesson assignment modal
    console.log('Bulk assign lessons to:', Array.from(selectedStudentIds));
  };

  const handleBulkSendMessages = () => {
    const selectedCount = selectedStudentIds.size;
    // Navigate to messages with multiple recipients
    navigate('/tutor/messages', { 
      state: { 
        bulkMessage: true,
        recipientIds: Array.from(selectedStudentIds)
      } 
    });
  };

  const handleBulkArchive = () => {
    const selectedCount = selectedStudentIds.size;
    if (confirm(`Are you sure you want to archive ${selectedCount} student${selectedCount > 1 ? 's' : ''}?`)) {
      setToast({ 
        type: 'success', 
        message: `${selectedCount} student${selectedCount > 1 ? 's' : ''} archived successfully` 
      });
      setSelectedStudentIds(new Set());
      setSelectionMode(false);
      // TODO: Implement bulk archive API call
    }
  };

  // ✅ NEW: Export to CSV handler
  const handleExportCSV = () => {
    const dataToExport = selectedStudentIds.size > 0
      ? sortedStudents.filter(s => selectedStudentIds.has(s.id))
      : sortedStudents;
    
    const filename = `students_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(dataToExport, filename);
    
    setToast({ 
      type: 'success', 
      message: `Exported ${dataToExport.length} student${dataToExport.length > 1 ? 's' : ''} to CSV` 
    });
  };

  // Handle View Profile
  const handleViewProfile = (studentId: string) => {
    console.log('🔍 [TUTOR STUDENTS PAGE] Opening profile for student:', studentId);
    setSelectedStudentId(studentId);
    setShowProfileModal(true);
  };

  // Handle Close Profile Modal
  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setSelectedStudentId(null);
  };

  // Handle Send Message
  const handleSendMessage = (studentId: string) => {
    console.log('💬 [TUTOR STUDENTS PAGE] Navigating to messages for student:', studentId);
    navigate('/tutor/messages', { 
      state: { startConversationWith: studentId } 
    });
  };

  // Handle Sort Change
  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
  };

  // Toggle Sort Direction
  const handleDirectionToggle = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Handle invite submission
  const handleInviteSubmit = async () => {
    if (!session?.user?.id || !inviteForm.studentEmail.trim()) {
      setToast({ type: 'error', message: t.tutorStudentsPage.enterValidEmail });
      return;
    }

    setIsSubmitting(true);

    try {
      await inviteStudent(session.user.id, {
        studentEmail: inviteForm.studentEmail.trim(),
        message: inviteForm.message.trim() || undefined
      });

      setToast({ type: 'success', message: `${t.tutorStudentsPage.invitationSent} ${inviteForm.studentEmail}!` });
      setInviteForm({ studentEmail: '', message: '' });
      setShowInviteModal(false);
      refreshAll();

    } catch (err: any) {
      console.error('Error sending invitation:', err);
      setToast({ type: 'error', message: err.message || t.tutorStudentsPage.errorSendingInvitation });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate stats
  const stats = {
    total: students.length,
    active: students.filter(s => s.status === 'active').length,
    pending: invitations.filter(inv => inv.status === 'pending').length,
    avgProgress: students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + (s.progress || 0), 0) / students.length)
      : 0
  };

  // Tabs configuration
  const tabs = [
    { id: 'all' as TabType, label: t.tutorStudentsPage.allStudents, count: stats.total },
    { id: 'active' as TabType, label: t.tutorStudentsPage.activeTab, count: stats.active },
    { id: 'invitations' as TabType, label: t.tutorStudentsPage.invitationsTab, count: stats.pending }
  ];

  // ✅ UPDATED: Loading state with skeletons
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.tutorStudentsPage.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t.tutorStudentsPage.subtitle}</p>
          </div>
        </div>

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
                </div>
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Student Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <StudentCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="text-red-800 dark:text-red-200 font-medium">{t.tutorStudentsPage.errorLoading}</h3>
            <p className="text-red-600 dark:text-red-300 text-sm mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={refreshAll}
          className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-700"
        >
          {t.tutorStudentsPage.refresh}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.tutorStudentsPage.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t.tutorStudentsPage.subtitle}</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* ✅ NEW: Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
          >
            <Download className="h-5 w-5" />
            <span>{t.tutorStudentsPage?.exportCSV || 'Export CSV'}</span>
          </button>

          {/* ✅ NEW: Selection Mode Toggle */}
          <button
            onClick={() => {
              setSelectionMode(!selectionMode);
              if (selectionMode) {
                setSelectedStudentIds(new Set());
              }
            }}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium ${
              selectionMode
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <CheckSquare className="h-5 w-5" />
            <span>{selectionMode ? t.tutorStudentsPage?.exitSelection || 'Exit Selection' : t.tutorStudentsPage?.selectMode || 'Select Mode'}</span>
          </button>

          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium"
          >
            <UserPlus className="h-5 w-5" />
            <span>{t.tutorStudentsPage.inviteStudent}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title={t.tutorStudentsPage.totalStudents}
          value={stats.total}
          icon={Users}
          color="purple"
        />
        <KPICard
          title={t.tutorStudentsPage.activeStudents}
          value={stats.active}
          icon={TrendingUp}
          color="blue"
        />
        <KPICard
          title={t.tutorStudentsPage.pendingInvitations}
          value={stats.pending}
          icon={Mail}
          color="orange"
        />
        <KPICard
          title={t.tutorStudentsPage.averageProgress}
          value={`${stats.avgProgress}%`}
          icon={BookOpen}
          color="green"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200 dark:border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-6 py-3 font-medium transition-all duration-200 border-b-2 -mb-px
              ${activeTab === tab.id
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }
            `}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Content based on active tab */}
      {activeTab !== 'invitations' ? (
        <div className="space-y-6">
          {/* ✅ NEW: Bulk Action Toolbar - shown when students are selected */}
          {selectedStudentIds.size > 0 && (
            <BulkActionToolbar
              selectedCount={selectedStudentIds.size}
              onClearSelection={handleClearSelection}
              onBulkAssignLessons={handleBulkAssignLessons}
              onBulkSendMessages={handleBulkSendMessages}
              onBulkArchive={handleBulkArchive}
            />
          )}

          {/* Search Bar, Sort & Select All */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={t.tutorStudentsPage.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white shadow-sm"
              />
            </div>
            
            {/* Sort Dropdown */}
            <SortDropdown
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSortChange={handleSortChange}
              onDirectionToggle={handleDirectionToggle}
            />

            {/* ✅ NEW: Select All Button (only in selection mode) */}
            {selectionMode && sortedStudents.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {selectedStudentIds.size === sortedStudents.length ? (
                  <>
                    <CheckSquare className="h-4 w-4" />
                    <span className="text-sm font-medium">{t.tutorStudentsPage?.deselectAll || 'Deselect All'}</span>
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4" />
                    <span className="text-sm font-medium">{t.tutorStudentsPage?.selectAll || 'Select All'}</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Students Grid */}
          {sortedStudents.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {searchTerm ? t.tutorStudentsPage.noStudentsFound : t.tutorStudentsPage.noStudentsYet}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm 
                  ? t.tutorStudentsPage.tryAdjustingSearch 
                  : t.tutorStudentsPage.inviteFirstStudent}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <UserPlus className="h-5 w-5" />
                  <span>{t.tutorStudentsPage.inviteStudent}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedStudents.map(student => (
                <EnhancedStudentCard
                  key={student.id}
                  student={student}
                  onSendMessage={handleSendMessage}
                  onViewProfile={handleViewProfile}
                  isSelected={selectedStudentIds.has(student.id)}
                  onToggleSelect={handleToggleSelect}
                  selectionMode={selectionMode}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Invitations Tab Content */
        <div className="space-y-4">
          {invitations.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t.tutorStudentsPage.noPendingInvitations}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t.tutorStudentsPage.noPendingDescription}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map(invitation => (
                <div
                  key={invitation.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {invitation.student_email}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t.tutorStudentsPage.invited} {new Date(invitation.invited_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium">
                        {t.tutorStudentsPage.pending || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t.tutorStudentsPage.inviteStudent}
              </h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.tutorStudentsPage.studentEmail || 'Student Email'} *
                </label>
                <input
                  type="email"
                  value={inviteForm.studentEmail}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, studentEmail: e.target.value }))}
                  placeholder="student@example.com"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.tutorStudentsPage.personalMessage || 'Personal Message'} ({t.tutorStudentsPage.optional || 'Optional'})
                </label>
                <textarea
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder={t.tutorStudentsPage.messagePlaceholder || 'Add a personal note...'}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowInviteModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
                >
                  {t.tutorStudentsPage.cancel || 'Cancel'}
                </button>
                <button
                  onClick={handleInviteSubmit}
                  disabled={isSubmitting || !inviteForm.studentEmail.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t.tutorStudentsPage.sending || 'Sending...' : t.tutorStudentsPage.sendInvitation || 'Send Invitation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Profile Modal */}
      {showProfileModal && selectedStudentId && (
        <StudentProfileModal
          studentId={selectedStudentId}
          onClose={handleCloseProfileModal}
        />
      )}
    </div>
  );
}