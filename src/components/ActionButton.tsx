// src/components/ActionButton.tsx - POPRAWIONA WERSJA
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ActionButtonProps {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export function ActionButton({ label, icon: Icon, onClick, variant = 'primary' }: ActionButtonProps) {
  const baseClasses = "flex items-center justify-center space-x-2 px-6 py-3 rounded-md font-medium transition-all duration-200 hover:transform hover:scale-105";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md",
    secondary: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );
}