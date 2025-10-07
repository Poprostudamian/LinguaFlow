// src/components/KPICard.tsx - ENHANCED VERSION WITH BETTER VISUALS

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'purple' | 'blue' | 'green' | 'orange';
  trend?: number; // Optional: percentage change
  subtitle?: string; // Optional: additional context
}

export function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'purple',
  trend,
  subtitle
}: KPICardProps) {
  const colorClasses = {
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800',
      gradient: 'from-purple-500 to-purple-600'
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
      gradient: 'from-blue-500 to-blue-600'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800',
      gradient: 'from-green-500 to-green-600'
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      text: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-800',
      gradient: 'from-orange-500 to-orange-600'
    },
  };

  const colors = colorClasses[color];

  return (
    <div className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 hover:scale-105">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {title}
          </p>
          <div className="flex items-baseline space-x-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
            {trend !== undefined && (
              <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Icon with gradient background */}
        <div className={`relative p-3 rounded-xl ${colors.bg} ${colors.text} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="h-7 w-7" strokeWidth={2.5} />
          
          {/* Animated pulse effect on hover */}
          <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
        </div>
      </div>

      {/* Progress indicator line */}
      <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-500`}
          style={{ width: '70%' }} // You can make this dynamic based on progress
        />
      </div>
    </div>
  );
}