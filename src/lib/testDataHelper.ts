// src/lib/testDataHelper.ts - Helper for creating test data
import { supabase } from './supabase';

/**
 * Create sample lessons and assign them to the current student
 * This is a helper function for testing - call it from browser console
 */
export const createSampleStudentLessons = async (studentId: string) => {
  try {
    console.log('🎯 Creating sample lessons for student:', studentId);

    // First, find a tutor to assign lessons from
    const { data: tutors, error: tutorError } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('role', 'tutor')
      .limit(1);

    if (tutorError || !tutors || tutors.length === 0) {
      console.error('❌ No tutors found. Please create a tutor account first.');
      return;
    }

    const tutorId = tutors[0].id;
    console.log('✅ Using tutor:', tutors[0].first_name, tutors[0].last_name);

    // Sample lessons data
    const sampleLessons = [
      {
        title: 'Introduction to English Grammar',
        description: 'Learn the basics of English grammar including nouns, verbs, and sentence structure.',
        content: 'This lesson covers fundamental grammar concepts...',
        status: 'published'
      },
      {
        title: 'English Pronunciation Guide',
        description: 'Master English pronunciation with phonetic exercises and audio examples.',
        content: 'In this lesson, we will practice pronunciation...',
        status: 'published'
      },
      {
        title: 'Business English Essentials',
        description: 'Professional communication skills for the workplace.',
        content: 'Learn professional English communication...',
        status: 'published'
      }
    ];

    console.log('📚 Creating', sampleLessons.length, 'sample lessons...');

    // Create lessons
    const { data: createdLessons, error: lessonError } = await supabase
      .from('lessons')
      .insert(
        sampleLessons.map(lesson => ({
          ...lesson,
          tutor_id: tutorId
        }))
      )
      .select();

    if (lessonError) {
      console.error('❌ Error creating lessons:', lessonError);
      return;
    }

    console.log('✅ Created', createdLessons.length, 'lessons');

    // Assign lessons to student
    const assignments = createdLessons.map((lesson, index) => ({
      student_id: studentId,
      lesson_id: lesson.id,
      status: index === 0 ? 'in_progress' : index === 1 ? 'completed' : 'assigned',
      progress: index === 0 ? 45 : index === 1 ? 100 : 0,
      score: index === 1 ? 87 : null,
      time_spent: index === 0 ? 1800 : index === 1 ? 3600 : 0, // in seconds
      started_at: index === 0 ? new Date().toISOString() : index === 1 ? new Date(Date.now() - 86400000).toISOString() : null,
      completed_at: index === 1 ? new Date().toISOString() : null
    }));

    const { data: createdAssignments, error: assignmentError } = await supabase
      .from('student_lessons')
      .insert(assignments)
      .select();

    if (assignmentError) {
      console.error('❌ Error creating assignments:', assignmentError);
      return;
    }

    console.log('✅ Created', createdAssignments.length, 'lesson assignments');
    console.log('🎉 Sample data created successfully!');
    
    return {
      lessons: createdLessons,
      assignments: createdAssignments
    };

  } catch (error) {
    console.error('💥 Error creating sample data:', error);
    throw error;
  }
};

/**
 * Clean up test data (removes lessons and assignments)
 */
export const cleanupSampleData = async (studentId: string) => {
  try {
    console.log('🧹 Cleaning up sample data for student:', studentId);

    // Delete student lesson assignments
    const { error: assignmentError } = await supabase
      .from('student_lessons')
      .delete()
      .eq('student_id', studentId);

    if (assignmentError) {
      console.error('❌ Error deleting assignments:', assignmentError);
    } else {
      console.log('✅ Deleted lesson assignments');
    }

    // Note: We don't delete the lessons themselves as they might be used by other students
    console.log('🎉 Cleanup completed!');

  } catch (error) {
    console.error('💥 Error during cleanup:', error);
    throw error;
  }
};

/**
 * Debug function - check current student lessons
 */
export const debugStudentLessons = async (studentId: string) => {
  try {
    console.log('🔍 Debugging lessons for student:', studentId);

    const { data, error } = await supabase
      .from('student_lessons')
      .select(`
        *,
        lessons (
          title,
          description,
          tutor_id,
          users:tutor_id (
            first_name,
            last_name
          )
        )
      `)
      .eq('student_id', studentId);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('📊 Found', data?.length || 0, 'assignments:');
    data?.forEach((assignment, index) => {
      console.log(`${index + 1}. ${(assignment.lessons as any)?.title || 'Unknown'} - Status: ${assignment.status}`);
    });

  } catch (error) {
    console.error('💥 Debug error:', error);
  }
};

// Make functions available in browser console for testing
if (typeof window !== 'undefined') {
  (window as any).createSampleStudentLessons = createSampleStudentLessons;
  (window as any).cleanupSampleData = cleanupSampleData;
  (window as any).debugStudentLessons = debugStudentLessons;
}