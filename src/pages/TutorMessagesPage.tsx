// src/pages/TutorMessagesPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  Search, 
  Users, 
  Phone,
  Video,
  Info,
  Paperclip,
  Smile,
  User
} from 'lucide-react';
import { useTutorStudents } from '../contexts/StudentsContext';
import { useAuth } from '../contexts/AuthContext';

// Mock messages data - replace with real messages system later
const mockMessages: { [key: string]: Array<{
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}> } = {};

interface NewMessage {
  content: string;
}

interface Conversation {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageDate: string;
  unreadCount: number;
  isOnline: boolean;
}

export function TutorMessagesPage() {
  const { session } = useAuth();
  const { students, totalStudents, isLoading: studentsLoading, error: studentsError } = useTutorStudents();
  const { studentsStats, getStudentStats } = useTutorStudents();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState<NewMessage>({ content: '' });
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create conversations from students data
  const conversations: Conversation[] = students.map(student => {
  const stats = getStudentStats(student.student_id);
  
  return {
    id: student.relationship_id,
    studentId: student.student_id,
    studentName: `${student.student_first_name} ${student.student_last_name}`.trim() || 'Unknown Student',
    studentEmail: student.student_email,
    lastMessage: stats?.last_activity 
      ? `Last activity: ${new Date(stats.last_activity).toLocaleDateString()}`
      : 'No activity yet',
    lastMessageTime: stats?.last_activity 
      ? new Date(stats.last_activity).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : 'Now',
    lastMessageDate: stats?.last_activity || new Date().toISOString().split('T')[0],
    unreadCount: 0,
    isOnline: Math.random() > 0.5,
    // Dodaj stats do obiektu conversation jeśli potrzebujesz
    lessons: stats?.completed_lessons || 0,
    studyTime: stats?.total_study_time_minutes || 0
  };
});

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation]);

  // Select first conversation by default
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0].id);
    }
  }, [conversations.length, selectedConversation]);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    
    const studentName = conv.studentName.toLowerCase();
    const studentEmail = conv.studentEmail.toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return studentName.includes(query) || studentEmail.includes(query);
  });

  const selectedConversationData = conversations.find(conv => conv.id === selectedConversation);
  
  // Get messages for selected conversation (currently empty, but ready for real implementation)
  const conversationMessages = selectedConversation ? (mockMessages[selectedConversation] || []) : [];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.content.trim() || !selectedConversation) return;

    setIsSending(true);
    try {
      // TODO: Implement actual message sending API call
      console.log('Sending message:', {
        conversationId: selectedConversation,
        content: newMessage.content,
        recipientId: selectedConversationData?.studentId
      });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // TODO: Add message to local state or refetch messages
      
      // Clear message input
      setNewMessage({ content: '' });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatLastMessageDate = (date: string) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getTotalUnreadCount = () => {
    return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  };

  const getStudentInitials = (name: string) => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0]?.[0]?.toUpperCase() || '?';
  };

  if (studentsLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading students...</p>
        </div>
      </div>
    );
  }

  if (studentsError) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Error loading students</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{studentsError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Communicate with your students - {getTotalUnreadCount()} unread messages
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 text-sm">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">{totalStudents} Students</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Layout */}
      <div className="flex-1 flex bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-full sm:w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageCircle className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No conversations found' : 'No students available for messaging'}
                </p>
                {!searchQuery && totalStudents === 0 && (
                  <p className="mt-1 text-xs text-gray-400">
                    Add students to start conversations
                  </p>
                )}
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedConversation === conversation.id 
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-r-2 border-r-purple-500' 
                      : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {getStudentInitials(conversation.studentName)}
                      </div>
                      {conversation.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {conversation.studentName}
                        </p>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatLastMessageDate(conversation.lastMessageDate)}
                          </span>
                          {conversation.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-purple-600 rounded-full">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                        {conversation.lastMessage}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {conversation.lastMessageTime}
                        </span>
                        {conversation.isOnline && (
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            Online
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation && selectedConversationData ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                        {getStudentInitials(selectedConversationData.studentName)}
                      </div>
                      {selectedConversationData.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-700 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {selectedConversationData.studentName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedConversationData.isOnline ? 'Online now' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors">
                      <Phone className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors">
                      <Video className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors">
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                {conversationMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                        Start a conversation
                      </h3>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Send a message to {selectedConversationData.studentName} to get started
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversationMessages.map((message) => {
                      const isFromTutor = message.senderId === session.user?.id;
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isFromTutor ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isFromTutor
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isFromTutor 
                                ? 'text-purple-100' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {formatMessageTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                  <div className="flex-1">
                    <div className="relative">
                      <textarea
                        value={newMessage.content}
                        onChange={(e) => setNewMessage({ content: e.target.value })}
                        placeholder="Type your message..."
                        rows={1}
                        className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-600 dark:text-white resize-none"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                      />
                      <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                        <button
                          type="button"
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          <Paperclip className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          <Smile className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!newMessage.content.trim() || isSending}
                    className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:transform hover:scale-105 disabled:transform-none"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Press Enter to send, Shift + Enter for new line
                </p>
              </div>
            </>
          ) : (
            /* No Conversation Selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  Select a conversation
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Choose a student from the sidebar to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Empty State when no students */}
      {totalStudents === 0 && (
        <div className="mt-6 text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <User className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No students yet. Add students to start conversations.
          </p>
        </div>
      )}
    </div>
  );
}