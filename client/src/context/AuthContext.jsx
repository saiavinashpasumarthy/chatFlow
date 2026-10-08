import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";

import { auth } from "../config/firebase";

const AuthContext = createContext(null);

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const buildUser = (firebaseUser, profile = {}) => ({
  id: firebaseUser.uid,
  name: profile.name || firebaseUser.displayName || "",
  email: profile.email || firebaseUser.email || "",
  role: profile.role || "Team Member",
  status: profile.status || "online",
  avatarUrl: profile.avatarUrl || firebaseUser.photoURL || "",
  department: profile.department || "",
  location: profile.location || "",
  bio: profile.bio || "",
});

const syncUserProfile = async (firebaseUser, extraData = {}) => {
  const idToken = await firebaseUser.getIdToken();

  const response = await fetch(`${API_URL}/api/auth/profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      department: extraData.department || "",
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to sync user profile");
  }

  return data.user;
};

const fetchUserProfile = async (firebaseUser) => {
  const idToken = await firebaseUser.getIdToken();

  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch user profile");
  }

  return data.user;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (!firebaseUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          const profile = await fetchUserProfile(firebaseUser);

          setUser(buildUser(firebaseUser, profile || {}));
        } catch (error) {
          console.error("Failed to load user profile:", error);

          setUser(buildUser(firebaseUser));
        } finally {
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  const login = async ({ email, password }) => {
    const credential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    const firebaseUser = credential.user;

    let profile = null;

    try {
      profile = await fetchUserProfile(firebaseUser);

      if (!profile) {
        profile = await syncUserProfile(firebaseUser);
      }
    } catch (error) {
      console.error("Profile sync error:", error);
      throw error;
    }

    const loggedUser = buildUser(firebaseUser, profile);

    setUser(loggedUser);

    return loggedUser;
  };

  const signup = async ({
    name,
    email,
    password,
    department,
  }) => {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    const firebaseUser = credential.user;

    await updateProfile(firebaseUser, {
      displayName: name.trim(),
    });

    const profile = await syncUserProfile(firebaseUser, {
      department,
    });

    const newUser = buildUser(firebaseUser, profile);

    setUser(newUser);

    return newUser;
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();

    const credential = await signInWithPopup(auth, provider);

    const firebaseUser = credential.user;

    let profile = await fetchUserProfile(firebaseUser);

    if (!profile) {
      profile = await syncUserProfile(firebaseUser);
    }

    const loggedUser = buildUser(firebaseUser, profile);

    setUser(loggedUser);

    return loggedUser;
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateStatus = (status) => {
    setUser((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        status,
      };
    });
  };

  const isAuthenticated = Boolean(user);

  if (loading) {
    return null;
  }

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