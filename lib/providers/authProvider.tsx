"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

interface AuthContext {
  id: string | undefined;
}

const AuthContext = createContext<AuthContext | null>(null);

export const AuthProvider = ({
  children,
  user,
}: {
  children: React.ReactNode;
  user: AuthContext;
}) => {
  if (!user || !user.id) {
    throw new Error("User ID not defined!");
  }

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider!");
  }
  return ctx;
};
