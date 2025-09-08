import React from 'react';
import { 
  BookOpen, 
  Flame, 
  Clock, 
  MessageCircle, 
  Calendar, 
  Play 
} from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { ActionButton } from '../components/ActionButton';
import { LessonCard } from '../components/LessonCard';
import { studentMockData } from '../data/mockData';

export function StudentDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Student Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your learning progress and upcoming lessons
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Lessons Completed"
          value={studentMockData.kpis.lessonsCompleted}
          icon={BookOpen}
          color="purple"
        />
        <KPICard
          title="Study Streak"
          value={`${studentMockData.kpis.studyStreak} days`}
          icon={Flame}
          color="orange"
        />
        <KPICard
          title="Total Hours"
          value={`${studentMockData.kpis.totalHours}h`}
          icon={Clock}
          color="blue"
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ActionButton
          label="Chat with Tutor"
          icon={MessageCircle}
          onClick={() => alert('Chat feature coming soon!')}
        />
        <ActionButton
          label="Schedule Lesson"
          icon={Calendar}
          variant="secondary"
          onClick={() => alert('Scheduling feature coming soon!')}
        />
        <ActionButton
          label="Continue Learning"
          icon={Play}
          variant="secondary"
          onClick={() => alert('Learning modules coming soon!')}
        />
      </div>

      {/* Upcoming Lessons */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Upcoming Lessons
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {studentMockData.upcomingLessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      </div>
    </div>
  );
}