// src/pages/StudentMessagesPage.tsx - MODERN MESSAGING UI

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
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Circle
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

export function StudentMessagesPage() {
  const { session } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // State
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

  // Load data
  useEffect(() => {
    loadConversations();
    loadAvailableTutors();
  }, []);

  // Subscribe to real-time updates for selected conversation
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
      // Reload conversations when any conversation is updated
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
      setError('Failed to load messages');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    try {
      setIsSending(true);
      const message = await sendMessage(selectedConversation, newMessage);
      setCurrentMessages(prev => [...prev, message]);
      setNewMessage('');
      scrollToBottom();
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const startNewConversation = async (tutorId: string) => {
    try {
      const conversationId = await createOrGetConversation(tutorId);
      setShowNewChat(false);
      await selectConversation(conversationId);
      loadConversations();
    } catch (err) {
      setError('Failed to start conversation');
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Helper functions
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Conversations Sidebar */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-gray-200 dark:border-gray-700 flex flex-col ${selectedConversation ? 'hidden md:flex' : ''}`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h1>
            <button
              onClick={() => setShowNewChat(true)}
              className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 hover:scale-105"
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
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
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
              <div className="bg-gray-100 dark:bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No conversations yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
                Start chatting with your tutor
              </p>
              <button
                onClick={() => setShowNewChat(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2.5 rounded-lg transition-all duration-200 hover:shadow-lg"
              >
                Start Conversation
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
                      {/* Online indicator - można dodać logikę online status */}
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {user?.first_name} {user?.last_name}
                        </h3>
                        {conversation.last_message_at && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                            {formatLastMessage(conversation.last_message_at)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {lastMessage || 'No messages yet'}
                        </p>
                        {unreadCount > 0 && (
                          <span className="ml-2 bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
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
      <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : ''}`}>
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="h-12 w-12 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Choose a conversation from the list to start messaging
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
                      {isTyping ? 'typing...' : 'Online'}
                    </p>
                  </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <Phone className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <Video className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
              {messageGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-4">
                  {/* Date Divider */}
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-white dark:bg-gray-800 px-4 py-1.5 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {formatDate(group.messages[0].created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Messages */}
                  {group.messages.map((message, index) => {
                    const isOwn = message.sender_id === session.user?.id;
                    const showAvatar = !isOwn && (
                      index === group.messages.length - 1 ||
                      group.messages[index + 1]?.sender_id !== message.sender_id
                    );

                    return (
                      <div
                        key={message.id}
                        className={`flex items-end space-x-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* Avatar for received messages */}
                        {!isOwn && (
                          <div className="w-8 h-8 flex-shrink-0">
                            {showAvatar && (
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                                {otherUser?.first_name?.[0] || '?'}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div className={`group relative max-w-xs lg:max-w-md ${isOwn ? 'order-1' : ''}`}>
                          <div
                            className={`px-4 py-2.5 rounded-2xl shadow-sm transition-all duration-200 ${
                              isOwn
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-none'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-none'
                            }`}
                          >
                            <p className="text-sm break-words">{message.content}</p>
                          </div>

                          {/* Timestamp and Status */}
                          <div className={`flex items-center space-x-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTime(message.created_at)}
                            </span>
                            {isOwn && (
                              <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
                {/* Attachment Button */}
                <button
                  type="button"
                  className="p-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Paperclip className="h-5 w-5" />
                </button>

                {/* Text Input */}
                <div className="flex-1 relative">
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
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-2xl focus:ring-2 focus:ring-purple-500 resize-none max-h-32 transition-all"
                  />
                  
                  {/* Emoji Button */}
                  <button
                    type="button"
                    className="absolute right-3 bottom-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105 active:scale-95"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  New Conversation
                </h3>
                <button
                  onClick={() => setShowNewChat(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-88px)]">
              {availableTutors.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400">
                  No tutors available
                </p>
              ) : (
                <div className="space-y-2">
                  {availableTutors.map(tutor => (
                    <button
                      key={tutor.id}
                      onClick={() => startNewConversation(tutor.id)}
                      className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md">
                          {tutor.first_name?.[0] || '?'}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {tutor.first_name} {tutor.last_name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {tutor.email}
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
      )}
    </div>
  );
}