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
  Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTutorStudents } from '../contexts/StudentsContext';
import { inviteStudent, InviteStudentData } from '../lib/supabase';
import { StudentProfileModal } from '../components/StudentProfileModal';

// ============================================================================
// TYPES
// ============================================================================
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

// ============================================================================
// TOAST COMPONENT
// ============================================================================
interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

function Toast({ message, type, onClose }: ToastProps) {
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
// STUDENT CARD COMPONENT
// ============================================================================
interface StudentCardProps {
  student: StudentCardData;
  onMessage: (studentId: string) => void;
  onViewProfile: (studentId: string) => void; // <-- DODANE
}

function StudentCard({ student, onMessage, onViewProfile }: StudentCardProps) { // <-- ZAKTUALIZOWANE
  const { t } = useLanguage();

  const getLevelColor = (level: string) => {
    const colors = {
      'Beginner': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'Intermediate': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'Advanced': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    };
    return colors[level as keyof typeof colors] || colors['Beginner'];
  };

  const getStatusColor = (status: string) => {
    if (status === 'active') return 'bg-green-500';
    return 'bg-gray-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
      {/* Header with Avatar and Name */}
      <div className="flex items-start space-x-4 mb-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
            {student.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className={`absolute bottom-0 right-0 w-4 h-4 ${getStatusColor(student.status)} rounded-full border-2 border-white dark:border-gray-800`} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {student.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {student.email}
          </p>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getLevelColor(student.level)}`}>
            {student.level}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900 dark:text-white">{student.progress}%</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{t.tutorStudentsPage.progress}</p>
        </div>

        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900 dark:text-white">{student.lessonsCompleted}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{t.tutorStudentsPage.lessons}</p>
        </div>

        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <Clock className="h-4 w-4 text-green-600 dark:text-green-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900 dark:text-white">{student.totalHours}h</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{t.tutorStudentsPage.hours}</p>
        </div>
      </div>

      {/* Join Date */}
      {student.joinedDate && (
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <Calendar className="h-4 w-4" />
          <span>{t.tutorStudentsPage.joined}: {new Date(student.joinedDate).toLocaleDateString()}</span>
        </div>
      )}

      {/* Action Buttons - ZAKTUALIZOWANE */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onViewProfile(student.id)}
          className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <Eye className="h-4 w-4" />
          <span>{t.tutorStudentsPage.viewProfile}</span>
        </button>
        
        <button
          onClick={() => onMessage(student.id)}
          className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
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
  
  // NOWE - State dla profilu studenta
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

    // Search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query)
      );
    }

    // Tab filter
    if (activeTab === 'active') {
      filtered = filtered.filter(s => s.status === 'active');
    }

    return filtered;
  }, [convertedStudents, searchTerm, activeTab]);

// NOWA - Funkcja do otwierania profilu
  const handleViewProfile = (studentId: string) => {
    setSelectedStudentId(studentId);
    setShowProfileModal(true);
  };

  // NOWA - Funkcja do zamykania profilu
  const handleCloseProfile = () => {
    setShowProfileModal(false);
    setSelectedStudentId(null);
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
                  onViewProfile={handleViewProfile}
                />
              ))}
            </div>
          
      {showProfileModal && selectedStudentId && (
        <StudentProfileModal
          studentId={selectedStudentId}
          onClose={handleCloseProfile}
        />
      )}
        </div>
          )}
      
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {invitations.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t.tutorStudentsPage.noPendingInvitations}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {t.tutorStudentsPage.noPendingDescription}
              </p>
            </div>
          ) : (
            invitations.map(invitation => (
              <div
                key={invitation.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Mail className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {t.tutorStudentsPage.invitationTo} {invitation.student_email}
                      </h3>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p>{t.tutorStudentsPage.sentOn}: {new Date(invitation.created_at).toLocaleDateString()}</p>
                      <p>{t.tutorStudentsPage.expiresOn}: {new Date(invitation.expires_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      invitation.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : invitation.status === 'accepted'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                    }`}>
                      {invitation.status === 'pending' && t.tutorStudentsPage.statusPending}
                      {invitation.status === 'accepted' && t.tutorStudentsPage.statusAccepted}
                      {invitation.status === 'expired' && t.tutorStudentsPage.statusExpired}
                      {invitation.status === 'cancelled' && t.tutorStudentsPage.statusCancelled}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t.tutorStudentsPage.inviteModalTitle}
              </h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.tutorStudentsPage.studentEmail}
                </label>
                <input
                  type="email"
                  value={inviteForm.studentEmail}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, studentEmail: e.target.value }))}
                  placeholder={t.tutorStudentsPage.studentEmailPlaceholder}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.tutorStudentsPage.personalMessage}
                </label>
                <textarea
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder={t.tutorStudentsPage.personalMessagePlaceholder}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={handleInviteSubmit}
                  disabled={isSubmitting || !inviteForm.studentEmail.trim()}
                  className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSubmitting ? t.tutorStudentsPage.sending : t.tutorStudentsPage.sendInvitation}</span>
                </button>
                <button
                  onClick={() => setShowInviteModal(false)}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {t.tutorStudentsPage.cancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}