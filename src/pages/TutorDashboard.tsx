// src/pages/TutorDashboard.tsx - PROSTE ROZWIĄZANIE BEZ HOOKS
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Clock, 
  PlusCircle 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { KPICard } from '../components/KPICard';
import { StudentCard } from '../components/StudentCard';
import { Student } from '../types';

export function TutorDashboard() {
  const { session } = useAuth();
  
  // Stan dla danych z bazy
  const [students, setStudents] = useState<Student[]>([]);
  const [kpis, setKpis] = useState({
    totalStudents: 0,
    activeLessons: 0,
    teachingHours: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Funkcja do pobierania danych z bazy
  const loadDataFromDatabase = async () => {
    if (!session.user?.id || session.user.role !== 'tutor') {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Pobieranie danych dla tutora:', session.user.id);

      // 1. Pobierz studentów tutora
      const { data: tutorStudentsData, error: studentsError } = await supabase
        .from('tutor_students')
        .select(`
          student:users!student_id(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('tutor_id', session.user.id)
        .eq('is_active', true);

      if (studentsError) {
        console.error('Błąd pobierania studentów:', studentsError);
        throw studentsError;
      }

      console.log('📊 Dane studentów z bazy:', tutorStudentsData);

      // 2. Konwertuj dane na format Student[]
      const studentsFromDB: Student[] = (tutorStudentsData || []).map((relation: any) => {
        const student = relation.student;
        return {
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          email: student.email,
          level: 'Beginner', // Tymczasowo
          progress: Math.floor(Math.random() * 100), // Tymczasowo - random
          lessonsCompleted: Math.floor(Math.random() * 20),
          totalHours: Math.floor(Math.random() * 50),
        };
      });

      setStudents(studentsFromDB);
      
      // 3. Ustaw KPI na podstawie danych
      setKpis({
        totalStudents: studentsFromDB.length,
        activeLessons: Math.floor(Math.random() * 10), // Tymczasowo
        teachingHours: studentsFromDB.reduce((acc, s) => acc + s.totalHours, 0)
      });

      console.log('✅ Dane załadowane:', {
        studentsCount: studentsFromDB.length,
        students: studentsFromDB
      });

    } catch (error: any) {
      console.error('❌ Błąd ładowania danych:', error);
      setError(error.message || 'Nie udało się załadować danych');
    } finally {
      setIsLoading(false);
    }
  };

  // Załaduj dane po montowaniu komponentu
  useEffect(() => {
    loadDataFromDatabase();
  }, [session.user?.id]);

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
      .map(id => students.find(s => s.id === id)?.name)
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

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tutor Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Loading data from database...</p>
        </div>
        
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 p-6 rounded-lg h-24"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tutor Dashboard
          </h1>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-red-800 dark:text-red-200 font-medium">Błąd połączenia z bazą danych</h3>
          <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
          <button
            onClick={loadDataFromDatabase}
            className="mt-2 px-3 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

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

      {/* Wskaźnik źródła danych */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-green-800 dark:text-green-200 font-medium">
            ✅ Dane z bazy Supabase
          </span>
        </div>
        <p className="text-green-600 dark:text-green-300 text-sm mt-1">
          Załadowano {students.length} studentów • Tutor: {session.user?.email}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Total Students"
          value={kpis.totalStudents}
          icon={Users}
          color="purple"
        />
        <KPICard
          title="Active Lessons"
          value={kpis.activeLessons}
          icon={BookOpen}
          color="blue"
        />
        <KPICard
          title="Teaching Hours"
          value={`${kpis.teachingHours}h`}
          icon={Clock}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Student Roster */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Student Roster ({students.length})
          </h2>
          <div className="space-y-4">
            {students.length > 0 ? (
              students.map((student) => (
                <StudentCard key={student.id} student={student} />
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">Brak przypisanych studentów</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Sprawdź czy w tabeli 'tutor_students' są przypisani studenci do Twojego ID
                </p>
              </div>
            )}
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assign Students ({students.length} available)
                  </label>
                  {students.length > 0 ? (
                    <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3 space-y-2">
                      {students.map((student) => (
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
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      Brak dostępnych studentów
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
        </div>
      </div>
    </div>
  );
}