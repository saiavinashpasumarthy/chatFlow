import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Menu,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  X,
  LogOut
} from 'lucide-react';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { useToast } from '../../context/ToastContext';
import { ThemeToggle } from '../common/ThemeToggle';


export const TopBar = ({
  user,
  notifications,
  onOpenMobileMenu,
  searchQuery,
  onSearchChange,
  onUpdateUserStatus,
  onMarkNotificationsRead,
  onToggleNotificationRead,
  onDismissNotification,
  onClearAllNotifications,
  onNavigate,
  onLogout
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const notifContainerRef = useRef(null);
  const profileRef = useRef(null);
  const searchInputRef = useRef(null);

  const { addToast } = useToast();
  const unreadNotifs = notifications.filter((n) => !n.read).length;


  // Automatically set the status to online when a user signs in.
  useEffect(() => {
    const userId = user?.uid || user?.id || user?.email;

    if (!userId) return;

    onUpdateUserStatus?.('online');
  }, [user?.uid, user?.id, user?.email]);
  // Global keyboard shortcut '/' to focus search, and 'Escape' to clear/unfocus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (showProfileMenu) setShowProfileMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showProfileMenu]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSyncWorkspace = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      addToast({
        title: 'Workspace Synced',
        message: 'All local mailboxes, conversations, and contact presence are up to date.',
        type: 'success'
      });
    }, 750);
  };

  const handleMarkAllRead = () => {
    if (onMarkNotificationsRead) {
      onMarkNotificationsRead();
      addToast({
        title: 'Notifications',
        message: 'All notifications marked as read.',
        type: 'info'
      });
    }
  };

  const handleClearAll = () => {
    if (onClearAllNotifications) {
      onClearAllNotifications();
      addToast({
        title: 'Notifications Cleared',
        message: 'All notifications removed.',
        type: 'trash'
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-500';
      case 'away':
        return 'bg-amber-400';
      case 'busy':
        return 'bg-rose-500';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Left: Mobile hamburger & search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search emails, messages, contacts..."
            aria-label="Global search across Relay"
            className="w-full pl-9 pr-12 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:border-transparent"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded"
                aria-label="Clear search input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-2xs">
                /
              </kbd>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions, Notifications & Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2 ml-4">
        {/* Theme Switcher Toggle */}
        <ThemeToggle />

        {/* Simulate Workspace Sync / Refresh */}
        <button
          type="button"
          onClick={handleSyncWorkspace}
          disabled={isSyncing}
          className={`p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            isSyncing ? 'cursor-not-allowed opacity-75' : ''
          }`}
          title="Sync workspace"
          aria-label="Sync workspace"
        >
          <RefreshCw
            className={`w-4 h-4 text-slate-500 dark:text-slate-400 ${isSyncing ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`}
          />
        </button>

        {/* Notifications Center Trigger */}
        <div className="relative" ref={notifContainerRef}>
          <button
            type="button"
            onClick={() => setShowNotifications((prev) => !prev)}
            aria-label={`Open notifications (${unreadNotifs} unread)`}
            aria-expanded={showNotifications}
            aria-haspopup="dialog"
            className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifs > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600" />
              </span>
            )}
          </button>

          {/* Connected NotificationCenter */}
          <NotificationCenter
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            notifications={notifications}
            onMarkAllRead={handleMarkAllRead}
            onToggleRead={onToggleNotificationRead}
            onDismissNotification={onDismissNotification}
            onClearAll={handleClearAll}
            onNavigate={onNavigate}
          />
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setShowProfileMenu((prev) => !prev)}
            aria-label="User profile menu"
            aria-expanded={showProfileMenu}
            aria-haspopup="menu"
            className="flex items-center gap-2.5 p-1.5 pl-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
                {user.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${getStatusColor(
                  user.status
                )}`}
              />
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                {user.name}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight capitalize">
                {user.status}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 hidden md:block" />
          </button>

          {showProfileMenu && (
            <div
              role="menu"
              aria-label="User status options"
              className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md">
                  {user.role}
                </span>
              </div>

              {/* Status Selector */}
              <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                <p className="px-2 py-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Set Status
                </p>
                {['online', 'away', 'busy', 'offline'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onUpdateUserStatus(st);
                      setShowProfileMenu(false);
                      addToast({
                        title: 'Presence Updated',
                        message: `Status set to ${st}.`,
                        type: 'info'
                      });
                    }}
                    className={`flex items-center justify-between w-full px-2.5 py-1.5 text-xs rounded-lg transition-colors capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      user.status === st
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 font-semibold text-indigo-700 dark:text-indigo-300'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(st)}`} />
                      {st}
                    </div>
                    {user.status === st && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                  </button>
                ))}
              </div>

              {/* Theme Preference Option in Profile Dropdown */}
              <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                <p className="px-2 py-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Appearance
                </p>
                <ThemeToggle variant="menuitem" />
              </div>

              {/* App links */}
              <div className="p-2 text-xs">
                <div className="px-2 py-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                  Relay System
                </div>
              </div>

              {/* Logout Action */}
              <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onLogout) onLogout();
                  }}
                  className="flex items-center gap-2 w-full px-2.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
