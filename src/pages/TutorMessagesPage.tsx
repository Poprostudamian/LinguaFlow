// src/pages/TutorMessagesPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Send, 
  Search, 
  MessageCircle, 
  User, 
  AlertCircle, 
  Plus,
  ArrowLeft,
  Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserConversations,
  getConversationWithMessages,
  sendMessage,
  markConversationAsRead,
  getAvailableUsersForChat,
  createOrGetConversation,
  subscribeToConversationMessages,
  subscribeToConversationUpdates,
  Conversation,
  Message,
  AuthUser
} from '../lib/supabase';

export function YourPage() {
  const { t } = useLanguage();
  
  return (
    <div>
      {/* Zamień hardcoded teksty na t.section.key */}
      <h1>{t.studentDashboard.title}</h1>
      <p>{t.studentDashboard.welcome}</p>
      <button>{t.common.save}</button>
    </div>
  );
}

export function TutorMessagesPage() {
  const { session } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<AuthUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load data on component mount
  useEffect(() => {
    loadConversations();
    loadAvailableStudents();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    let subscription: any;
    
    const setupSubscription = async () => {
      subscription = subscribeToConversationUpdates(() => {
        loadConversations();
      });
    };

    setupSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Subscribe to messages in selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    let subscription: any;

    const setupMessageSubscription = async () => {
      subscription = subscribeToConversationMessages(
        selectedConversation,
        (newMessage) => {
          // Prevent duplicate messages - check if message already exists
          setCurrentMessages(prev => {
            const exists = prev.find(m => m.id === newMessage.id);
            if (exists) return prev;
            return [...prev, newMessage];
          });
          scrollToBottom();
        }
      );
    };

    setupMessageSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [selectedConversation]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setError(null);
      const data = await getUserConversations();
      setConversations(data);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      setError('Failed to load conversations. Make sure the messaging tables are created.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableStudents = async () => {
    try {
      const students = await getAvailableUsersForChat();
      setAvailableStudents(students);
    } catch (error) {
      console.error('Error loading available students:', error);
    }
  };

  const selectConversation = async (conversationId: string) => {
    try {
      setSelectedConversation(conversationId);
      const { messages } = await getConversationWithMessages(conversationId);
      setCurrentMessages(messages);
      
      // Mark as read
      await markConversationAsRead(conversationId);
      
      // Refresh conversations to update unread counts
      loadConversations();
    } catch (error) {
      console.error('Error selecting conversation:', error);
      setError('Failed to load messages');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately
    
    try {
      setIsSending(true);
      const message = await sendMessage(selectedConversation, messageContent);
      
      // Add message to current messages if not already there (prevent duplicates)
      setCurrentMessages(prev => {
        const exists = prev.find(m => m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
      
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  const startNewConversation = async (studentId: string) => {
    try {
      setError(null);
      console.log('Starting conversation with student:', studentId);
      
      const conversationId = await createOrGetConversation(studentId);
      setShowNewChat(false);
      await selectConversation(conversationId);
      loadConversations(); // Refresh list
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      setError(`Failed to start conversation: ${error.message}`);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('pl-PL', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
    }
  };

  const getOtherUser = (conversation: Conversation) => {
    return conversation.student; // Tutor always chats with students
  };

  const filteredConversations = conversations.filter(conv => {
    const otherUser = getOtherUser(conv);
    const searchLower = searchTerm.toLowerCase();
    return (
      otherUser?.first_name?.toLowerCase().includes(searchLower) ||
      otherUser?.last_name?.toLowerCase().includes(searchLower) ||
      otherUser?.email?.toLowerCase().includes(searchLower)
    );
  });

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
    <div className="h-[calc(100vh-8rem)] flex bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Conversations List */}
      <div className={`w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col ${selectedConversation ? 'hidden md:flex' : ''}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Messages</h1>
            <button
              onClick={() => setShowNewChat(true)}
              className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No conversations yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Start a conversation with your students
              </p>
              <button
                onClick={() => setShowNewChat(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Start New Chat
              </button>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const otherUser = getOtherUser(conversation);
              return (
                <div
                  key={conversation.id}
                  onClick={() => selectConversation(conversation.id)}
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedConversation === conversation.id ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {otherUser?.avatar_url ? (
                        <img
                          src={otherUser.avatar_url}
                          alt={`${otherUser.first_name} ${otherUser.last_name}`}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {otherUser?.first_name} {otherUser?.last_name}
                        </p>
                        <div className="flex items-center space-x-2">
                          {conversation.unread_count > 0 && (
                            <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-white bg-purple-600 rounded-full">
                              {conversation.unread_count}
                            </span>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatMessageTime(conversation.last_message_at)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {conversation.last_message || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  {(() => {
                    const conversation = conversations.find(c => c.id === selectedConversation);
                    const otherUser = conversation ? getOtherUser(conversation) : null;
                    return (
                      <div className="flex items-center space-x-3">
                        {otherUser?.avatar_url ? (
                          <img
                            src={otherUser.avatar_url}
                            alt={`${otherUser.first_name} ${otherUser.last_name}`}
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                        )}
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {otherUser?.first_name} {otherUser?.last_name}
                          </h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Student</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === session?.user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_id === session?.user?.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-end mt-1">
                      <Clock className="h-3 w-3 mr-1 opacity-70" />
                      <p className="text-xs opacity-70">
                        {formatMessageTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isSending}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSending ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowNewChat(false)}
            />

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                      Start New Conversation
                    </h3>
                    
                    {availableStudents.length === 0 ? (
                      <div className="text-center py-8">
                        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                          No students available for messaging
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                          Add students first in the Students tab
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {availableStudents.map((student) => (
                          <button
                            key={student.id}
                            onClick={() => startNewConversation(student.id)}
                            className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              {student.avatar_url ? (
                                <img
                                  src={student.avatar_url}
                                  alt={`${student.first_name} ${student.last_name}`}
                                  className="h-8 w-8 rounded-full"
                                />
                              ) : (
                                <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {student.first_name} {student.last_name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {student.email}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowNewChat(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-white dark:border-gray-500 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}