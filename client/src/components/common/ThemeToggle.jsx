import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Accessible theme switcher button
 * Supports icon-only or with label
 */
export const ThemeToggle = ({
  className = '',
  showLabel = false,
  variant = 'button', // 'button' | 'menuitem' | 'pill'
  onToggle
}) => {
  const { theme, isDark, toggleTheme } = useTheme();

  const handleToggle = () => {
    toggleTheme();
    if (onToggle) onToggle();
  };

  const actionText = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  if (variant === 'menuitem') {
    return (
      <button
        type="button"
        role="menuitem"
        onClick={handleToggle}
        aria-label={actionText}
        className={`flex items-center justify-between w-full px-2.5 py-2 text-xs rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 ${className}`}
      >
        <div className="flex items-center gap-2">
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 shrink-0" />
          )}
          <span className="font-medium">
            {isDark ? 'Light Theme' : 'Dark Theme'}
          </span>
        </div>
        <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
          {theme}
        </span>
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        aria-label={actionText}
        title={actionText}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          isDark
            ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 shadow-2xs'
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs'
        } ${className}`}
      >
        {isDark ? (
          <Sun className="w-3.5 h-3.5 text-amber-400 animate-in spin-in-90 duration-200" />
        ) : (
          <Moon className="w-3.5 h-3.5 text-indigo-600 animate-in spin-in-90 duration-200" />
        )}
        <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
      </button>
    );
  }

  // Default button variant
  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={actionText}
      title={actionText}
      className={`p-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-200" />
      ) : (
        <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300 animate-in spin-in-90 duration-200" />
      )}
      {showLabel && (
        <span className="ml-2 text-xs font-medium">
          {isDark ? 'Light mode' : 'Dark mode'}
        </span>
      )}
    </button>
  );
};
