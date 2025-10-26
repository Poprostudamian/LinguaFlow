// src/pages/TutorStudentsPage.tsx

import React, { useState, useMemo } from 'react';
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
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTutorStudents } from '../contexts/StudentsContext';
import { inviteStudent, InviteStudentData } from '../lib/supabase';
import { StudentProfileModal } from '../components/StudentProfileModal'; // ✅ NEW IMPORT

// ... [Keep all the existing interfaces and components until EnhancedStudentCard] ...

type TabType = 'all' | 'active' | 'invitations';

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

// ... [Keep Toast and KPICard components exactly as they are] ...

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

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'purple' | 'blue' | 'green' | 'orange';
  subtitle?: string;
}

function KPICard({ title, value, icon: Icon, color, subtitle }: KPICardProps) {
  const colorClasses = {
    purple: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800',
    blue: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800',
    green: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800',
    orange: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800'
  };

  const iconColorClasses = {
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-200 dark:bg-purple-900/40',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-200 dark:bg-blue-900/40',
    green: 'text-green-600 dark:text-green-400 bg-green-200 dark:bg-green-900/40',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-200 dark:bg-orange-900/40'
  };

  const textColorClasses = {
    purple: 'text-purple-600 dark:text-purple-400',
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    orange: 'text-orange-600 dark:text-orange-400'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-5`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${textColorClasses[color]} mb-1`}>
            {title}
          </p>
          <p className={`text-3xl font-bold ${color === 'purple' ? 'text-purple-900 dark:text-purple-100' : color === 'blue' ? 'text-blue-900 dark:text-blue-100' : color === 'green' ? 'text-green-900 dark:text-green-100' : 'text-orange-900 dark:text-orange-100'}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`${iconColorClasses[color]} p-3 rounded-lg`}>
          <Icon className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ✅ UPDATED STUDENT CARD COMPONENT with onViewProfile
// ============================================================================
interface EnhancedStudentCardProps {
  student: StudentCardData;
  onSendMessage?: (id: string) => void;
  onViewProfile?: (id: string) => void; // ✅ NEW PROP
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
        {/* ✅ NEW: View Profile Button */}
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
// MAIN COMPONENT
// ============================================================================
export function TutorStudentsPage() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const { students, invitations, refreshAll, isLoading, error } = useTutorStudents();
  
  // State
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ studentEmail: '', message: '' });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  
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

const handleSendMessage = (studentId: string) => {
  navigate('/tutor/messages', { 
    state: { startConversationWith: studentId } 
  });
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

      {/* ✅ NEW: Student Profile Modal */}
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
          {/* Search Bar */}
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
          </div>

          {/* Students Grid */}
          {filteredStudents.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? t.tutorStudentsPage.noStudentsFound : t.tutorStudentsPage.noStudentsYet}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm 
                  ? t.tutorStudentsPage.tryAdjustingSearch
                  : t.tutorStudentsPage.inviteFirstStudent
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>{t.tutorStudentsPage.inviteStudent}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {filteredStudents.map(student => (
                <EnhancedStudentCard
                  key={student.id}
                  student={student}
                  onSendMessage={(id) => console.log('Send message to:', id)}
                  onViewProfile={handleViewProfile} // ✅ NEW: Pass handler
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        // Invitations Tab - Keep existing implementation
        <div className="space-y-4 animate-fade-in">
          {/* ... existing invitations code ... */}
          <p className="text-gray-500">Invitations tab content here</p>
        </div>
      )}

      {/* Invite Modal - Keep existing implementation */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {/* ... existing invite modal code ... */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Invite Modal</h3>
            {/* Add full invite modal implementation */}
          </div>
        </div>
      )}
    </div>
  );
}