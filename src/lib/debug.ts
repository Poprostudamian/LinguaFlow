// src/lib/debug.ts - Dodaj do testowania
import { supabase } from './supabase';

export const debugSupabase = async () => {
  console.log('🔍 DEBUGGING SUPABASE CONNECTION...');
  
  try {
    // Test 1: Basic connection
    console.log('📡 Testing basic connection...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('❌ Basic connection failed:', error);
      return false;
    }
    console.log('✅ Basic connection OK');

    // Test 2: Auth status
    console.log('🔐 Testing auth status...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('❌ Auth check failed:', authError);
    } else {
      console.log('✅ Auth status:', session ? 'Authenticated' : 'Not authenticated');
      if (session) {
        console.log('👤 User:', session.user.email);
      }
    }

    // Test 3: Try to get user data
    if (session) {
      console.log('👥 Testing user data access...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (userError) {
        console.error('❌ User data access failed:', userError);
      } else {
        console.log('✅ User data:', userData);
      }
    }

    // Test 4: Test students query (if authenticated as tutor)
    if (session) {
      console.log('🎓 Testing students query...');
      const { data: studentsData, error: studentsError } = await supabase
        .from('user_relationships')
        .select('*')
        .limit(5);
      
      if (studentsError) {
        console.error('❌ Students query failed:', studentsError);
        console.log('💡 This might be normal if you\'re not a tutor or have no students yet');
      } else {
        console.log('✅ Students query OK:', studentsData?.length, 'relationships found');
      }
    }

    return true;
  } catch (error) {
    console.error('💥 Debug failed with exception:', error);
    return false;
  }
};

// Quick test function you can call in browser console
(window as any).debugSupabase = debugSupabase;