import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

import { auth } from "../config/firebase";


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || "",
          email: firebaseUser.email || "",
          role: "Team Member",
          status: "online",
          avatarUrl: firebaseUser.photoURL || "",
        });
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async ({ email, password }) => {
    const credential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    const firebaseUser = credential.user;

    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || "",
      email: firebaseUser.email || "",
      role: "Team Member",
      status: "online",
      avatarUrl: firebaseUser.photoURL || "",
    };
  };

  const signup = async ({ name, email, password }) => {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    await updateProfile(credential.user, {
      displayName: name.trim(),
    });

    return {
      id: credential.user.uid,
      name: name.trim(),
      email: credential.user.email || "",
      role: "Team Member",
      status: "online",
      avatarUrl: "",
    };
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateStatus = (status) => {
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, status };
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