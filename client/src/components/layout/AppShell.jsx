import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const AppShell = ({
  activeTab,
  onSelectTab,
  user,
  notifications,
  searchQuery,
  onSearchChange,
  onUpdateUserStatus,
  onMarkNotificationsRead,
  onToggleNotificationRead,
  onDismissNotification,
  onClearAllNotifications,
  onNavigate,
  unreadEmailCount,
  unreadChatCount,
  children
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      {/* Navigation Rail / Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        unreadEmailCount={unreadEmailCount}
        unreadChatCount={unreadChatCount}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Workspace Frame */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <TopBar
          user={user}
          notifications={notifications}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onUpdateUserStatus={onUpdateUserStatus}
          onMarkNotificationsRead={onMarkNotificationsRead}
          onToggleNotificationRead={onToggleNotificationRead}
          onDismissNotification={onDismissNotification}
          onClearAllNotifications={onClearAllNotifications}
          onNavigate={onNavigate}
        />

        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50 focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
};
