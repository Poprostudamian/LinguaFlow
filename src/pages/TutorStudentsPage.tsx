// src/pages/TutorStudentsPage.tsx - MODERN REDESIGN

import React, { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Search, 
  Filter, 
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
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTutorStudents } from '../contexts/StudentsContext';
import { inviteStudent, InviteStudentData } from '../lib/supabase';

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
  const colors = {
    purple: 'from-purple-600 to-purple-700',
    blue: 'from-blue-600 to-blue-700',
    green: 'from-green-600 to-green-700',
    orange: 'from-orange-600 to-orange-700'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`bg-gradient-to-r ${colors[color]} p-3 rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

// ============================================================================
// ENHANCED STUDENT CARD
// ============================================================================
interface EnhancedStudentCardProps {
  student: StudentCardData;
  onSendMessage?: (studentId: string) => void;
}

function EnhancedStudentCard({ student, onSendMessage }: EnhancedStudentCardProps) {
  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'from-green-600 to-green-700';
    if (progress >= 50) return 'from-blue-600 to-blue-700';
    if (progress >= 25) return 'from-yellow-600 to-yellow-700';
    return 'from-red-600 to-red-700';
  };

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
            {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {student.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{student.email}</p>
          </div>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
          {student.status}
        </span>
      </div>

      {/* Level Badge */}
      <div className="inline-flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium mb-4">
        <Award className="h-4 w-4 mr-1" />
        {student.level}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Progress</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{student.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full bg-gradient-to-r ${getProgressColor(student.progress)} transition-all duration-500`}
            style={{ width: `${student.progress}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <BookOpen className="h-5 w-5 text-blue-500" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Lessons</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{student.lessonsCompleted}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <Clock className="h-5 w-5 text-green-500" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Hours</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{student.totalHours}h</p>
          </div>
        </div>
      </div>

      {/* Joined Date */}
      {student.joinedDate && (
        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mb-4">
          <Calendar className="h-3 w-3" />
          <span>Joined {new Date(student.joinedDate).toLocaleDateString()}</span>
        </div>
      )}

      {/* Actions */}
      <button
        onClick={() => onSendMessage?.(student.id)}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 hover:shadow-md hover:scale-105"
      >
        <Mail className="h-4 w-4" />
        <span>Send Message</span>
      </button>
    </div>
  );
}

// ============================================================================
// INVITATION CARD
// ============================================================================
interface InvitationCardProps {
  invitation: {
    id: string;
    student_email: string;
    status: string;
    invited_at: string;
    expires_at: string | null;
  };
}

function InvitationCard({ invitation }: InvitationCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
          icon: Clock,
          label: 'Pending'
        };
      case 'accepted':
        return {
          color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
          icon: CheckCircle,
          label: 'Accepted'
        };
      case 'declined':
        return {
          color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
          icon: XCircle,
          label: 'Declined'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
          icon: AlertCircle,
          label: 'Expired'
        };
    }
  };

  const config = getStatusConfig(invitation.status);
  const StatusIcon = config.icon;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <p className="font-medium text-gray-900 dark:text-white">{invitation.student_email}</p>
          </div>
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Invited {new Date(invitation.invited_at).toLocaleDateString()}</span>
            {invitation.expires_at && (
              <span>Expires {new Date(invitation.expires_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {config.label}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function TutorStudentsPage() {
  const { session } = useAuth();
  const {
    students,
    invitations,
    isLoading,
    error,
    totalStudents,
    activeStudents,
    pendingInvitations,
    refreshAll,
  } = useTutorStudents();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Invite form state
  const [inviteForm, setInviteForm] = useState<InviteStudentData>({
    studentEmail: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Handle invite submission
  const handleInviteSubmit = async () => {
    if (!session?.user?.id || !inviteForm.studentEmail.trim()) {
      setToast({ type: 'error', message: 'Please enter a valid email address' });
      return;
    }

    setIsSubmitting(true);

    try {
      await inviteStudent(session.user.id, {
        studentEmail: inviteForm.studentEmail.trim(),
        message: inviteForm.message.trim() || undefined
      });

      setToast({ type: 'success', message: `Invitation sent to ${inviteForm.studentEmail}!` });
      setInviteForm({ studentEmail: '', message: '' });
      setShowInviteModal(false);
      refreshAll();

    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to send invitation' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading students...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div>
            <h3 className="text-red-800 dark:text-red-200 font-medium">Error</h3>
            <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* CSS Animations */}
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>

      {/* Toast */}
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Students
          </h1>
          <p className="text-gray-600 dark:text-gray-400 flex items-center space-x-2">
            <Activity className="h-4 w-4 text-green-500" />
            <span>Manage your student relationships</span>
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshAll}
            className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
          >
            <UserPlus className="h-4 w-4" />
            <span>Invite Student</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard
          title="Total Students"
          value={totalStudents}
          icon={Users}
          color="purple"
        />
        <KPICard
          title="Active Students"
          value={activeStudents}
          icon={TrendingUp}
          color="blue"
        />
        <KPICard
          title="Pending Invitations"
          value={pendingInvitations}
          icon={Mail}
          color="orange"
        />
        <KPICard
          title="Avg. Progress"
          value={`${Math.round(convertedStudents.reduce((acc, s) => acc + s.progress, 0) / (convertedStudents.length || 1))}%`}
          icon={Award}
          color="green"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-1 inline-flex space-x-1">
        {[
          { id: 'all' as TabType, label: 'All Students', count: convertedStudents.length },
          { id: 'active' as TabType, label: 'Active', count: activeStudents },
          { id: 'invitations' as TabType, label: 'Invitations', count: invitations.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
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
                placeholder="Search by name or email..."
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
                {searchTerm ? 'No students found' : 'No students yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Invite your first student to get started'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Invite Student</span>
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
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {invitations.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No invitations sent
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Start by inviting students to join your classes
              </p>
              <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
              >
                <UserPlus className="h-4 w-4" />
                <span>Send Invitation</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map(invitation => (
                <InvitationCard key={invitation.id} invitation={invitation} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <Mail className="h-5 w-5 text-purple-600" />
                <span>Invite New Student</span>
              </h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Student Email *
                </label>
                <input
                  type="email"
                  value={inviteForm.studentEmail}
                  onChange={(e) => setInviteForm({ ...inviteForm, studentEmail: e.target.value })}
                  placeholder="student@example.com"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                  placeholder="Add a personal message..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                  {inviteForm.message.length}/500
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteSubmit}
                  disabled={isSubmitting || !inviteForm.studentEmail.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send Invitation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}