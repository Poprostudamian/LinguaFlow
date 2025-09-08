export interface User {
  id: string;
  email: string;
  role: 'student' | 'tutor';
}

export interface AuthSession {
  user: User | null;
  isAuthenticated: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  date: string;
  time: string;
  tutor: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  assignedStudentIds?: string[];
}

export interface Student {
  id: string;
  name: string;
  email: string;
  level: string;
  progress: number;
  lessonsCompleted: number;
  totalHours: number;
}

export interface Message {
  id: string;
  sender: string;
  senderRole: 'student' | 'tutor';
  content: string;
  timestamp: string;
  read: boolean;
}