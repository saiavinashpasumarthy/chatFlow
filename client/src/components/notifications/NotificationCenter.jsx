import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  Mail,
  MessageSquare,
  Sparkles,
  X,
  ExternalLink,
  Check
} from 'lucide-react';
import { EmptyState } from '../common/EmptyState';

export const NotificationCenter = ({
  isOpen,
  onClose,
  notifications = [],
  onMarkAllRead,
  onToggleRead,
  onDismissNotification,
  onClearAll,
  onNavigate
}) => {
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread' | 'email' | 'chat' | 'system'
  const containerRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;
  const emailCount = notifications.filter((n) => n.type === 'email').length;
  const chatCount = notifications.filter((n) => n.type === 'chat').length;
  const systemCount = notifications.filter((n) => n.type === 'system').length;

  const filteredNotifications = notifications.filter((n) => {
    if (filterTab === 'unread') return !n.read;
    if (filterTab === 'email') return n.type === 'email';
    if (filterTab === 'chat') return n.type === 'chat';
    if (filterTab === 'system') return n.type === 'system';
    return true;
  });

  const getNotifIcon = (type) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'system':
      default:
        return <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
    }
  };

  const getNotifBadgeColor = (type) => {
    switch (type) {
      case 'email':
        return 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300';
      case 'chat':
        return 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300';
      case 'system':
      default:
        return 'bg-amber-50 dark:bg-amber-950/60 border-amber-100 dark:border-amber-800 text-amber-700 dark:text-amber-300';
    }
  };

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Notification Center"
      className="absolute right-0 mt-2 w-80 sm:w-96 md:w-[420px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 transition-colors"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 leading-none">
                Notifications
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-200 mt-1">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                  : 'All caught up'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && onMarkAllRead && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}
            {notifications.length > 0 && onClearAll && (
              <button
                type="button"
                onClick={onClearAll}
                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                title="Clear all notifications"
                aria-label="Clear all notifications"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="Close notification center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 mt-3 overflow-x-auto pb-0.5 text-xs">
          {[
            { id: 'all', label: 'All', count: notifications.length },
            { id: 'unread', label: 'Unread', count: unreadCount },
            { id: 'email', label: 'Email', count: emailCount },
            { id: 'chat', label: 'Chat', count: chatCount },
            { id: 'system', label: 'System', count: systemCount }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                filterTab === tab.id
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    filterTab === tab.id
                      ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
        {filteredNotifications.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={BellOff}
              title="No notifications"
              description={
                filterTab === 'unread'
                  ? "You've read all your notifications."
                  : `No ${filterTab === 'all' ? '' : filterTab} notifications to display.`
              }
              actionLabel={filterTab !== 'all' ? 'View all' : undefined}
              onAction={filterTab !== 'all' ? () => setFilterTab('all') : undefined}
            />
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`group relative p-3.5 flex items-start gap-3 transition-colors ${
                !notif.read
                  ? 'bg-indigo-50/35 dark:bg-indigo-950/30 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/50'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              {/* Type Icon Badge */}
              <div
                className={`p-2 rounded-xl border shrink-0 mt-0.5 ${getNotifBadgeColor(
                  notif.type
                )}`}
              >
                {getNotifIcon(notif.type)}
              </div>

              {/* Notification Content */}
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => {
                  if (!notif.read && onToggleRead) {
                    onToggleRead(notif.id);
                  }
                  if (onNavigate && (notif.targetTab || notif.targetEmailId || notif.targetConvId)) {
                    onNavigate({
                      targetTab: notif.targetTab,
                      targetEmailId: notif.targetEmailId,
                      targetConvId: notif.targetConvId
                    });
                    onClose();
                  }
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-xs font-semibold leading-tight truncate ${
                      !notif.read ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {notif.title}
                  </p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                    {notif.timestamp}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {notif.description}
                </p>

                {/* Deep Link Hint if applicable */}
                {notif.targetTab && (
                  <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
                    <ExternalLink className="w-2.5 h-2.5" />
                    <span>
                      {notif.targetTab === 'inbox'
                        ? 'Open in Inbox'
                        : notif.targetTab === 'chat'
                        ? 'Open conversation'
                        : 'Open in Files'}
                    </span>
                  </span>
                )}
              </div>

              {/* Action Buttons & Unread Dot */}
              <div className="flex items-center gap-1 shrink-0 ml-1">
                {!notif.read && (
                  <span
                    className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400"
                    title="Unread"
                  />
                )}
                <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleRead) onToggleRead(notif.id);
                    }}
                    className="p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={notif.read ? 'Mark as unread' : 'Mark as read'}
                    aria-label={notif.read ? 'Mark as unread' : 'Mark as read'}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDismissNotification) onDismissNotification(notif.id);
                    }}
                    className="p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Dismiss notification"
                    aria-label="Dismiss notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer / Disclaimer */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-500">
        <span>Notification Center</span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">Esc to close</span>
      </div>
    </div>
  );
};
