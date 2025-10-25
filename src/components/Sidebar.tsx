// src/components/Sidebar.tsx
// ✅ UPDATED: Dodano link do Grading dla tutorów

import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  MessageCircle, 
  BookOpen, 
  Users, 
  PlusCircle,
  Award // ✅ ADDED
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase'; // ✅ ADDED

export function Sidebar() {
  const { session } = useAuth();
  const [pendingGradingsCount, setPendingGradingsCount] = useState(0); // ✅ ADDED

  // ✅ ADDED: Fetch pending gradings count
  useEffect(() => {
    const fetchPendingCount = async () => {
      if (!session?.user || session.user.role !== 'tutor') return;
      
      try {
        const { data, error } = await supabase
          .rpc('count_tutor_pending_gradings', {
            p_tutor_id: session.user.id
          });
        
        if (!error) {
          setPendingGradingsCount(data || 0);
        }
      } catch (err) {
        console.error('Error fetching pending count:', err);
      }
    };

    fetchPendingCount();
    
    // Refresh count every minute
    const interval = setInterval(fetchPendingCount, 60000);
    
    return () => clearInterval(interval);
  }, [session]);

  const studentNavItems = [
    { path: '/student', label: 'Dashboard', icon: Home },
    { path: '/student/lessons', label: 'My Lessons', icon: BookOpen },
    { path: '/student/schedule', label: 'Schedule', icon: Calendar },
    { path: '/student/messages', label: 'Messages', icon: MessageCircle },
  ];

  const tutorNavItems = [
    { path: '/tutor', label: 'Dashboard', icon: Home },
    { path: '/tutor/students', label: 'Students', icon: Users },
    { path: '/tutor/lessons', label: 'Create Lesson', icon: PlusCircle },
    { path: '/tutor/grading', label: 'Grading', icon: Award, badge: pendingGradingsCount },
    { path: '/tutor/schedule', label: 'Schedule', icon: Calendar },
    { path: '/tutor/messages', label: 'Messages', icon: MessageCircle },
  ];

  const navItems = session?.user?.role === 'student' ? studentNavItems : tutorNavItems;

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">LinguaFlow</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {session?.user?.role} Portal
            </p>
          </div>
        </div>
        
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>
              {/* ✅ ADDED: Badge for pending gradings */}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}