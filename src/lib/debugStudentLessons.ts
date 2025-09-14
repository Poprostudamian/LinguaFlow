// src/lib/debugStudentLessons.ts - Kompletna analiza problemu
import { supabase } from './supabase';

export const debugStudentLessons = async () => {
  console.log('🔍 DEBUGGING STUDENT LESSONS...');
  
  try {
    // Test 1: Sprawdź aktualną sesję
    console.log('👤 Checking current session...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return;
    }
    
    if (!session) {
      console.error('❌ No active session');
      return;
    }
    
    console.log('✅ User authenticated:', {
      id: session.user.id,
      email: session.user.email,
      role: session.user.user_metadata?.role
    });

    const userId = session.user.id;

    // Test 2: Sprawdź czy user istnieje w tabeli users
    console.log('👥 Checking user in users table...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (userError) {
      console.error('❌ Error fetching user data:', userError);
    } else if (!userData) {
      console.error('❌ User not found in users table');
      return;
    } else {
      console.log('✅ User data:', userData);
    }

    // Test 3: Sprawdź polityki RLS dla student_lessons
    console.log('🔐 Testing RLS policies for student_lessons...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('student_lessons')
      .select('count')
      .limit(1);

    if (rlsError) {
      console.error('❌ RLS policy error for student_lessons:', rlsError);
      console.log('💡 This might be the main issue - RLS policies might be blocking access');
    } else {
      console.log('✅ RLS policies allow access to student_lessons');
    }

    // Test 4: Sprawdź bezpośrednio student_lessons
    console.log('📚 Checking student_lessons table directly...');
    const { data: studentLessonsRaw, error: slError } = await supabase
      .from('student_lessons')
      .select('*')
      .eq('student_id', userId);

    if (slError) {
      console.error('❌ Error fetching student_lessons:', slError);
      console.log('🔧 Possible fixes:');
      console.log('1. Check RLS policies for student_lessons table');
      console.log('2. Verify student_id matches exactly');
      console.log('3. Check if data exists in database');
    } else {
      console.log('✅ Found', studentLessonsRaw?.length || 0, 'student lesson records');
      if (studentLessonsRaw && studentLessonsRaw.length > 0) {
        console.log('📋 Sample data:', studentLessonsRaw[0]);
      }
    }

    // Test 5: Sprawdź lessons table
    console.log('📖 Checking lessons table access...');
    const { data: lessonsTest, error: lessonsError } = await supabase
      .from('lessons')
      .select('count')
      .limit(1);

    if (lessonsError) {
      console.error('❌ Error accessing lessons table:', lessonsError);
    } else {
      console.log('✅ Can access lessons table');
    }

    // Test 6: Sprawdź czy istnieją jakiekolwiek lekcje dla tego studenta
    console.log('🔎 Searching for ANY lesson assignments for this student...');
    
    // Sprawdź w tabeli student_lessons bez filtrów RLS (jeśli możliwe)
    const { data: allAssignments, error: allError } = await supabase.rpc('get_student_lessons_debug', {
      p_student_id: userId
    });

    if (allError && allError.code === '42883') {
      // Funkcja nie istnieje, sprawdź normalnie
      console.log('⚠️ Debug function does not exist, checking normally...');
      
      // Sprawdź czy w ogóle istnieją dane dla tego studenta
      const { data: assignmentCheck, error: assignmentError } = await supabase
        .from('student_lessons')
        .select(`
          id,
          lesson_id,
          status,
          assigned_at
        `)
        .eq('student_id', userId);

      if (assignmentError) {
        console.error('❌ Error checking assignments:', assignmentError);
      } else {
        console.log('📊 Assignment check result:', assignmentCheck?.length || 0, 'assignments found');
        assignmentCheck?.forEach((assignment, index) => {
          console.log(`${index + 1}. Assignment ID: ${assignment.id}, Lesson ID: ${assignment.lesson_id}, Status: ${assignment.status}`);
        });
      }
    } else if (allError) {
      console.error('❌ RPC function error:', allError);
    } else {
      console.log('✅ Debug RPC result:', allAssignments);
    }

    // Test 7: Próbuj z pełnym JOIN
    console.log('🔗 Testing full JOIN query...');
    const { data: joinResult, error: joinError } = await supabase
      .from('student_lessons')
      .select(`
        id,
        student_id,
        lesson_id,
        status,
        assigned_at,
        lessons!inner (
          id,
          title,
          tutor_id
        )
      `)
      .eq('student_id', userId);

    if (joinError) {
      console.error('❌ JOIN query failed:', joinError);
      
      // Sprawdź każdy element oddzielnie
      console.log('🔧 Debugging step by step...');
      
      // Krok 1: Pobierz IDs lekcji
      const { data: lessonIds } = await supabase
        .from('student_lessons')
        .select('lesson_id')
        .eq('student_id', userId);

      console.log('📝 Lesson IDs for student:', lessonIds?.map(l => l.lesson_id));

      if (lessonIds && lessonIds.length > 0) {
        // Krok 2: Pobierz lekcje po ID
        const { data: lessonsById, error: lessonsByIdError } = await supabase
          .from('lessons')
          .select('id, title, tutor_id')
          .in('id', lessonIds.map(l => l.lesson_id));

        if (lessonsByIdError) {
          console.error('❌ Error fetching lessons by ID:', lessonsByIdError);
        } else {
          console.log('✅ Found lessons:', lessonsById);
        }
      }
    } else {
      console.log('✅ JOIN query successful:', joinResult?.length || 0, 'results');
    }

    return true;

  } catch (error) {
    console.error('💥 Debug failed with exception:', error);
    return false;
  }
};

// Uproszczona funkcja testowa bez RLS
export const getStudentLessonsDebug = async (studentId: string) => {
  console.log('🔍 DEBUG: Getting lessons for student:', studentId);
  
  try {
    // Metoda 1: Bezpośrednie zapytanie
    console.log('📚 Method 1: Direct query to student_lessons...');
    const { data: directQuery, error: directError } = await supabase
      .from('student_lessons')
      .select('*')
      .eq('student_id', studentId);

    console.log('Direct query result:', { data: directQuery, error: directError });

    // Metoda 2: Bez filtra studenta (żeby zobaczyć czy w ogóle są jakieś dane)
    console.log('📚 Method 2: All student_lessons (first 5)...');
    const { data: allLessons, error: allError } = await supabase
      .from('student_lessons')
      .select('*')
      .limit(5);

    console.log('All lessons sample:', { data: allLessons, error: allError });

    // Metoda 3: Sprawdź czy student istnieje w users
    console.log('👤 Method 3: Check if student exists...');
    const { data: studentExists, error: studentError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', studentId);

    console.log('Student exists:', { data: studentExists, error: studentError });

    return {
      directQuery: { data: directQuery, error: directError },
      allLessons: { data: allLessons, error: allError },
      studentExists: { data: studentExists, error: studentError }
    };

  } catch (error) {
    console.error('💥 Debug function failed:', error);
    return { error };
  }
};

// Dodaj funkcje do window dla łatwego testowania
if (typeof window !== 'undefined') {
  (window as any).debugStudentLessons = debugStudentLessons;
  (window as any).getStudentLessonsDebug = getStudentLessonsDebug;
}