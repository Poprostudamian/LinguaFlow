// src/components/Header.tsx
import React from 'react';
import { LogOut, Sun, Moon, Languages } from 'lucide-react'; // ← DODAJ Languages icon
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext'; // ← DODAJ

export function Header() {
  const { session, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage(); // ← DODAJ

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t.header.appName}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.header.welcomeBack}, {session.user?.email}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Language Toggle - NOWY PRZYCISK */}
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={t.header.toggleLanguage}
            title={t.header.toggleLanguage}
          >
            <Languages className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase">
              {language}
            </span>
          </button>

          {/* Theme Toggle - Istniejący przycisk */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={t.header.toggleTheme}
            title={t.header.toggleTheme}
          >
            {isDark ? (
              <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Moon className="h-5 w-5 text-gray-600" />
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>{t.common.logout}</span>
          </button>
        </div>
      </div>
    </header>
  );
}