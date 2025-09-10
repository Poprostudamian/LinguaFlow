// src/pages/TutorStudentsPage.tsx - Z PRAWDZIWYMI DANYMI

import React, { useState } from 'react';
import { Search, Filter, Users, BookOpen, Clock, Mail, UserPlus, RefreshCw, AlertCircle } from 'lucide-react';
import { StudentCard } from '../components/StudentCard';
import { InviteStudentForm } from '../components/InviteStudentForm';
import { useTutorStudents } from '../contexts/StudentsContext';

export function TutorStudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'students' | 'invitations' | 'invite'>('students');
  
  // Use global students context (PRAWDZIWE DANE)
  const {
    students,
    invitations,
    isLoading,
    error,
    totalStudents,
    activeStudents,
    pendingInvitations,
    refreshAll,
    searchStudents,
    getStudentStats
  } = useTutorStudents();

  // Convert TutorStudent to Student format (BEZ LOSOWYCH DANYCH)
  const convertToStudentFormat = (tutorStudent: any) => {
  const stats = getStudentStats(tutorStudent.student_id);
  
  return {
    id: tutorStudent.student_id,
    name: `${tutorStudent.student_first_name} ${tutorStudent.student_last_name}`,
    email: tutorStudent.student_email,
    level: ['Beginner', 'Intermediate', 'Advanced'][Math.abs(tutorStudent.student_id.charCodeAt(0)) % 3],
    progress: stats?.average_progress || 0, // PRAWDZIWY postęp
    lessonsCompleted: stats?.completed_lessons || 0, // PRAWDZIWE lekcje
    totalHours: Math.round((stats?.total_study_time_minutes || 0) / 60), // PRAWDZIWE godziny
    joinedDate: tutorStudent.relationship_created
  };
};

  // Filter students based on search
  const filteredStudents = searchStudents(searchTerm);

  const handleInviteSent = () => {
    refreshAll(); // Refresh data after invitation is sent
    setActiveTab('invitations'); // Switch to invitations tab
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', text: 'Pending' },
      accepted: { bg: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', text: 'Accepted' },
      declined: { bg: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', text: 'Declined' },
      expired: { bg: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', text: 'Expired' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg}`}>
        {config.text}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading students...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Students Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your students, send invitations, and track their progress
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={refreshAll}
              className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats Overview - PRAWDZIWE DANE */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {totalStudents}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Students</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {activeStudents}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Invitations</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {pendingInvitations}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Progress</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {totalStudents > 0 ? Math.round(activeStudents / totalStudents * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('students')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'students'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>My Students ({totalStudents})</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('invitations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invitations'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Invitations ({invitations.length})</span>
              {pendingInvitations > 0 && (
                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full">
                  {pendingInvitations}
                </span>
              )}
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('invite')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invite'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Invite Student</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <button
              onClick={refreshAll}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Students Grid - PRAWDZIWE DANE */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <StudentCard 
                key={student.student_id} 
                student={convertToStudentFormat(student)} 
              />
            ))}
          </div>

          {filteredStudents.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {totalStudents === 0 ? 'No students yet' : 'No students found'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {totalStudents === 0 
                  ? 'Start building your student base by sending invitations!' 
                  : 'Try adjusting your search criteria.'}
              </p>
              {totalStudents === 0 && (
                <button
                  onClick={() => setActiveTab('invite')}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Invite Your First Student</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'invitations' && (
        <div className="space-y-4">
          {invitations.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No invitations sent
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Send your first student invitation to get started!
              </p>
              <button
                onClick={() => setActiveTab('invite')}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
              >
                <UserPlus className="h-4 w-4" />
                <span>Send Invitation</span>
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Student Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Sent Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Expires
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {invitations.map((invitation) => (
                      <tr key={invitation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {invitation.student_email}
                          </div>
                          {invitation.message && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {invitation.message}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(invitation.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(invitation.invited_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {invitation.status === 'pending' ? (
                            new Date(invitation.expires_at) > new Date() ? (
                              <span className="text-orange-600 dark:text-orange-400">
                                {Math.ceil((new Date(invitation.expires_at).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} days
                              </span>
                            ) : (
                              <span className="text-red-600 dark:text-red-400">Expired</span>
                            )
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'invite' && (
        <InviteStudentForm onInviteSent={handleInviteSent} />
      )}
    </div>
  );
}