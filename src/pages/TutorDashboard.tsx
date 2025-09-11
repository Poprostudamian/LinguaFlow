// src/pages/TutorDashboard.tsx - POPRAWIONA WERSJA
import React, { useState } from 'react';
import { 
  Users, 
  BookOpen, 
  Clock, 
  PlusCircle 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KPICard } from '../components/KPICard';
import { StudentCard } from '../components/StudentCard';
import { Student } from '../types';

// 🔧 TYMCZASOWE DANE MOCK - wbudowane w komponent
const tutorMockData = {
  kpis: {
    totalStudents: 15,
    activeLessons: 8,
    teachingHours: 120
  },
  students: [
    {
      id: 'student1',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      level: 'Beginner',
      progress: 65,
      lessonsCompleted: 12,
      totalHours: 24
    },
    {
      id: '2',
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      level: 'Intermediate',
      progress: 78,
      lessonsCompleted: 18,
      totalHours: 36
    },
    {
      id: '3',
      name: 'David Kim',
      email: 'david@example.com',
      level: 'Advanced',
      progress: 92,
      lessonsCompleted: 28,
      totalHours: 56
    },
    {
      id: '4',
      name: 'Emma Wilson',
      email: 'emma@example.com',
      level: 'Beginner',
      progress: 43,
      lessonsCompleted: 8,
      totalHours: 16
    },
    {
      id: '5',
      name: 'Miguel Santos',
      email: 'miguel@example.com',
      level: 'Intermediate',
      progress: 71,
      lessonsCompleted: 15,
      totalHours: 30
    }
  ] as Student[],
  messages: [
    {
      id: '4',
      sender: 'Alex Johnson',
      senderRole: 'student' as const,
      content: 'Hi! I have a question about the pronunciation exercise.',
      timestamp: '10:30 AM',
      read: false
    },
    {
      id: '5',
      sender: 'Sarah Chen',
      senderRole: 'student' as const,
      content: 'Thank you for the grammar lesson yesterday!',
      timestamp: '09:15 AM',
      read: true
    },
    {
      id: '6',
      sender: 'David Kim',
      senderRole: 'student' as const,
      content: 'Could we schedule an extra session this week?',
      timestamp: '08:45 AM',
      read: true
    }
  ]
};

export function TutorDashboard() {
  const { session } = useAuth();
  
  // 🔍 DEBUG: Sprawdź użytkownika i dane
  console.log('🔍 DEBUG TutorDashboard:');
  console.log('- session:', session);
  console.log('- user role:', session?.user?.role);
  console.log('- tutorMockData:', tutorMockData);
  console.log('- tutorMockData.students:', tutorMockData.students);
  console.log('- tutorMockData.kpis:', tutorMockData.kpis);

  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    duration: '60',
    level: 'beginner',
    lessonType: 'multiple-choice' as 'multiple-choice' | 'text' | 'audio' | 'flashcard',
    assignedStudentIds: [] as string[]
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
    const assignedStudentNames = newLesson.assignedStudentIds
      .map(id => tutorMockData.students.find(s => s.id === id)?.name)
      .filter(Boolean)
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

  return (
    <div className="space-y-8">
      {/* 🔍 DEBUG INFO */}
      <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg border-2 border-yellow-500">
        <h3 className="font-bold text-yellow-800 dark:text-yellow-200">🔍 DEBUG INFO</h3>
        <p>User Role: <strong>{session?.user?.role || 'BRAK'}</strong></p>
        <p>Students Count: <strong>{tutorMockData.students.length}</strong></p>
        <p>Total Students KPI: <strong>{tutorMockData.kpis.totalStudents}</strong></p>
        <p>Czy widzisz ten żółty box? Jeśli TAK, to kod się wykonuje!</p>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Tutor Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your students and create engaging lessons
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Total Students"
          value={tutorMockData.kpis.totalStudents}
          icon={Users}
          color="purple"
        />
        <KPICard
          title="Active Lessons"
          value={tutorMockData.kpis.activeLessons}
          icon={BookOpen}
          color="blue"
        />
        <KPICard
          title="Teaching Hours"
          value={`${tutorMockData.kpis.teachingHours}h`}
          icon={Clock}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Student Roster */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Student Roster
          </h2>
          <div className="space-y-4">
            {tutorMockData.students.map((student) => (
              <StudentCard key={student.id} student={student} />
            ))}
          </div>
        </div>

        {/* Lesson Creation Form */}
        <div className="space-y-6">
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
                    placeholder="Brief description of the lesson..."
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
                    onChange={(e) => setNewLesson({...newLesson, lessonType: e.target.value as 'multiple-choice' | 'text' | 'audio' | 'flashcard'})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="text">Text Exercise</option>
                    <option value="audio">Audio Practice</option>
                    <option value="flashcard">Flashcard Review</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assign Students
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3 space-y-2">
                    {tutorMockData.students.map((student) => (
                      <label key={student.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newLesson.assignedStudentIds.includes(student.id)}
                          onChange={() => handleStudentToggle(student.id)}
                          className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 dark:focus:ring-purple-400"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{student.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">({student.level})</span>
                      </label>
                    ))}
                  </div>
                  {newLesson.assignedStudentIds.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {newLesson.assignedStudentIds.length} student(s) selected
                    </p>
                  )}
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-2 px-4 rounded-md font-medium transition-all duration-200 hover:transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Create Lesson</span>
                </button>
              </div>
            </form>
          </div>

          {/* Messages Preview */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Recent Messages
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="space-y-4">
                {tutorMockData.messages.map((message) => (
                  <div key={message.id} className={`flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors ${
                    !message.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}>
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {message.sender.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{message.sender}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{message.timestamp}</p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{message.content}</p>
                    </div>
                    {!message.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}