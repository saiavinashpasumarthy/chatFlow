import React, { createContext, useContext, useState, useEffect } from 'react';
import { currentUser as defaultMockUser } from '../data/mockData';

const AuthContext = createContext(null);

const SESSION_STORAGE_KEY = 'relay_demo_session';

export const AuthProvider = ({ children }) => {
  // Load initial demo session from sessionStorage if present
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore sessionStorage parsing errors
    }
    return null;
  });

  const isAuthenticated = Boolean(user);

  const login = ({ email, name, role }) => {
    // Demo authentication: accepts any valid formatted credentials and creates demo session
    const resolvedUser = {
      id: user?.id || defaultMockUser.id,
      name: name || (email && email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase())) || defaultMockUser.name,
      email: email || defaultMockUser.email,
      role: role || defaultMockUser.role,
      status: 'online',
      avatarUrl: ''
    };

    setUser(resolvedUser);
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(resolvedUser));
    } catch {
      // Ignore sessionStorage errors
    }
    return resolvedUser;
  };

  const signup = ({ name, email, department, role }) => {
    // Demo sign-up: creates local demo session profile without transmitting credentials
    const newUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role: role || (department ? `${department} Teammate` : 'Team Member'),
      status: 'online',
      avatarUrl: ''
    };

    setUser(newUser);
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newUser));
    } catch {
      // Ignore sessionStorage errors
    }
    return newUser;
  };

  const logout = () => {
    setUser(null);
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore sessionStorage errors
    }
  };

  const updateStatus = (status) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, status };
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore sessionStorage errors
      }
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        signup,
        logout,
        updateStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
