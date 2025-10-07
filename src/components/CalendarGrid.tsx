// src/components/CalendarGrid.tsx - MONTHLY CALENDAR VIEW COMPONENT

import React from 'react';
import { MeetingWithParticipants } from '../lib/meetingsAPI';

interface CalendarGridProps {
  currentDate: Date;
  meetings: MeetingWithParticipants[];
  onDateClick?: (date: Date) => void;
}

export function CalendarGrid({ currentDate, meetings, onDateClick }: CalendarGridProps) {
  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return {
      daysInMonth,
      startingDayOfWeek,
      year,
      month
    };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);

  // Generate calendar days
  const calendarDays: (number | null)[] = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Get meetings for a specific day
  const getMeetingsForDay = (day: number | null) => {
    if (!day) return [];
    
    const dateStr = new Date(year, month, day).toDateString();
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.scheduled_at).toDateString();
      return meetingDate === dateStr;
    });
  };

  // Check if date is today
  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  // Check if date is in the past
  const isPast = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cellDate = new Date(year, month, day);
    return cellDate < today;
  };

  const handleDayClick = (day: number | null) => {
    if (day && onDateClick) {
      onDateClick(new Date(year, month, day));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-gray-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Days of week header */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const dayMeetings = getMeetingsForDay(day);
          const today = isToday(day);
          const past = isPast(day);

          return (
            <div
              key={index}
              onClick={() => handleDayClick(day)}
              className={`
                min-h-[100px] p-2 border-b border-r border-gray-200 dark:border-gray-700
                ${day ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors' : 'bg-gray-50 dark:bg-gray-900'}
                ${today ? 'bg-purple-50 dark:bg-purple-900/20' : ''}
                ${past && !today ? 'opacity-50' : ''}
              `}
            >
              {day && (
                <div className="space-y-1">
                  {/* Day number */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`
                        text-sm font-medium
                        ${today 
                          ? 'bg-purple-600 text-white w-7 h-7 rounded-full flex items-center justify-center' 
                          : 'text-gray-900 dark:text-white'}
                      `}
                    >
                      {day}
                    </span>
                    {dayMeetings.length > 0 && (
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {dayMeetings.length}
                      </span>
                    )}
                  </div>

                  {/* Meeting indicators */}
                  <div className="space-y-1">
                    {dayMeetings.slice(0, 3).map((meeting, idx) => (
                      <div
                        key={meeting.id}
                        className={`
                          text-xs px-2 py-1 rounded truncate
                          ${getStatusColor(meeting.status)}
                          text-white
                        `}
                        title={meeting.title}
                      >
                        {meeting.title}
                      </div>
                    ))}
                    {dayMeetings.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                        +{dayMeetings.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}