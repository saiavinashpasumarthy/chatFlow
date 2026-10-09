import React, { createContext, useContext, useEffect, useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../config/firebase";

const AuthContext = createContext(null);

const DEMO_STORAGE_KEY = "relay_demo_user_session";

export const DEFAULT_DEMO_ACCOUNT = {
  id: "demo-usr-1",
  name: "Alex Rivera",
  email: "alex.rivera@relay.dev",
  role: "Lead Frontend Engineer",
  department: "Engineering",
  avatarUrl: "",
  status: "online",
  location: "San Francisco, CA (PST)",
  bio: "Lead engineer exploring Relay unified communications."
};

const getStoredDemoUser = () => {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("Failed to load demo user session:", error);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredDemoUser);
  const [loading, setLoading] = useState(false);

  // Sync session state to localStorage
  const saveUserSession = (sessionUser) => {
    if (sessionUser) {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(sessionUser));
    } else {
      localStorage.removeItem(DEMO_STORAGE_KEY);
    }
    setUser(sessionUser);
  };

  /**
   * Frontend-only demo login.
   * Accepts any valid email/password without remote network dependencies.
   * Passwords are not saved or transmitted.
   */
  const login = async ({ email, password }) => {
    const trimmedEmail = (email || "").trim().toLowerCase();

    // Check if logging in as standard demo account
    let loggedUser;
    if (trimmedEmail === DEFAULT_DEMO_ACCOUNT.email.toLowerCase()) {
      loggedUser = { ...DEFAULT_DEMO_ACCOUNT };
    } else {
      const derivedName = (trimmedEmail.split("@")[0] || "Demo User")
        .replace(/[._-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      loggedUser = {
        id: `demo-${Date.now()}`,
        name: derivedName,
        email: trimmedEmail,
        role: "Team Member",
        department: "Engineering",
        avatarUrl: "",
        status: "online",
        location: "Remote",
        bio: "Demo workspace participant."
      };
    }

    saveUserSession(loggedUser);
    return loggedUser;
  };

  /**
   * Frontend-only demo sign-up.
   * Creates a demo profile in local state. Passwords are not stored.
   */
  const signup = async ({ name, email, password, department }) => {
    const trimmedName = (name || "").trim() || "New Member";
    const trimmedEmail = (email || "").trim().toLowerCase();

    const newUser = {
      id: `demo-${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      role: "Team Member",
      department: department || "Engineering",
      avatarUrl: "",
      status: "online",
      location: "Remote",
      bio: `Joined the ${department || "Engineering"} team in Relay demo workspace.`
    };

    saveUserSession(newUser);
    return newUser;
  };

  /**
   * Google sign-in: attempts Firebase popup authentication, with graceful fallback.
   */
  const loginWithGoogle = async () => {
    try {
      if (auth && auth.app) {
        const provider = new GoogleAuthProvider();
        const credential = await signInWithPopup(auth, provider);
        const fbUser = credential.user;

        const googleUser = {
          id: fbUser.uid,
          name: fbUser.displayName || "Google User",
          email: fbUser.email || "user@relay.dev",
          role: "Team Member",
          department: "Engineering",
          avatarUrl: fbUser.photoURL || "",
          status: "online",
          location: "Remote",
          bio: "Relay team member."
        };

        saveUserSession(googleUser);
        return googleUser;
      }
    } catch (e) {
      console.warn("Firebase Google popup note:", e);
      if (e.code === "auth/popup-closed-by-user" || e.code === "auth/popup-blocked") {
        throw e;
      }
    }

    const fallbackUser = {
      id: "usr-google-relay",
      name: "Alex Rivera",
      email: "alex.rivera@relay.dev",
      role: "Lead Frontend Engineer",
      department: "Engineering",
      avatarUrl: "",
      status: "online",
      location: "San Francisco, CA (PST)",
      bio: "Signed in via Google."
    };

    saveUserSession(fallbackUser);
    return fallbackUser;
  };

  /**
   * Demo logout: clears the local session.
   */
  const logout = async () => {
    saveUserSession(null);
  };

  const updateStatus = (status) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, status };
      try {
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not persist status update", e);
      }
      return updated;
    });
  };

  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        loginWithGoogle,
        signup,
        logout,
        updateStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};