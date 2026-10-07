import { useState, useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { InboxPage } from './pages/InboxPage';
import { ChatPage } from './pages/ChatPage';
import { ContactsPage } from './pages/ContactsPage';
import { FilesPage } from './pages/FilesPage';
import { ToastProvider } from './context/ToastContext';
import {
  currentUser as initialUser,
  mockEmails,
  mockConversations as initialConversations,
  mockChatMessages,
  mockContacts,
  mockFiles,
  mockNotifications as initialNotifs
} from './data/mockData';
import { loadStoredEmails, saveStoredEmails } from './utils/storage';

export function AppContent() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [user, setUser] = useState(initialUser);
  const [notifications, setNotifications] = useState(initialNotifs);
  const [searchQuery, setSearchQuery] = useState('');
  const [emails, setEmails] = useState(() => loadStoredEmails(mockEmails));
  const [prefilledRecipient, setPrefilledRecipient] = useState(null);
  const [targetEmailId, setTargetEmailId] = useState(null);
  const [conversations, setConversations] = useState(initialConversations);
  const [targetContactChat, setTargetContactChat] = useState(null);
  const [targetConversationId, setTargetConversationId] = useState(null);
  const [contacts, setContacts] = useState(mockContacts);
  const [files, setFiles] = useState(mockFiles);

  useEffect(() => {
    saveStoredEmails(emails);
  }, [emails]);

  const unreadEmailCount = emails.filter((e) => e.folder === 'inbox' && e.unread).length;
  const unreadChatCount = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const handleUpdateUserStatus = (status) => {
    setUser((prev) => ({ ...prev, status }));
  };

  const handleMarkNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleToggleNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const handleDismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleNavigateFromNotification = ({ targetTab, targetEmailId, targetConvId }) => {
    if (targetTab) {
      setActiveTab(targetTab);
    }
    if (targetEmailId) {
      setTargetEmailId(targetEmailId);
    }
    if (targetConvId) {
      setTargetConversationId(targetConvId);
    }
  };

  const handleStartChatFromContact = (contactName) => {
    setTargetContactChat(contactName);
    setActiveTab('chat');
  };

  const handleSendEmailFromContact = (contactEmail) => {
    setPrefilledRecipient(contactEmail);
    setActiveTab('inbox');
  };

  return (
    <AppShell
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      user={user}
      notifications={notifications}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onUpdateUserStatus={handleUpdateUserStatus}
      onMarkNotificationsRead={handleMarkNotificationsRead}
      onToggleNotificationRead={handleToggleNotificationRead}
      onDismissNotification={handleDismissNotification}
      onClearAllNotifications={handleClearAllNotifications}
      onNavigate={handleNavigateFromNotification}
      unreadEmailCount={unreadEmailCount}
      unreadChatCount={unreadChatCount}
    >
      {activeTab === 'inbox' && (
        <InboxPage
          emails={emails}
          onUpdateEmails={setEmails}
          searchQuery={searchQuery}
          prefilledRecipient={prefilledRecipient}
          onClearPrefilledRecipient={() => setPrefilledRecipient(null)}
          targetEmailId={targetEmailId}
          onClearTargetEmailId={() => setTargetEmailId(null)}
        />
      )}
      {activeTab === 'chat' && (
        <ChatPage
          conversations={conversations}
          onUpdateConversations={setConversations}
          initialMessages={mockChatMessages}
          searchQuery={searchQuery}
          targetContactChat={targetContactChat}
          onClearTargetContactChat={() => setTargetContactChat(null)}
          targetConversationId={targetConversationId}
          onClearTargetConversationId={() => setTargetConversationId(null)}
        />
      )}
      {activeTab === 'contacts' && (
        <ContactsPage
          contacts={contacts}
          onUpdateContacts={setContacts}
          searchQuery={searchQuery}
          onStartChat={handleStartChatFromContact}
          onSendEmail={handleSendEmailFromContact}
        />
      )}
      {activeTab === 'files' && (
        <FilesPage
          files={files}
          onUpdateFiles={setFiles}
          searchQuery={searchQuery}
          onNavigateTab={setActiveTab}
        />
      )}
    </AppShell>
  );
}

export function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
