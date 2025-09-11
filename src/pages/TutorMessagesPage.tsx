// src/pages/TutorMessagesPage.tsx - NAPRAWIONA WERSJA
import React, { useState } from 'react';
import { Send, Search, MessageCircle, User, AlertCircle } from 'lucide-react';
import { useTutorStudents } from '../contexts/StudentsContext';

export function TutorMessagesPage() {
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');

  // Use real data from StudentsContext
  const { students, isLoading, error } = useTutorStudents();

  // Mock messages for now (you can implement real messaging system later)
  const mockMessages = [
    {
      id: '1',
      sender: 'John Doe',
      senderRole: 'student',
      content: 'Hi! I have a question about today\'s lesson.',
      timestamp: '10:30 AM',
      read: false
    },
    {
      id: '2',
      sender: 'Jane Smith',
      senderRole: 'student',
      content: 'Thank you for the feedback on my homework!',
      timestamp: '09:15 AM',
      read: true
    },
    {
      id: '3',
      sender: 'Mike Johnson',
      senderRole: 'student',
      content: 'Could we schedule an extra session this week?',
      timestamp: '08:45 AM',
      read: true
    }
  ];

  const filteredMessages = mockMessages.filter(message =>
    message.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && selectedStudent) {
      const studentName = students.find(s => s.student_id === selectedStudent)?.student_first_name || 'Unknown';
      alert(`Message sent to ${studentName}: "${newMessage}"\n(This is a demo - messaging system will be implemented later)`);
      setNewMessage('');
      setSelectedStudent('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Messages
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Communicate with your students
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Messages</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {mockMessages.length}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Unread</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {mockMessages.filter(m => !m.read).length}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Students</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {students.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Messages List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Messages
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4">
              {filteredMessages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No messages found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'Try adjusting your search criteria.' : 'Start a conversation with your students!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMessages.map((message) => (
                    <div key={message.id} className={`flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors ${
                      !message.read ? 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-400' : ''
                    }`}>
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {message.sender.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {message.sender}
                          </h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {message.timestamp}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {message.content}
                        </p>
                        {!message.read && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded-full">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Send Message Form */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Send Message
          </h2>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  To Student
                </label>
                <select 
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Select a student...</option>
                  {students.map(student => (
                    <option key={student.student_id} value={student.student_id}>
                      {student.student_first_name} {student.student_last_name}
                    </option>
                  ))}
                </select>
                {students.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    No students available. Add students first in the Students tab.
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  placeholder="Type your message..."
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={!selectedStudent || !newMessage.trim() || students.length === 0}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md font-medium transition-all duration-200 hover:transform hover:scale-105 disabled:transform-none disabled:scale-100 flex items-center justify-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Send Message</span>
              </button>
            </form>
          </div>

          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Today's Messages</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {mockMessages.filter(m => m.timestamp.includes('AM') || m.timestamp.includes('PM')).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Students</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {students.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Unread Messages</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {mockMessages.filter(m => !m.read).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}