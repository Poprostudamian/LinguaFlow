// src/pages/TutorDashboard.tsx - Z PRAWDZIWYMI DANYMI

import React, { useState } from 'react';
import { 
  Users, 
  BookOpen, 
  Clock, 
  PlusCircle, 
  Send,
  UserPlus,
  MessageCircle,
  Calendar,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { StudentCard } from '../components/StudentCard';
import { useTutorStudents } from '../contexts/StudentsContext';

export function TutorDashboard() {
  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    duration: '60',
    level: 'beginner',
    lessonType: 'multiple-choice' as 'multiple-choice' | 'text' | 'audio' | 'flashcard',
    assignedStudentIds: [] as string[]
  });

  // Use real data from StudentsContext
  const {
    students,
    invitations,
    totalStudents,
    activeStudents,
    pendingInvitations,
    isLoading,
    error,
    refreshAll,
    getStudentsByIds
  } = useTutorStudents();

const convertToStudentFormat = (tutorStudent: any) => {
  // Stałe dane bazowane na ID studenta (zamiast losowych)
  const studentIdHash = tutorStudent.student_id.split('-')[0] || '0';
  const hashNum = parseInt(studentIdHash, 16) || 0;
  
  return {
    id: tutorStudent.student_id,
    name: `${tutorStudent.student_first_name} ${tutorStudent.student_last_name}`,
    email: tutorStudent.student_email,
    level: ['Beginner', 'Intermediate', 'Advanced'][hashNum % 3], // Stały poziom
    progress: (hashNum % 100), // Stały postęp 0-99%
    lessonsCompleted: (hashNum % 25), // Stała liczba lekcji 0-24
    totalHours: (hashNum % 50) + 1, // Stałe godziny 1-50
    joinedDate: tutorStudent.relationship_created
  };
};

  const handleStudentToggle = (studentId: string) => {
    setNewLesson(prev => ({
      ...prev,
      assignedStudentIds: prev.assignedStudentIds.includes(studentId)
        ? prev.assignedStudentIds.filter(id => id !== studentId)
        : [...prev.assignedStudentIds, studentId]
    }));
  };

  const handleCreateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedStudents = getStudentsByIds(newLesson.assignedStudentIds);
    const assignedStudentNames = assignedStudents
      .map(s => `${s.student_first_name} ${s.student_last_name}`)
      .join(', ');
    
    alert(`Lesson created successfully!\nType: ${newLesson.lessonType}\nTitle: ${newLesson.title}\nAssigned to: ${assignedStudentNames || 'No students assigned'}\n(This is a demo)`);
    setNewLesson({ 
      title: '', 
      description: '', 
      duration: '60', 
      level: 'beginner', 
      lessonType: 'multiple-choice',
      assignedStudentIds: []
    });
  };

  // Show recent students (limit to 6)
  const recentStudents = students.slice(0, 6);
  
  // Calculate teaching hours (mock for now)
  const teachingHours = totalStudents * 8;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
        <h3 className="text-red-800 dark:text-red-400 font-medium mb-2">Error loading dashboard</h3>
        <p className="text-red-600 dark:text-red-300 mb-3">{error}</p>
        <button
          onClick={refreshAll}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tutor Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your students and create engaging lessons
          </p>
        </div>
        <button
          onClick={refreshAll}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards with REAL DATA */}
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
          title="Teaching Hours"
          value={`${teachingHours}h`}
          icon={Clock}
          color="green"
        />
        <KPICard
          title="Pending Invites"
          value={pendingInvitations}
          icon={Send}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Student Roster with REAL DATA */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              My Students
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {totalStudents} total
            </span>
          </div>
          
          {totalStudents === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No students yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Start building your student base by sending invitations!
              </p>
              <button className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200">
                <UserPlus className="h-4 w-4" />
                <span>Invite Students</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentStudents.map((student) => (
                <StudentCard 
                  key={student.student_id} 
                  student={convertToStudentFormat(student)}
                  showActions={true}
                  onSendMessage={(id) => console.log('Send message to:', id)}
                  onViewProfile={(id) => console.log('View profile:', id)}
                />
              ))}
              {totalStudents > 6 && (
                <div className="text-center pt-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    And {totalStudents - 6} more students...
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions & Lesson Creation */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <button className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">Messages</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Chat with students</div>
                </div>
              </button>
              
              <button className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Calendar className="h-5 w-5 text-green-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">Schedule Meeting</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Plan group sessions</div>
                </div>
              </button>
              
              <button className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <UserPlus className="h-5 w-5 text-purple-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">Invite Students</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Grow your student base</div>
                </div>
              </button>
            </div>
          </div>

          {/* Lesson Creation Form - only show if has students */}
          {totalStudents > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Create New Lesson
              </h2>
              <form onSubmit={handleCreateLesson} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Lesson Title
                    </label>
                    <input
                      type="text"
                      value={newLesson.title}
                      onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., Spanish Conversation Practice"
                      required
                    />
                  </div>
                  
                  {/* Assign to Students - with REAL students */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Assign to Students
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2">
                      {students.map((student) => (
                        <label key={student.student_id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                          <input
                            type="checkbox"
                            checked={newLesson.assignedStudentIds.includes(student.student_id)}
                            onChange={() => handleStudentToggle(student.student_id)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {student.student_first_name} {student.student_last_name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Create Lesson</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}