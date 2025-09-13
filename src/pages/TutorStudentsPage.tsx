// src/pages/TutorStudentsPage.tsx - ZOPTYMALIZOWANA WERSJA

import React, { useState, useMemo, useCallback } from 'react';
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
  } = useTutorStudents();

  // ✅ OPTYMALIZACJA 1: Memoized conversion function
  const convertToStudentFormat = useCallback((tutorStudent: any) => {
    console.log('🔄 CONVERT START');
    console.log('🔄 Raw input:', tutorStudent);
    console.log('🔄 Input level:', tutorStudent.level);
    console.log('🔄 Input progress:', tutorStudent.progress);
    console.log('🔄 Input lessonsCompleted:', tutorStudent.lessonsCompleted);
    console.log('🔄 Input totalHours:', tutorStudent.totalHours);

    const result = {
      id: tutorStudent.student_id,
      name: `${tutorStudent.student_first_name} ${tutorStudent.student_last_name}`,
      email: tutorStudent.student_email,
      level: tutorStudent.level || 'Test Level 1', // Use real data or fallback
      progress: tutorStudent.progress || 50, // Use real data or fallback
      lessonsCompleted: tutorStudent.lessonsCompleted || 1, // Use real data or fallback
      totalHours: tutorStudent.totalHours || 2, // Use real data or fallback
      joinedDate: tutorStudent.relationship_created
    };

    console.log('✅ CONVERT RESULT:');
    console.log('✅ result.level:', result.level);
    console.log('✅ result.progress:', result.progress);
    console.log('✅ result.lessonsCompleted:', result.lessonsCompleted);
    console.log('✅ result.totalHours:', result.totalHours);
    console.log('✅ Full result:', result);
    
    return result;
  }, []); // Empty dependency array since it doesn't depend on external values

  // ✅ OPTYMALIZACJA 2: Memoized converted students
  const convertedStudents = useMemo(() => {
    console.log('🎯 MEMOIZED CONVERSION - students length:', students.length);
    return students.map(student => {
      console.log('🎯 MAPPING student:', student);
      const converted = convertToStudentFormat(student);
      console.log('🎯 CONVERTED for StudentCard:', converted);
      return converted;
    });
  }, [students, convertToStudentFormat]);

  // ✅ OPTYMALIZACJA 3: Memoized filtered students  
  const filteredStudents = useMemo(() => {
    console.log('🔍 FILTERING DEBUG:');
    console.log('🔍 searchTerm:', searchTerm);
    console.log('🔍 students from context:', students);
    
    if (!searchTerm.trim()) {
      console.log('🔍 filteredStudents result:', convertedStudents);
      console.log('🔍 filteredStudents length:', convertedStudents.length);
      return convertedStudents;
    }

    const lowerQuery = searchTerm.toLowerCase();
    const filtered = convertedStudents.filter(student => {
      const fullName = student.name.toLowerCase();
      const email = student.email.toLowerCase();
      return fullName.includes(lowerQuery) || email.includes(lowerQuery);
    });
    
    console.log('🔍 filteredStudents result:', filtered);
    console.log('🔍 filteredStudents length:', filtered.length);
    return filtered;
  }, [convertedStudents, searchTerm]);

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
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Students ({filteredStudents.length})
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invitations'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Invitations ({invitations.length})
          </button>
          <button
            onClick={() => setActiveTab('invite')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invite'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Invite New Student
          </button>
        </nav>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
          </div>

          {/* Students List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <StudentCard 
                key={student.id} 
                student={student} 
              />
            ))}
          </div>

          {filteredStudents.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
                  onClick={() => setActiveTab('invite')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Student
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'invitations' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sent Invitations</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Track the status of your student invitations
              </p>
            </div>
            <div className="p-6">
              {invitations.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No invitations sent
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Start by inviting students to join your classes
                  </p>
                  <button
                    onClick={() => setActiveTab('invite')}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Send Invitation
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {invitations.map((invitation) => (
                    <div 
                      key={invitation.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-md"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {invitation.student_email}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Invited {new Date(invitation.invited_at).toLocaleDateString()}
                          {invitation.expires_at && ` • Expires ${new Date(invitation.expires_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      {getStatusBadge(invitation.status)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'invite' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Invite New Student</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Send an invitation to a new student
            </p>
          </div>
          <div className="p-6">
            <InviteStudentForm onInviteSent={handleInviteSent} />
          </div>
        </div>
      )}
    </div>
  );
}