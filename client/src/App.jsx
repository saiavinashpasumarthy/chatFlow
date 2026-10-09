import { useState, useEffect, useCallback } from "react";

import { AppShell } from "./components/layout/AppShell";
import { InboxPage } from "./pages/InboxPage";
import { ChatPage } from "./pages/ChatPage";
import { ContactsPage } from "./pages/ContactsPage";
import { FilesPage } from "./pages/FilesPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { SignUpPage } from "./pages/SignUpPage";

import { ToastProvider, useToast } from "./context/ToastContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

import {
  mockConversations as initialConversations,
  mockChatMessages,
  mockFiles,
  mockNotifications as initialNotifs,
} from "./data/mockData";

import { getUsers } from "./services/api";

const parseHashRoute = () => {
  const hash = window.location.hash || "";

  if (!hash || hash === "#" || hash === "#/" || hash === "#/landing") {
    return {
      view: "landing",
      tab: "inbox",
    };
  }

  if (hash === "#/login") {
    return {
      view: "login",
      tab: "inbox",
    };
  }

  if (hash === "#/signup") {
    return {
      view: "signup",
      tab: "inbox",
    };
  }

  if (hash.startsWith("#/app")) {
    const parts = hash.split("/");
    const tab = parts[2] || "inbox";

    return {
      view: "app",
      tab,
    };
  }

  return {
    view: "landing",
    tab: "inbox",
  };
};

export function AppContent() {
  const {
    user,
    isAuthenticated,
    login,
    loginWithGoogle,
    signup,
    logout,
    updateStatus,
  } = useAuth();

  const { addToast } = useToast();

  const [routeState, setRouteState] = useState(parseHashRoute);
  const [activeTab, setActiveTab] = useState(routeState.tab || "inbox");

  // Shared workspace state
  const [notifications, setNotifications] = useState(initialNotifs);
  const [searchQuery, setSearchQuery] = useState("");

  const [emails, setEmails] = useState([]);
  const [prefilledRecipient, setPrefilledRecipient] = useState(null);
  const [targetEmailId, setTargetEmailId] = useState(null);

  const [conversations, setConversations] = useState(initialConversations);
  const [targetConversationId, setTargetConversationId] = useState(null);

  // Real contacts loaded from Firestore through the backend
  const [contacts, setContacts] = useState([]);

  const [files, setFiles] = useState([]);

  // Load real registered users for Contacts
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setContacts([]);
      return;
    }

    const loadContacts = async () => {
      try {
        const data = await getUsers();

        setContacts(data.users || []);
      } catch (error) {
        console.error("Failed to load contacts:", error);

        addToast({
          title: "Contacts Error",
          message: error.message || "Failed to load contacts.",
          type: "error",
        });

        setContacts([]);
      }
    };

    loadContacts();
  }, [isAuthenticated, user, addToast]);

  // Sync route on hashchange
  useEffect(() => {
    const handleHashChange = () => {
      const nextRoute = parseHashRoute();

      setRouteState(nextRoute);

      if (nextRoute.view === "app" && nextRoute.tab) {
        setActiveTab(nextRoute.tab);
      }
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  // Protected route enforcement
  useEffect(() => {
    if (routeState.view === "app" && !isAuthenticated) {
      window.location.hash = "#/login";

      addToast({
        title: "Authentication Required",
        message: "Please log in to access the Relay workspace.",
        type: "warning",
      });
    }
  }, [routeState.view, isAuthenticated, addToast]);

  const unreadEmailCount = emails.filter(
    (email) => email.folder === "inbox" && email.unread
  ).length;

  const unreadChatCount = conversations.reduce(
    (acc, conversation) => acc + (conversation.unreadCount || 0),
    0
  );

  const navigateTo = useCallback((view, tab = "inbox") => {
    if (view === "landing") {
      window.location.hash = "#/";
    } else if (view === "login") {
      window.location.hash = "#/login";
    } else if (view === "signup") {
      window.location.hash = "#/signup";
    } else if (view === "app") {
      window.location.hash = `#/app/${tab}`;
    }
  }, []);

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    window.location.hash = `#/app/${tab}`;
  };

  // Real Firebase login
  const handleLogin = async (credentials) => {
    const loggedUser = await login(credentials);

    addToast({
      title: "Welcome Back",
      message: `Signed in as ${loggedUser.name || loggedUser.email}.`,
      type: "success",
    });

    navigateTo("app", "inbox");
  };

  // Real account signup
  const handleSignup = async (profileData) => {
    const newUser = await signup(profileData);

    addToast({
      title: "Account Created",
      message: `Welcome to Relay, ${newUser.name || newUser.email}!`,
      type: "success",
    });

    navigateTo("app", "inbox");
  };

  const handleLogout = async () => {
    await logout();

    setContacts([]);
    setConversations([]);

    addToast({
      title: "Logged Out",
      message: "You have been signed out of Relay.",
      type: "info",
    });

    navigateTo("landing");
  };

  const handleMarkNotificationsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  };

  const handleToggleNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              read: !notification.read,
            }
          : notification
      )
    );
  };

  const handleDismissNotification = (id) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleNavigateFromNotification = ({
    targetTab,
    targetEmailId,
    targetConvId,
  }) => {
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

  // ContactsPage creates/opens the real conversation.
  // App only receives the conversation ID and opens Chat.
  const handleStartChatFromContact = (contact, conversationId) => {
    if (!conversationId) {
      addToast({
        title: "Chat Error",
        message: "Conversation could not be opened.",
        type: "error",
      });

      return;
    }

    setTargetConversationId(conversationId);
    handleSelectTab("chat");
  };

  const handleSendEmailFromContact = (contactEmail) => {
    setPrefilledRecipient(contactEmail);
    handleSelectTab("inbox");
  };

  // 1. Landing Page
  if (routeState.view === "landing") {
    return <LandingPage onNavigate={navigateTo} />;
  }

  // 2. Login Page
  if (routeState.view === "login") {
    return (
      <LoginPage
        onNavigate={navigateTo}
        onLogin={handleLogin}
        onGoogleLogin={async () => {
          const loggedUser = await loginWithGoogle();

          addToast({
            title: "Welcome Back",
            message: `Signed in as ${
              loggedUser.name || loggedUser.email
            }.`,
            type: "success",
          });

          navigateTo("app", "inbox");
        }}
      />
    );
  }

  // 3. Sign Up Page
  if (routeState.view === "signup") {
    return (
      <SignUpPage
        onNavigate={navigateTo}
        onSignup={handleSignup}
      />
    );
  }

  // 4. Protected Workspace
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
      {activeTab === "inbox" && (
        <InboxPage
          emails={emails}
          onUpdateEmails={setEmails}
          searchQuery={searchQuery}
          prefilledRecipient={prefilledRecipient}
          onClearPrefilledRecipient={() =>
            setPrefilledRecipient(null)
          }
          targetEmailId={targetEmailId}
          onClearTargetEmailId={() => setTargetEmailId(null)}
        />
      )}

      {activeTab === "chat" && (
        <ChatPage
          conversations={conversations}
          onUpdateConversations={setConversations}
          initialMessages={mockChatMessages}
          searchQuery={searchQuery}
          targetConversationId={targetConversationId}
          onClearTargetConversationId={() =>
            setTargetConversationId(null)
          }
        />
      )}

      {activeTab === "contacts" && (
        <ContactsPage
          contacts={contacts}
          searchQuery={searchQuery}
          onStartChat={handleStartChatFromContact}
          onSendEmail={handleSendEmailFromContact}
        />
      )}

      {activeTab === "files" && (
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