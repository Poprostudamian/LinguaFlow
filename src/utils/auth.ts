import { User } from '../types';

export function getCurrentUser(): User | null {
  try {
    const stored = localStorage.getItem('authUser');
    if (stored) {
      const user = JSON.parse(stored);
      // Ensure backward compatibility by adding id if missing
      if (!user.id) {
        user.id = user.role === 'student' ? 'student1' : 'tutor1';
      }
      return user;
    }
  } catch (error) {
    console.error('Error parsing stored user:', error);
    localStorage.removeItem('authUser');
  }
  return null;
}

export function logout(): void {
  localStorage.removeItem('authUser');
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

export function hasRole(role: 'student' | 'tutor'): boolean {
  const user = getCurrentUser();
  return user?.role === role;
}