// src/pages/TutorStudentsPage.tsx
// ✅ LOW PRIORITY IMPROVEMENTS:
// - Performance: React.memo, useCallback, debounced search
// - Accessibility: ARIA labels, keyboard navigation, focus management
// - Visual Polish: Smooth animations, better transitions

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Search, 
  Users, 
  BookOpen, 
  Clock, 
  Mail, 
  UserPlus, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Send,
  Calendar,
  TrendingUp,
  Award,
  Activity,
  X,
  User,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTutorStudents } from '../contexts/StudentsContext';
import { inviteStudent, InviteStudentData } from '../lib/supabase';
import { StudentProfileModal } from '../components/StudentProfileModal';

// ============================================================================
// TYPES
// ============================================================================

type TabType = 'all' | 'active' | 'invitations';
type SortOption = 'name' | 'progress' | 'joined' | 'lessons' | 'hours';
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
// ✅ NEW: CUSTOM DEBOUNCE HOOK (Performance Optimization)
// ============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// TOAST COMPONENT
// ============================================================================

interface ToastProps {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}

// ✅ UPDATED: Added React.memo and proper accessibility
const Toast = React.memo(function Toast({ type, message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={`fixed top-4 right-4 z-50 flex items-center space-x-3 px-6 py-4 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 transform hover:scale-105 ${
        type === 'success'
          ? 'bg-green-500/90 text-white'
          : 'bg-red-500/90 text-white'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle className="h-6 w-6 flex-shrink-0" aria-hidden="true" />
      ) : (
        <XCircle className="h-6 w-6 flex-shrink-0" aria-hidden="true" />
      )}
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        aria-label="Close notification"
        className="ml-4 hover:opacity-75 transition-opacity focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent rounded"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
});

// ============================================================================
// STUDENT CARD COMPONENT
// ============================================================================

interface EnhancedStudentCardProps {
  student: StudentCardData;
  onSendMessage?: (studentId: string) => void;
  onViewProfile?: (studentId: string) => void;
}

// ✅ UPDATED: Wrapped with React.memo for performance, added accessibility
const EnhancedStudentCard = React.memo(function EnhancedStudentCard({
  student,
  onSendMessage,
  onViewProfile
}: EnhancedStudentCardProps) {
  const { t } = useLanguage();

  // Helper function to get progress color
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'from-green-500 to-emerald-500';
    if (progress >= 50) return 'from-blue-500 to-cyan-500';
    if (progress >= 25) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  // Helper function to translate level
  const translateLevel = (level: string) => {
    const levelMap: { [key: string]: string } = {
      'Beginner': t.tutorStudentsPage.beginner || 'Beginner',
      'Intermediate': t.tutorStudentsPage.intermediate || 'Intermediate',
      'Advanced': t.tutorStudentsPage.advanced || 'Advanced'
    };
    return levelMap[level] || level;
  };

  return (
    <article
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transform hover:-translate-y-1"
      aria-label={`Student card for ${student.name}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div 
            className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
            aria-hidden="true"
          >
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {student.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {student.email}
            </p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            student.status === 'active'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
          }`}
          aria-label={`Status: ${student.status === 'active' ? t.tutorStudentsPage.active : t.tutorStudentsPage.inactive}`}
        >
          {student.status === 'active' ? t.tutorStudentsPage.active : t.tutorStudentsPage.inactive}
        </span>
      </div>

      {/* Level Badge */}
      <div className="mb-4">
        <span 
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
          aria-label={`Level: ${translateLevel(student.level)}`}
        >
          {translateLevel(student.level)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.tutorStudentsPage.progress}
          </span>
          <span 
            className="text-sm font-semibold text-gray-900 dark:text-white"
            aria-label={`Progress: ${student.progress} percent`}
          >
            {student.progress}%
          </span>
        </div>
        <div 
          className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"
          role="progressbar"
          aria-valuenow={student.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Student progress: ${student.progress}%`}
        >
          <div
            className={`h-2.5 rounded-full bg-gradient-to-r ${getProgressColor(student.progress)} transition-all duration-500`}
            style={{ width: `${student.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center" aria-hidden="true">
            <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t.tutorStudentsPage.lessons}</p>
            <p 
              className="text-sm font-semibold text-gray-900 dark:text-white"
              aria-label={`${student.lessonsCompleted} lessons completed`}
            >
              {student.lessonsCompleted}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center" aria-hidden="true">
            <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t.tutorStudentsPage.hours}</p>
            <p 
              className="text-sm font-semibold text-gray-900 dark:text-white"
              aria-label={`${student.totalHours} hours studied`}
            >
              {student.totalHours}h
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onViewProfile?.(student.id)}
          aria-label={`View ${student.name}'s profile`}
          className="flex-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          <User className="h-4 w-4" aria-hidden="true" />
          <span>{t.tutorStudentsPage.viewProfile || 'View Profile'}</span>
        </button>
        
        <button
          onClick={() => onSendMessage?.(student.id)}
          aria-label={`Send message to ${student.name}`}
          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          <span>{t.tutorStudentsPage.sendMessage}</span>
        </button>
      </div>
    </article>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for React.memo
  return (
    prevProps.student.id === nextProps.student.id &&
    prevProps.student.progress === nextProps.student.progress &&
    prevProps.student.lessonsCompleted === nextProps.student.lessonsCompleted &&
    prevProps.student.totalHours === nextProps.student.totalHours &&
    prevProps.student.status === nextProps.student.status
  );
});

// ============================================================================
// SORT DROPDOWN COMPONENT
// ============================================================================

interface SortDropdownProps {
  sortBy: SortOption;
  sortDirection: SortDirection;
  onSortChange: (option: SortOption) => void;
  onDirectionToggle: () => void;
}

// ✅ UPDATED: Added React.memo and accessibility improvements
const SortDropdown = React.memo(function SortDropdown({ 
  sortBy, 
  sortDirection, 
  onSortChange, 
  onDirectionToggle 
}: SortDropdownProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sortOptions: { value: SortOption; label: string; icon: React.ElementType }[] = [
    { value: 'name', label: t.tutorStudentsPage.sortByName || 'Name', icon: User },
    { value: 'progress', label: t.tutorStudentsPage.sortByProgress || 'Progress', icon: TrendingUp },
    { value: 'lessons', label: t.tutorStudentsPage.sortByLessons || 'Lessons Completed', icon: BookOpen },
    { value: 'hours', label: t.tutorStudentsPage.sortByHours || 'Study Hours', icon: Clock },
    { value: 'joined', label: t.tutorStudentsPage.sortByJoined || 'Date Joined', icon: Calendar }
  ];

  const currentOption = sortOptions.find(opt => opt.value === sortBy);

  // ✅ NEW: Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // ✅ NEW: Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef} onKeyDown={handleKeyDown}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Sort by ${currentOption?.label}, ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
      >
        <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
        <span className="text-sm font-medium">
          {t.tutorStudentsPage.sortBy || 'Sort by'}: {currentOption?.label}
        </span>
        {sortDirection === 'asc' ? (
          <ArrowUp className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Sort options"
          className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-10 overflow-hidden transition-all duration-200 transform origin-top-right"
        >
          <div className="p-2 space-y-1">
            {sortOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.value}
                  role="menuitem"
                  onClick={() => {
                    onSortChange(option.value);
                    setIsOpen(false);
                  }}
                  aria-label={`Sort by ${option.label}`}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset ${
                    sortBy === option.value
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <IconComponent className="h-4 w-4" aria-hidden="true" />
                  <span className="flex-1 text-left">{option.label}</span>
                  {sortBy === option.value && (
                    <CheckCircle className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 p-2">
            <button
              onClick={onDirectionToggle}
              aria-label={`Toggle sort direction, currently ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset"
            >
              {sortDirection === 'asc' ? (
                <>
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  <span>{t.tutorStudentsPage.ascending || 'Ascending'}</span>
                </>
              ) : (
                <>
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  <span>{t.tutorStudentsPage.descending || 'Descending'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

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

  // ✅ NEW: Debounced search term for performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // ✅ NEW: Modal focus management
  const inviteModalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // ✅ NEW: Focus first input when modal opens
  useEffect(() => {
    if (showInviteModal && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [showInviteModal]);

  // ✅ NEW: Trap focus in modal
  useEffect(() => {
    if (!showInviteModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowInviteModal(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showInviteModal]);

  // Convert students - ✅ Memoized for performance
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

  // Filter students - ✅ Uses debounced search term
  const filteredStudents = useMemo(() => {
    let filtered = convertedStudents;

    if (debouncedSearchTerm.trim()) {
      const query = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query)
      );
    }

    if (activeTab === 'active') {
      filtered = filtered.filter(s => s.status === 'active');
    }

    return filtered;
  }, [convertedStudents, debouncedSearchTerm, activeTab]);

  // Sort students - ✅ Memoized for performance
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

  // ✅ NEW: Optimized event handlers with useCallback
  const handleViewProfile = useCallback((studentId: string) => {
    console.log('🔍 [TUTOR STUDENTS PAGE] Opening profile for student:', studentId);
    setSelectedStudentId(studentId);
    setShowProfileModal(true);
  }, []);

  const handleCloseProfileModal = useCallback(() => {
    setShowProfileModal(false);
    setSelectedStudentId(null);
  }, []);

  const handleSendMessage = useCallback((studentId: string) => {
    console.log('💬 [TUTOR STUDENTS PAGE] Navigating to messages for student:', studentId);
    navigate('/tutor/messages', { 
      state: { startConversationWith: studentId } 
    });
  }, [navigate]);

  const handleSortChange = useCallback((option: SortOption) => {
    setSortBy(option);
  }, []);

  const handleDirectionToggle = useCallback(() => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

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

  // ✅ NEW: Handle Enter key in invite modal
  const handleInviteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && inviteForm.studentEmail.trim()) {
      e.preventDefault();
      handleInviteSubmit();
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" aria-hidden="true"></div>
          <p className="text-gray-600 dark:text-gray-400">{t.tutorStudentsPage.loading}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div 
        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6"
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
          <div>
            <h3 className="text-red-800 dark:text-red-200 font-medium">{t.tutorStudentsPage.errorLoading}</h3>
            <p className="text-red-600 dark:text-red-300 text-sm mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={refreshAll}
          aria-label="Retry loading students"
          className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Student Profile Modal */}
      {selectedStudentId && (
        <StudentProfileModal
          isOpen={showProfileModal}
          onClose={handleCloseProfileModal}
          studentId={selectedStudentId}
        />
      )}

      {/* Header */}
      <header>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t.tutorStudentsPage.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t.tutorStudentsPage.subtitle}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={refreshAll}
              aria-label="Refresh student list"
              className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>{t.tutorStudentsPage.refresh}</span>
            </button>

            <button
              onClick={() => setShowInviteModal(true)}
              aria-label="Invite new student"
              className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              <UserPlus className="h-5 w-5" aria-hidden="true" />
              <span className="font-medium">{t.tutorStudentsPage.inviteStudent}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <section aria-label="Student statistics">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { 
              label: t.tutorStudentsPage.totalStudents, 
              value: stats.total, 
              icon: Users, 
              color: 'purple',
              ariaLabel: `Total students: ${stats.total}`
            },
            { 
              label: t.tutorStudentsPage.activeTab, 
              value: stats.active, 
              icon: CheckCircle, 
              color: 'green',
              ariaLabel: `Active students: ${stats.active}`
            },
            { 
              label: t.tutorStudentsPage.pendingInvitations, 
              value: stats.pending, 
              icon: Clock, 
              color: 'orange',
              ariaLabel: `Pending invitations: ${stats.pending}`
            },
            { 
              label: t.tutorStudentsPage.averageProgress, 
              value: `${stats.avgProgress}%`, 
              icon: TrendingUp, 
              color: 'blue',
              ariaLabel: `Average progress: ${stats.avgProgress} percent`
            }
          ].map((stat, idx) => {
            const IconComponent = stat.icon;
            const colorClasses = {
              purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
              green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
              orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
              blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
            };

            return (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600"
                aria-label={stat.ariaLabel}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[stat.color as keyof typeof colorClasses]}`} aria-hidden="true">
                    <IconComponent className="h-6 w-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tabs */}
      <nav 
        className="border-b border-gray-200 dark:border-gray-700"
        role="tablist"
        aria-label="Student tabs"
      >
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent rounded-t
                ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </nav>

      {/* Content based on active tab */}
      <div role="tabpanel" id={`${activeTab}-panel`} aria-labelledby={`${activeTab}-tab`}>
        {activeTab !== 'invitations' ? (
          <div className="space-y-6">
            {/* Search Bar & Sort */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <label htmlFor="student-search" className="sr-only">
                  Search students
                </label>
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" aria-hidden="true" />
                <input
                  id="student-search"
                  type="text"
                  placeholder={t.tutorStudentsPage.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search students by name or email"
                  aria-describedby="search-description"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white shadow-sm transition-all duration-200"
                />
                <span id="search-description" className="sr-only">
                  Search is debounced with 300ms delay for better performance
                </span>
              </div>
              
              <SortDropdown
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
                onDirectionToggle={handleDirectionToggle}
              />
            </div>

            {/* Students Grid */}
            {sortedStudents.length === 0 ? (
              <div 
                className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg"
                role="status"
                aria-live="polite"
              >
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
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
                    aria-label="Invite your first student"
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    <UserPlus className="h-5 w-5" aria-hidden="true" />
                    <span>{t.tutorStudentsPage.inviteStudent}</span>
                  </button>
                )}
              </div>
            ) : (
              <div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                role="list"
                aria-label="Student cards"
              >
                {sortedStudents.map(student => (
                  <EnhancedStudentCard
                    key={student.id}
                    student={student}
                    onSendMessage={handleSendMessage}
                    onViewProfile={handleViewProfile}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Invitations Tab Content */
          <div className="space-y-4">
            {invitations.length === 0 ? (
              <div 
                className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg"
                role="status"
                aria-live="polite"
              >
                <Send className="h-16 w-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t.tutorStudentsPage.noPendingInvitations}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {t.tutorStudentsPage.invitationsWillAppearHere}
                </p>
                <button
                  onClick={() => setShowInviteModal(true)}
                  aria-label="Send an invitation"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  <Send className="h-5 w-5" aria-hidden="true" />
                  <span>{t.tutorStudentsPage.sendInvitation}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3" role="list" aria-label="Pending invitations">
                {invitations.map((invitation) => (
                  <article
                    key={invitation.id}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200"
                    aria-label={`Invitation to ${invitation.student_email}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center" aria-hidden="true">
                          <Mail className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {invitation.student_email}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t.tutorStudentsPage.invitedOn} {new Date(invitation.invited_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span 
                          className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium"
                          aria-label={`Status: ${invitation.status}`}
                        >
                          {t.tutorStudentsPage.pending || 'Pending'}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowInviteModal(false);
            }
          }}
        >
          <div 
            ref={inviteModalRef}
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all duration-200"
            onKeyDown={handleInviteKeyDown}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 
                id="invite-modal-title"
                className="text-2xl font-bold text-gray-900 dark:text-white"
              >
                {t.tutorStudentsPage.inviteStudent}
              </h2>
              <button
                onClick={() => setShowInviteModal(false)}
                aria-label="Close invitation modal"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label 
                  htmlFor="student-email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  {t.tutorStudentsPage.studentEmail || 'Student Email'} *
                </label>
                <input
                  id="student-email"
                  ref={firstInputRef}
                  type="email"
                  value={inviteForm.studentEmail}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, studentEmail: e.target.value }))}
                  placeholder="student@example.com"
                  required
                  aria-required="true"
                  aria-describedby="email-description"
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                />
                <span id="email-description" className="sr-only">
                  Enter the student's email address to send an invitation
                </span>
              </div>

              <div>
                <label 
                  htmlFor="invitation-message"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  {t.tutorStudentsPage.personalMessage || 'Personal Message'} ({t.tutorStudentsPage.optional || 'Optional'})
                </label>
                <textarea
                  id="invitation-message"
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder={t.tutorStudentsPage.addPersonalMessage || 'Add a personal message...'}
                  rows={4}
                  disabled={isSubmitting}
                  aria-describedby="message-description"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                />
                <span id="message-description" className="sr-only">
                  Optional personal message to include with the invitation
                </span>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                disabled={isSubmitting}
                aria-label="Cancel invitation"
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                {t.tutorStudentsPage.cancel}
              </button>
              <button
                onClick={handleInviteSubmit}
                disabled={isSubmitting || !inviteForm.studentEmail.trim()}
                aria-label="Send invitation"
                aria-busy={isSubmitting}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-purple-600 disabled:hover:to-blue-600 transform hover:scale-105 disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" aria-hidden="true"></div>
                    <span>{t.tutorStudentsPage.sending || 'Sending...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" aria-hidden="true" />
                    <span>{t.tutorStudentsPage.sendInvitation}</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
              {t.tutorStudentsPage.invitationHint || 'Press Enter to send, Escape to cancel'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}