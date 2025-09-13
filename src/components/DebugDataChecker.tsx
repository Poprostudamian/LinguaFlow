// src/components/DebugDataChecker.tsx - Sprawdź co jest w bazie
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function DebugDataChecker() {
  const { session } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkEverything = async () => {
    if (!session.user?.id) return;

    setLoading(true);
    const results: any = {};

    try {
      // 1. Sprawdź user
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      results.currentUser = userData;

      // 2. Sprawdź wszystkie lekcje w systemie
      const { data: allLessons } = await supabase
        .from('lessons')
        .select('id, title, tutor_id, status, is_published');
      results.allLessons = allLessons;

      // 3. Sprawdź wszystkie student_lessons w systemie
      const { data: allStudentLessons } = await supabase
        .from('student_lessons')
        .select('*');
      results.allStudentLessons = allStudentLessons;

      // 4. Sprawdź student_lessons dla tego user
      const { data: myLessons } = await supabase
        .from('student_lessons')
        .select('*')
        .eq('student_id', session.user.id);
      results.myLessons = myLessons;

      // 5. Sprawdź relacje tutor-student
      const { data: relationships } = await supabase
        .from('tutor_students')
        .select('*');
      results.allRelationships = relationships;

      // 6. Sprawdź moje relacje jako student
      const { data: myRelationships } = await supabase
        .from('tutor_students')
        .select('*')
        .eq('student_id', session.user.id);
      results.myRelationships = myRelationships;

      // 7. Sprawdź wszystkich user w systemie
      const { data: allUsers } = await supabase
        .from('users')
        .select('id, email, role, first_name, last_name');
      results.allUsers = allUsers;

      console.log('🔍 COMPLETE DEBUG RESULTS:', results);
      setData(results);

    } catch (error) {
      console.error('Debug error:', error);
      setData({ error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg mb-6">
      <h2 className="text-lg font-bold mb-4">🔍 Debug Data Checker</h2>
      
      <button 
        onClick={checkEverything}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Checking...' : 'Check All Data'}
      </button>

      {data && (
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold text-green-700 dark:text-green-300">✅ Current User:</h3>
            <div className="bg-white dark:bg-gray-800 p-2 rounded border">
              <p><strong>ID:</strong> {data.currentUser?.id}</p>
              <p><strong>Email:</strong> {data.currentUser?.email}</p>
              <p><strong>Role:</strong> {data.currentUser?.role}</p>
              <p><strong>Name:</strong> {data.currentUser?.first_name} {data.currentUser?.last_name}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-blue-700 dark:text-blue-300">📚 All Lessons in System:</h3>
            <div className="bg-white dark:bg-gray-800 p-2 rounded border">
              <p><strong>Total lessons:</strong> {data.allLessons?.length || 0}</p>
              {data.allLessons?.slice(0, 3).map((lesson: any) => (
                <div key={lesson.id} className="text-xs border-l-2 border-blue-300 pl-2 mt-1">
                  <p><strong>"{lesson.title}"</strong> by tutor {lesson.tutor_id}</p>
                  <p>Status: {lesson.status}, Published: {lesson.is_published ? 'Yes' : 'No'}</p>
                </div>
              ))}
              {data.allLessons?.length > 3 && <p className="text-xs text-gray-500">...and {data.allLessons.length - 3} more</p>}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-purple-700 dark:text-purple-300">📋 All Student-Lesson Assignments:</h3>
            <div className="bg-white dark:bg-gray-800 p-2 rounded border">
              <p><strong>Total assignments:</strong> {data.allStudentLessons?.length || 0}</p>
              {data.allStudentLessons?.slice(0, 5).map((assignment: any) => (
                <div key={assignment.id} className="text-xs border-l-2 border-purple-300 pl-2 mt-1">
                  <p><strong>Student:</strong> {assignment.student_id}</p>
                  <p><strong>Lesson:</strong> {assignment.lesson_id}</p>
                  <p><strong>Status:</strong> {assignment.status}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={data.myLessons?.length > 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}>
            <h3 className="font-semibold text-red-700 dark:text-red-300">🎯 MY Lesson Assignments:</h3>
            <div className="bg-white dark:bg-gray-800 p-2 rounded border">
              <p><strong>My assignments:</strong> {data.myLessons?.length || 0}</p>
              {data.myLessons?.length === 0 && (
                <p className="text-red-600 dark:text-red-400 font-medium">❌ NO LESSONS ASSIGNED TO ME!</p>
              )}
              {data.myLessons?.map((lesson: any) => (
                <div key={lesson.id} className="text-xs border-l-2 border-green-300 pl-2 mt-1">
                  <p><strong>Lesson:</strong> {lesson.lesson_id}</p>
                  <p><strong>Status:</strong> {lesson.status}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-orange-700 dark:text-orange-300">🤝 Tutor-Student Relationships:</h3>
            <div className="bg-white dark:bg-gray-800 p-2 rounded border">
              <p><strong>All relationships:</strong> {data.allRelationships?.length || 0}</p>
              <p><strong>My relationships:</strong> {data.myRelationships?.length || 0}</p>
              {data.myRelationships?.map((rel: any) => (
                <div key={rel.id} className="text-xs border-l-2 border-orange-300 pl-2 mt-1">
                  <p><strong>Tutor:</strong> {rel.tutor_id}</p>
                  <p><strong>Active:</strong> {rel.is_active ? 'Yes' : 'No'}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">👥 All Users:</h3>
            <div className="bg-white dark:bg-gray-800 p-2 rounded border max-h-40 overflow-y-auto">
              <p><strong>Total users:</strong> {data.allUsers?.length || 0}</p>
              <p><strong>Students:</strong> {data.allUsers?.filter((u: any) => u.role === 'student').length || 0}</p>
              <p><strong>Tutors:</strong> {data.allUsers?.filter((u: any) => u.role === 'tutor').length || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}