// src/components/UpcomingSidebar.tsx - QUICK ACCESS TO UPCOMING MEETINGS

import React from 'react';
import { Clock, Video, Calendar, User, ChevronRight } from 'lucide-react';
import { MeetingWithParticipants } from '../lib/meetingsAPI';

interface UpcomingSidebarProps {
  meetings: MeetingWithParticipants[];
  maxItems?: number;
  onMeetingClick?: (meeting: MeetingWithParticipants) => void;
}

export function UpcomingSidebar({ 
  meetings, 
  maxItems = 5,
  onMeetingClick 
}: UpcomingSidebarProps) {
  // Filter and sort upcoming meetings
  const now = new Date();
  const upcomingMeetings = meetings
    .filter(m => new Date(m.scheduled_at) > now && m.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, maxItems);

  // Get next meeting (very next one)
  const nextMeeting = upcomingMeetings[0];

  // Format time until meeting
  const getTimeUntil = (dateString: string) => {
    const meetingDate = new Date(dateString);
    const diff = meetingDate.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `in ${days} day${days !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `in ${hours}h ${minutes}m`;
    } else {
      return `in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
      });
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  if (upcomingMeetings.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Upcoming Meetings
        </h3>
        <div className="text-center py-8">
          <div className="bg-gray-100 dark:bg-gray-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No upcoming meetings scheduled
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Upcoming Meetings
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {upcomingMeetings.length} meeting{upcomingMeetings.length !== 1 ? 's' : ''} scheduled
        </p>
      </div>

      {/* Next Meeting Highlight */}
      {nextMeeting && (
        <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">
                Next Meeting
              </p>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                {nextMeeting.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getTimeUntil(nextMeeting.scheduled_at)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(nextMeeting.scheduled_at)}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>{formatTime(nextMeeting.scheduled_at)} ({nextMeeting.duration_minutes} min)</span>
            </div>
          </div>

          <button
            onClick={() => window.open(nextMeeting.meeting_url, '_blank')}
            className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Video className="h-4 w-4" />
            <span>Join Now</span>
          </button>
        </div>
      )}

      {/* Other Upcoming Meetings */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {upcomingMeetings.slice(1).map((meeting) => (
          <div
            key={meeting.id}
            onClick={() => onMeetingClick?.(meeting)}
            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {meeting.title}
                </h4>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(meeting.scheduled_at)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatTime(meeting.scheduled_at)}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex-shrink-0 ml-2" />
            </div>
          </div>
        ))}
      </div>

      {/* View All Link */}
      {meetings.filter(m => new Date(m.scheduled_at) > now).length > maxItems && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button className="w-full text-center text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
            View all {meetings.filter(m => new Date(m.scheduled_at) > now).length} upcoming meetings →
          </button>
        </div>
      )}
    </div>
  );
}