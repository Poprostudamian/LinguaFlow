// src/pages/TutorDashboard.tsx - ORYGINALNA WERSJA Z MOCK DATA
import React, { useState } from 'react';
import { 
  Users, 
  BookOpen, 
  Clock, 
  PlusCircle, 
  Send 
} from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { StudentCard } from '../components/StudentCard';
import { tutorMockData } from '../data/mockData';
import { Student } from '../types';

export function TutorDashboard() {
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assign to Students
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2">
                    {tutorMockData.students.map((student) => (
                      <label key={student.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                        <input
                          type="checkbox"
                          checked={newLesson.assignedStudentIds.includes(student.id)}
                          onChange={() => handleStudentToggle(student.id)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {student.name}
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
        </div>
      </div>
    </div>
  );
}