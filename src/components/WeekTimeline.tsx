// src/components/WeekTimeline.tsx - WEEKLY TIMELINE VIEW COMPONENT

import React from 'react';
import { Clock, Video, User } from 'lucide-react';
import { MeetingWithParticipants } from '../lib/meetingsAPI';

interface WeekTimelineProps {
  currentDate: Date;
  meetings: MeetingWithParticipants[];
  onMeetingClick?: (meeting: MeetingWithParticipants) => void;
}

export function WeekTimeline({ currentDate, meetings, onMeetingClick }: WeekTimelineProps) {
  // Get week days
  const getWeekDays = (date: Date) => {
    const days: Date[] = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    return days;
  };

  const weekDays = getWeekDays(currentDate);

  // Time slots (7 AM to 10 PM)
  const timeSlots = Array.from({ length: 15 }, (_, i) => i + 7);

  // Get meetings for a specific day
  const getMeetingsForDay = (date: Date) => {
    const dateStr = date.toDateString();
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.scheduled_at).toDateString();
      return meetingDate === dateStr;
    });
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Get meeting position in timeline
  const getMeetingPosition = (meeting: MeetingWithParticipants) => {
    const meetingDate = new Date(meeting.scheduled_at);
    const hour = meetingDate.getHours();
    const minutes = meetingDate.getMinutes();
    const top = ((hour - 7) * 60 + minutes) / 15; // 15 hours from 7 AM to 10 PM
    const height = (meeting.duration_minutes / 15) * 100;
    
    return { top: `${top}%`, height: `${Math.max(height, 5)}%` };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500 border-blue-600';
      case 'in_progress':
        return 'bg-green-500 border-green-600';
      case 'completed':
        return 'bg-gray-500 border-gray-600';
      case 'cancelled':
        return 'bg-red-500 border-red-600';
      default:
        return 'bg-gray-500 border-gray-600';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Week header */}
      <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
        <div className="p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
          Time
        </div>
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={`
              p-3 text-center border-l border-gray-200 dark:border-gray-700
              ${isToday(day) ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-gray-50 dark:bg-gray-900'}
            `}
          >
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {day.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div
              className={`
                text-lg font-bold mt-1
                ${isToday(day) 
                  ? 'text-purple-600 dark:text-purple-400' 
                  : 'text-gray-900 dark:text-white'}
              `}
            >
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Timeline grid */}
      <div className="relative">
        <div className="grid grid-cols-8">
          {/* Time column */}
          <div className="border-r border-gray-200 dark:border-gray-700">
            {timeSlots.map(hour => (
              <div
                key={hour}
                className="h-16 px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700"
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Days columns */}
          {weekDays.map((day, dayIndex) => {
            const dayMeetings = getMeetingsForDay(day);
            
            return (
              <div
                key={dayIndex}
                className={`
                  relative border-l border-gray-200 dark:border-gray-700
                  ${isToday(day) ? 'bg-purple-50/30 dark:bg-purple-900/10' : ''}
                `}
              >
                {/* Hour lines */}
                {timeSlots.map(hour => (
                  <div
                    key={hour}
                    className="h-16 border-b border-gray-200 dark:border-gray-700"
                  />
                ))}

                {/* Meetings */}
                {dayMeetings.map(meeting => {
                  const position = getMeetingPosition(meeting);
                  const statusColor = getStatusColor(meeting.status);

                  return (
                    <div
                      key={meeting.id}
                      onClick={() => onMeetingClick?.(meeting)}
                      className={`
                        absolute left-1 right-1 px-2 py-1 rounded-lg border-l-4 cursor-pointer
                        ${statusColor}
                        text-white text-xs overflow-hidden
                        hover:shadow-lg transition-all duration-200 hover:scale-105
                        z-10
                      `}
                      style={{
                        top: position.top,
                        height: position.height,
                        minHeight: '40px'
                      }}
                      title={`${meeting.title} - ${formatTime(meeting.scheduled_at)}`}
                    >
                      <div className="font-semibold truncate">{meeting.title}</div>
                      <div className="flex items-center space-x-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">{formatTime(meeting.scheduled_at)}</span>
                      </div>
                      {meeting.participants && meeting.participants.length > 0 && (
                        <div className="flex items-center space-x-1 mt-0.5">
                          <User className="h-3 w-3" />
                          <span className="text-xs">{meeting.participants.length}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}