// src/pages/TutorStudentsPage.tsx

import React, { useState, useMemo } from 'react';
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
// ENHANCED STUDENT CARD
// ============================================================================

interface EnhancedStudentCardProps {
  student: StudentCardData;
  onSendMessage?: (id: string) => void;
  onViewProfile?: (id: string) => void;
}

function EnhancedStudentCard({ student, onSendMessage, onViewProfile }: EnhancedStudentCardProps) {
  const { t } = useLanguage();
  
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'from-green-500 to-emerald-600';
    if (progress >= 50) return 'from-blue-500 to-cyan-600';
    if (progress >= 30) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  const getStatusColor = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  const translateLevel = (level: string) => {
    const levelMap: { [key: string]: string } = {
      'Beginner': t.tutorStudentsPage.beginner,
      'Intermediate': t.tutorStudentsPage.intermediate,
      'Advanced': t.tutorStudentsPage.advanced
    };
    return levelMap[level] || level;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
              {student.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{student.email}</p>
          </div>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
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
  );
}

// ============================================================================
// ✅ NEW: SORT DROPDOWN COMPONENT
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
        {sortDirection === 'asc' ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="p-2">
              {sortOptions.map(option => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSortChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      sortBy === option.value
                        ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{option.label}</span>
                    {sortBy === option.value && (
                      <CheckCircle className="h-4 w-4 ml-auto" />
                    )}
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
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span>{t.tutorStudentsPage.sortDirection || 'Direction'}</span>
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
  const navigate = useNavigate(); // ✅ NEW: For navigation
  const { students, invitations, refreshAll, isLoading, error } = useTutorStudents();
  
  // State
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ studentEmail: '', message: '' });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ✅ NEW: Sorting state
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Profile Modal State
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

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

  // ✅ NEW: Sort students
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

  // ✅ NEW: Handle View Profile
  const handleViewProfile = (studentId: string) => {
    console.log('🔍 [TUTOR STUDENTS PAGE] Opening profile for student:', studentId);
    setSelectedStudentId(studentId);
    setShowProfileModal(true);
  };

  // ✅ NEW: Handle Close Profile Modal
  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setSelectedStudentId(null);
  };

  // ✅ NEW: Handle Send Message - Navigate to messages page
  const handleSendMessage = (studentId: string) => {
    console.log('💬 [TUTOR STUDENTS PAGE] Navigating to messages for student:', studentId);
    navigate('/tutor/messages', { 
      state: { startConversationWith: studentId } 
    });
  };

  // ✅ NEW: Handle Sort Change
  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
  };

  // ✅ NEW: Toggle Sort Direction
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t.tutorStudentsPage.loading}</p>
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
          className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
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
            className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>{t.tutorStudentsPage.refresh}</span>
          </button>

          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <UserPlus className="h-5 w-5" />
            <span>{t.tutorStudentsPage.inviteStudent}</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title={t.tutorStudentsPage.totalStudents}
          value={stats.total}
          icon={Users}
          color="purple"
        />
        <KPICard
          title={t.tutorStudentsPage.activeStudents}
          value={stats.active}
          icon={Activity}
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
          icon={TrendingUp}
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
              px-6 py-3 font-medium text-sm border-b-2 transition-colors
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
          {/* Search Bar & Sort - ✅ UPDATED with Sort Dropdown */}
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
            
            {/* ✅ NEW: Sort Dropdown */}
            <SortDropdown
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSortChange={handleSortChange}
              onDirectionToggle={handleDirectionToggle}
            />
          </div>

          {/* Students Grid - ✅ UPDATED to use sortedStudents */}
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
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Invitations Tab Content - Keep existing implementation */
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
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                      {invitation.student_email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {invitation.student_email}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {t.tutorStudentsPage.invitedOn || 'Invited on'}{' '}
                          {new Date(invitation.invited_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium">
                      {t.tutorStudentsPage.pending || 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite Modal - Keep existing implementation */}
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
                  placeholder={t.tutorStudentsPage.messagePlaceholder || 'Add a personal message to your invitation...'}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                disabled={isSubmitting}
              >
                {t.tutorStudentsPage.cancel || 'Cancel'}
              </button>
              <button
                onClick={handleInviteSubmit}
                disabled={isSubmitting || !inviteForm.studentEmail.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>{t.tutorStudentsPage.sending || 'Sending...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>{t.tutorStudentsPage.sendInvitation || 'Send Invitation'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}