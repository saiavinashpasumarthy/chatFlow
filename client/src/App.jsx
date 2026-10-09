import { useState, useEffect, useCallback } from "react";

import { AppShell } from "./components/layout/AppShell";
import { InboxPage } from "./pages/InboxPage";
import { ChatPage } from "./pages/ChatPage";
import { ContactsPage } from "./pages/ContactsPage";
import { FilesPage } from "./pages/FilesPage";
import MeetPage  from "./pages/MeetPage";
import { LoginPage } from "./pages/LoginPage";
import { SignUpPage } from "./pages/SignUpPage";

import { ToastProvider, useToast } from "./context/ToastContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { getUsers } from "./services/api";
import { io } from "socket.io-client";

/**
 * Hash route parser:
 * - Directs initial visitors and root hash (# or #/) directly to the split-screen login page.
 * - Supports #/login, #/signup, and protected #/app/<tab> routes.
 */
const parseHashRoute = () => {
  const hash = window.location.hash || "";

  if (!hash || hash === "#" || hash === "#/" || hash === "#/login" || hash === "#/landing") {
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
    view: "login",
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

  // Workspace data starts empty and is populated by the authenticated backend APIs.
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [emails, setEmails] = useState([]);
  const [prefilledRecipient, setPrefilledRecipient] = useState(null);
  const [targetEmailId, setTargetEmailId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [targetConversationId, setTargetConversationId] = useState(null);

  // Contacts and files are loaded from authenticated backend APIs.
  const [contacts, setContacts] = useState([]);
  const [files, setFiles] = useState([]);
useEffect(() => {
  const storedUser = localStorage.getItem("relay_demo_user_session");
  console.log("Stored session:", storedUser);

  if (!storedUser) return;

  let userId;

  try {
    userId = JSON.parse(storedUser)?.id;
  } catch {
    console.error("Could not read the logged-in user.");
    return;
  }

  if (!userId) return;

  const socket = io("http://localhost:5000", {
    withCredentials: true,
  });

  // Load existing notifications from Firebase through the backend.
  const loadNotifications = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/notifications",
        {
          headers: {
            "x-user-id": String(userId),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load notifications: ${response.status}`);
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Notification loading error:", error);
    }
  };

  socket.on("connect", () => {
    socket.emit("join_user", String(userId));
  });

  socket.on("notification:new", (notification) => {
    setNotifications((previous) => [
      notification,
      ...previous.filter((item) => item.id !== notification.id),
    ]);
  });

  loadNotifications();

  return () => {
    socket.off("connect");
    socket.off("notification:new");
    socket.disconnect();
  };
}, []);
  // Load registered users for Contacts from the backend
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

  // Protected route enforcement: unauthenticated visitors opening #/app/* are redirected to #/login
  useEffect(() => {
    if (routeState.view === "app" && !isAuthenticated) {
      window.location.hash = "#/login";

      addToast({
        title: "Authentication Required",
        message: "Please sign in to access ChatFlow.",
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
    if (view === "login" || view === "landing") {
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

  // Login handler
  const handleLogin = async (credentials) => {
    const loggedUser = await login(credentials);

    addToast({
      title: "Welcome to ChatFlow",
      message: `Signed in as ${loggedUser.name} (${loggedUser.department || "Engineering"}).`,
      type: "success",
    });

    navigateTo("app", "inbox");
  };

  // Google Login handler
  const handleGoogleLogin = async () => {
    const loggedUser = await loginWithGoogle();

    addToast({
      title: "Welcome to ChatFlow",
      message: `Signed in with Google as ${loggedUser.name || loggedUser.email}.`,
      type: "success",
    });

    navigateTo("app", "inbox");
  };

  // Sign-up handler
  const handleSignup = async (profileData) => {
    const newUser = await signup(profileData);

    addToast({
      title: "Account Created",
      message: `Welcome to Relay, ${newUser.name}!`,
      type: "success",
    });

    navigateTo("app", "inbox");
  };

  // Logout handler returning to split-screen login page
  const handleLogout = async () => {
    await logout();

    addToast({
      title: "Signed Out",
      message: "You have been signed out of ChatFlow.",
      type: "info",
    });

    navigateTo("login");
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
    targetEmailId: tEmailId,
    targetConvId,
  }) => {
    if (targetTab) {
      handleSelectTab(targetTab);
    }
    if (tEmailId) {
      setTargetEmailId(tEmailId);
    }
    if (targetConvId) {
      setTargetConversationId(targetConvId);
    }
  };

  const handleStartChatFromContact = (target) => {
    if (typeof target === "string") {
      // Find conversation by participant name or set active
      const match = conversations.find((c) =>
        c.name.toLowerCase().includes(target.toLowerCase())
      );
      if (match) {
        setTargetConversationId(match.id);
      }
    }
    handleSelectTab("chat");
  };

  const handleSendEmailFromContact = (contactEmail) => {
    setPrefilledRecipient(contactEmail);
    handleSelectTab("inbox");
  };

  // 1. Split-screen Login Page (default entry point)
  if (routeState.view === "login" || (!isAuthenticated && routeState.view !== "signup")) {
    return (
      <LoginPage
        onNavigate={navigateTo}
        onLogin={handleLogin}
        onGoogleLogin={handleGoogleLogin}
      />
    );
  }

  // 2. Sign Up Page
  if (routeState.view === "signup" && !isAuthenticated) {
    return (
      <SignUpPage
        onNavigate={navigateTo}
        onSignup={handleSignup}
      />
    );
  }

  // 3. Protected Workspace (Inbox, Chat, Contacts, Files)
  if (!isAuthenticated || !user) {
    return (
      <LoginPage
        onNavigate={navigateTo}
        onLogin={handleLogin}
        onGoogleLogin={handleGoogleLogin}
      />
    );
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
          onClearPrefilledRecipient={() => setPrefilledRecipient(null)}
          targetEmailId={targetEmailId}
          onClearTargetEmailId={() => setTargetEmailId(null)}
        />
      )}

      {activeTab === "chat" && (
        <ChatPage
          conversations={conversations}
          onUpdateConversations={setConversations}
          initialMessages={{}}
          searchQuery={searchQuery}
          targetConversationId={targetConversationId}
          onClearTargetConversationId={() => setTargetConversationId(null)}
        />
      )}

      {activeTab === "contacts" && (
        <ContactsPage
          contacts={contacts}
          onUpdateContacts={setContacts}
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

      {activeTab === "meet" && (
        <MeetPage
          currentUser={user}
          searchQuery={searchQuery}
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