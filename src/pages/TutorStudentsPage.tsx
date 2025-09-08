import React, { useState } from 'react';
import { Search, Filter, Users, BookOpen, Clock, Mail } from 'lucide-react';
import { StudentCard } from '../components/StudentCard';
import { tutorMockData } from '../data/mockData';

export function TutorStudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  const filteredStudents = tutorMockData.students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'all' || student.level.toLowerCase() === levelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Students Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and track your students' progress
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {tutorMockData.students.length}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Progress</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {Math.round(tutorMockData.students.reduce((acc, s) => acc + s.progress, 0) / tutorMockData.students.length)}%
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Hours</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {tutorMockData.students.reduce((acc, s) => acc + s.totalHours, 0)}h
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Students</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {tutorMockData.students.filter(s => s.progress > 0).length}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
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
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
          <StudentCard key={student.id} student={student} />
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No students found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  );
}