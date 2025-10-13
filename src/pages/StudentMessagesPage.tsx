// src/pages/StudentMessagesPage.tsx - Z PEŁNYMI TŁUMACZENIAMI

import React, { useState, useEffect, useRef } from 'react';
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
import { useLanguage } from '../contexts/LanguageContext'; // ← DODANE
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

export function StudentMessagesPage() {
  const { session } = useAuth();
  const { t } = useLanguage(); // ← DODANE
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [availableTutors, setAvailableTutors] = useState<AuthUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
    loadAvailableTutors();
  }, []);

  // Subscribe to messages in selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const subscription = subscribeToConversationMessages(
      selectedConversation,
      (message) => {
        setCurrentMessages(prev => {
          if (prev.find(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
        scrollToBottom();
      }
    );

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [selectedConversation]);

  // Subscribe to conversation list updates
  useEffect(() => {
    const subscription = subscribeToConversationUpdates(() => {
      loadConversations();
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Auto-focus input
  useEffect(() => {
    if (selectedConversation && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const data = await getUserConversations();
      setConversations(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableTutors = async () => {
    try {
      const tutors = await getAvailableUsersForChat();
      setAvailableTutors(tutors);
    } catch (err) {
      console.error('Error loading tutors:', err);
    }
  };

  const selectConversation = async (conversationId: string) => {
    try {
      setSelectedConversation(conversationId);
      const { messages } = await getConversationWithMessages(conversationId);
      setCurrentMessages(messages);
      await markConversationAsRead(conversationId);
      loadConversations();
      scrollToBottom();
    } catch (err: any) {
      setError(t.studentMessagesPage.errorLoading); // ← ZMIENIONE
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const message = await sendMessage(selectedConversation, messageContent);
      setCurrentMessages(prev => {
        const exists = prev.find(m => m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      setError(t.studentMessagesPage.errorSending); // ← ZMIENIONE
      setNewMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  const startNewConversation = async (tutorId: string) => {
    try {
      setError(null);
      const conversationId = await createOrGetConversation(tutorId);
      setShowNewChat(false);
      await selectConversation(conversationId);
      loadConversations();
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      setError(`${t.studentMessagesPage.errorSending}: ${error.message}`); // ← ZMIENIONE
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

    if (diffInMinutes < 1) {
      return t.studentMessagesPage.justNow; // ← ZMIENIONE
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)} ${t.studentMessagesPage.minutes}`; // ← ZMIENIONE
    } else {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
  };

  const formatLastMessage = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return formatTime(timestamp);
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getOtherUser = (conversation: Conversation) => {
    return conversation.tutor;
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return Object.entries(groups).map(([date, msgs]) => ({
      date,
      messages: msgs
    }));
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

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const otherUser = selectedConv ? getOtherUser(selectedConv) : null;
  const messageGroups = groupMessagesByDate(currentMessages);

  // Handle textarea auto-resize
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">
            {t.studentMessagesPage.loading} {/* ← ZMIENIONE */}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Conversations Sidebar */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-gray-200 dark:border-gray-700 flex flex-col ${
        selectedConversation ? 'hidden md:flex' : ''
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t.studentMessagesPage.conversations} {/* ← ZMIENIONE */}
            </h2>
            <button
              onClick={() => setShowNewChat(true)}
              className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 hover:shadow-lg"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t.studentMessagesPage.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="bg-gray-100 dark:bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t.studentMessagesPage.noConversations} {/* ← ZMIENIONE */}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
                {t.studentMessagesPage.noConversationsDescription} {/* ← ZMIENIONE */}
              </p>
              <button
                onClick={() => setShowNewChat(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2.5 rounded-lg transition-all duration-200 hover:shadow-lg"
              >
                {t.studentMessagesPage.startConversation} {/* ← ZMIENIONE */}
              </button>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const user = getOtherUser(conversation);
              const unreadCount = conversation.unread_count || 0;
              const lastMessage = conversation.last_message;
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => selectConversation(conversation.id)}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-all duration-200 ${
                    selectedConversation === conversation.id
                      ? 'bg-purple-50 dark:bg-purple-900/30 border-l-4 border-l-purple-600'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar with online indicator */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md">
                        {user?.first_name?.[0] || '?'}
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {user?.first_name} {user?.last_name}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                          {conversation.last_message_at && formatLastMessage(conversation.last_message_at)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {lastMessage || 'No messages yet'}
                        </p>
                        {unreadCount > 0 && (
                          <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 ml-2">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${
        !selectedConversation ? 'hidden md:flex' : ''
      }`}>
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="h-12 w-12 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t.studentMessagesPage.selectConversation} {/* ← ZMIENIONE */}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {t.studentMessagesPage.selectConversationDescription} {/* ← ZMIENIONE */}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>

                  {/* User Avatar */}
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                      {otherUser?.first_name?.[0] || '?'}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                  </div>

                  {/* User Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {otherUser?.first_name} {otherUser?.last_name}
                    </h3>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {isTyping ? t.studentMessagesPage.typing : t.studentMessagesPage.online} {/* ← ZMIENIONE */}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
              {messageGroups.map((group, groupIdx) => {
                const groupDate = new Date(group.date);
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                let dateLabel = groupDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: groupDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
                });

                if (groupDate.toDateString() === today.toDateString()) {
                  dateLabel = t.studentMessagesPage.today; // ← ZMIENIONE
                } else if (groupDate.toDateString() === yesterday.toDateString()) {
                  dateLabel = t.studentMessagesPage.yesterday; // ← ZMIENIONE
                }

                return (
                  <div key={groupIdx}>
                    {/* Date Separator */}
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-3 py-1 rounded-full">
                        {dateLabel}
                      </div>
                    </div>

                    {/* Messages */}
                    {group.messages.map((message) => {
                      const isOwn = message.sender_id === session?.user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}
                        >
                          <div className={`flex items-end space-x-2 max-w-[70%] ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            {!isOwn && (
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                {message.sender?.first_name?.[0] || '?'}
                              </div>
                            )}
                            
                            <div>
                              <div
                                className={`px-4 py-2 rounded-2xl ${
                                  isOwn
                                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {message.content}
                                </p>
                              </div>
                              <div className={`flex items-center mt-1 space-x-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatTime(message.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
                <div className="flex-1">
                  <textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={handleTextareaChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder={t.studentMessagesPage.typeMessage}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none min-h-[42px] max-h-[120px]"
                    rows={1}
                    disabled={isSending}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  title={t.studentMessagesPage.sendMessage} {/* ← ZMIENIONE */}
                >
                  {isSending ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </form>
            </div>
          </>
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
                      {t.studentMessagesPage.startNewConversation} {/* ← ZMIENIONE */}
                    </h3>
                    
                    {availableTutors.length === 0 ? (
                      <div className="text-center py-8">
                        <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          {t.studentMessagesPage.noTutorsAvailable} {/* ← ZMIENIONE */}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          {t.studentMessagesPage.noTutorsDescription} {/* ← ZMIENIONE */}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {t.studentMessagesPage.selectTutor} {/* ← ZMIENIONE */}
                        </p>
                        {availableTutors.map((tutor) => (
                          <button
                            key={tutor.id}
                            onClick={() => startNewConversation(tutor.id)}
                            className="w-full flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {tutor.first_name?.[0] || '?'}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {tutor.first_name} {tutor.last_name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {tutor.email}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setShowNewChat(false)}
                  className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t.studentMessagesPage.cancel} {/* ← ZMIENIONE */}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}