import React from 'react';
import {
  Inbox,
  MessageSquare,
  Users,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Radio,
  SlidersHorizontal
} from 'lucide-react';

export const Sidebar = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  unreadEmailCount,
  unreadChatCount,
  isMobileOpen,
  onCloseMobile
}) => {
  const navItems = [
    {
      id: 'inbox',
      label: 'Inbox',
      icon: Inbox,
      badge: unreadEmailCount,
      badgeColor: 'bg-indigo-600 text-white'
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: MessageSquare,
      badge: unreadChatCount,
      badgeColor: 'bg-indigo-600 text-white'
    },
    {
      id: 'contacts',
      label: 'Contacts',
      icon: Users,
      badge: 0
    },
    {
      id: 'files',
      label: 'Files',
      icon: FolderOpen,
      badge: 0
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out lg:static ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-18 lg:w-20' : 'w-64'}`}
        aria-label="Sidebar Navigation"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 text-white shadow-sm shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-slate-900 dark:text-white tracking-tight text-base leading-none">
                  Relay
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium tracking-wide mt-1 uppercase">
                  Comm Suite
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Primary Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                title={isCollapsed ? item.label : undefined}
                className={`relative flex items-center w-full rounded-xl font-medium text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isCollapsed ? 'justify-center px-0 py-3' : 'justify-between px-3.5 py-2.5'
                } ${
                  isActive
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {/* Badge indicator */}
                {item.badge > 0 && (
                  <span
                    className={`inline-flex items-center justify-center text-xs font-semibold rounded-full ${
                      isCollapsed
                        ? 'absolute top-1.5 right-2 w-4 h-4 text-[10px] bg-indigo-600 text-white'
                        : `px-2 py-0.5 ${item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info & Mock Mode Indicator */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {!isCollapsed ? (
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Mock Mode Active</span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-normal">
                Local mock models active. Awaiting backend API endpoints.
              </p>
            </div>
          ) : (
            <div className="flex justify-center" title="Mock Mode Active">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 px-1 pt-1">
            {!isCollapsed && (
              <span className="flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                Relay v0.1.0
              </span>
            )}
            <button
              type="button"
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Preferences"
              aria-label="Settings"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
