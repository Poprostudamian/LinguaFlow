// src/pages/TutorDashboard.tsx - Zaktualizowana wersja z kontekstem
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
  TrendingUp
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

  // Use global students context
  const {
    students,
    invitations,
    totalStudents,
    activeStudents,
    pendingInvitations,
    isLoading,
    getStudentsByIds
  } = useTutorStudents();

  // Convert TutorStudent to Student format for StudentCard component
  const convertToStudentFormat = (tutorStudent: any) => ({
    id: tutorStudent.student_id,
    name: `${tutorStudent.student_first_name} ${tutorStudent.student_last_name}`,
    email: tutorStudent.student_email,
    level: 'Intermediate', // TODO: Add level to database
    progress: Math.floor(Math.random() * 100), // TODO: Calculate real progress
    lessonsCompleted: Math.floor(Math.random() * 20), // TODO: Get from database
    totalHours: Math.floor(Math.random() * 50), // TODO: Get from database
    joinedDate: tutorStudent.relationship_created
  });

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
  
  // Calculate mock teaching hours
  const teachingHours = totalStudents * 5; // Mock calculation

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Tutor Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your students and create engaging lessons
        </p>
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
        {/* Recent Students */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Students
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

          {/* Lesson Creation Form */}
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newLesson.description}
                    onChange={(e) => setNewLesson({...newLesson, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Brief description of the lesson content..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duration (minutes)
                    </label>
                    <select
                      value={newLesson.duration}
                      onChange={(e) => setNewLesson({...newLesson, duration: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                      <option value="90">90 minutes</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Level
                    </label>
                    <select
                      value={newLesson.level}
                      onChange={(e) => setNewLesson({...newLesson, level: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lesson Type
                  </label>
                  <select
                    value={newLesson.lessonType}
                    onChange={(e) => setNewLesson({...newLesson, lessonType: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="text">Text Response</option>
                    <option value="audio">Audio Practice</option>
                    <option value="flashcard">Flashcards</option>
                  </select>
                </div>
                
                {/* Student Assignment */}
                {totalStudents > 0 && (
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
                )}
                
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
        </div>
      </div>
    </div>
  );
}