import { useState, useEffect, useCallback } from 'react';
import { AppShell } from './components/layout/AppShell';
import { InboxPage } from './pages/InboxPage';
import { ChatPage } from './pages/ChatPage';
import { ContactsPage } from './pages/ContactsPage';
import { FilesPage } from './pages/FilesPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import {
  mockEmails,
  mockConversations as initialConversations,
  mockChatMessages,
  mockContacts,
  mockFiles,
  mockNotifications as initialNotifs,
  currentUser as defaultMockUser
} from './data/mockData';
import { loadStoredEmails, saveStoredEmails } from './utils/storage';

const parseHashRoute = () => {
  const hash = window.location.hash || '';
  if (!hash || hash === '#' || hash === '#/' || hash === '#/landing') {
    return { view: 'landing', tab: 'inbox' };
  }
  if (hash === '#/login') {
    return { view: 'login', tab: 'inbox' };
  }
  if (hash === '#/signup') {
    return { view: 'signup', tab: 'inbox' };
  }
  if (hash.startsWith('#/app')) {
    const parts = hash.split('/');
    const tab = parts[2] || 'inbox';
    return { view: 'app', tab };
  }
  return { view: 'landing', tab: 'inbox' };
};

export function AppContent() {
  const { user, isAuthenticated, login, signup, logout, updateStatus } = useAuth();
  const { addToast } = useToast();

  const [routeState, setRouteState] = useState(parseHashRoute);
  const [activeTab, setActiveTab] = useState(routeState.tab || 'inbox');

  // Shared workspace state
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

  // Sync route on hashchange
  useEffect(() => {
    const handleHashChange = () => {
      const nextRoute = parseHashRoute();
      setRouteState(nextRoute);
      if (nextRoute.view === 'app' && nextRoute.tab) {
        setActiveTab(nextRoute.tab);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Protected route enforcement: if visitor visits #/app/* while not authenticated, redirect to #/login
  useEffect(() => {
    if (routeState.view === 'app' && !isAuthenticated) {
      window.location.hash = '#/login';
      addToast({
        title: 'Authentication Required',
        message: 'Please log in to access the Relay workspace.',
        type: 'warning'
      });
    }
  }, [routeState.view, isAuthenticated, addToast]);

  // Persist email changes locally
  useEffect(() => {
    saveStoredEmails(emails);
  }, [emails]);

  const unreadEmailCount = emails.filter((e) => e.folder === 'inbox' && e.unread).length;
  const unreadChatCount = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const navigateTo = useCallback((view, tab = 'inbox') => {
    if (view === 'landing') {
      window.location.hash = '#/';
    } else if (view === 'login') {
      window.location.hash = '#/login';
    } else if (view === 'signup') {
      window.location.hash = '#/signup';
    } else if (view === 'app') {
      window.location.hash = `#/app/${tab}`;
    }
  }, []);

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    window.location.hash = `#/app/${tab}`;
  };

  const handleDemoLogin = (credentials) => {
    const loggedUser = login(credentials);
    addToast({
      title: 'Welcome Back',
      message: `Signed in as ${loggedUser.name}.`,
      type: 'success'
    });
    navigateTo('app', 'inbox');
  };

  const handleQuickDemoLogin = () => {
    const loggedUser = login({
      name: defaultMockUser.name,
      email: defaultMockUser.email,
      role: defaultMockUser.role
    });
    addToast({
      title: 'Demo Session Active',
      message: `Signed in as ${loggedUser.name} (${loggedUser.role}).`,
      type: 'success'
    });
    navigateTo('app', 'inbox');
  };

  const handleDemoSignup = (profileData) => {
    const newUser = signup(profileData);
    addToast({
      title: 'Account Created',
      message: `Welcome to Relay, ${newUser.name}!`,
      type: 'success'
    });
    navigateTo('app', 'inbox');
  };

  const handleLogout = () => {
    logout();
    addToast({
      title: 'Logged Out',
      message: 'You have been signed out of the Relay demo.',
      type: 'info'
    });
    navigateTo('landing');
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
      handleSelectTab(targetTab);
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
    handleSelectTab('chat');
  };

  const handleSendEmailFromContact = (contactEmail) => {
    setPrefilledRecipient(contactEmail);
    handleSelectTab('inbox');
  };

  // 1. Landing Page View
  if (routeState.view === 'landing') {
    return (
      <LandingPage
        onNavigate={navigateTo}
        onQuickLogin={handleQuickDemoLogin}
      />
    );
  }

  // 2. Login View
  if (routeState.view === 'login') {
    return (
      <LoginPage
        onNavigate={navigateTo}
        onLogin={handleDemoLogin}
        onQuickDemoLogin={handleQuickDemoLogin}
      />
    );
  }

  // 3. Sign Up View
  if (routeState.view === 'signup') {
    return (
      <SignUpPage
        onNavigate={navigateTo}
        onSignup={handleDemoSignup}
      />
    );
  }

  // 4. Protected Workspace Application (AppShell)
  // If not authenticated, the useEffect redirects to login. Render null/loading while transitioning.
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <AppShell
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
      user={user}
      notifications={notifications}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onUpdateUserStatus={updateStatus}
      onMarkNotificationsRead={handleMarkNotificationsRead}
      onToggleNotificationRead={handleToggleNotificationRead}
      onDismissNotification={handleDismissNotification}
      onClearAllNotifications={handleClearAllNotifications}
      onNavigate={handleNavigateFromNotification}
      onLogout={handleLogout}
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
          onNavigateTab={handleSelectTab}
        />
      )}
    </AppShell>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
