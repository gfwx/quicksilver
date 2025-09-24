"use client"
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * This is the heart of the client side authentication system.
 * Deals with everything UI-state
 */

// Standard interface for storing users as global state
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
}

// Interface for authentication - combines authenticated user and UI state
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Final authentication state Interface which contains
// 1. Current authentication state of the user
// 2. Helper functions
interface AuthContextType {
  authState: AuthState;
  login: () => void;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * useAuth context function - returns context iff called from within the AuthContext provider.
 *
 * @returns AuthContextType
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


/**
 *
 * @param children - Content to expose useAuth to
 * @returns
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {

  const serverUrl = process.env.NEXT_PUBLIC_EXPRESS_SERVER_PATH || "http://localhost:3001";
  // 1. Set initial state
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // 2. Check for the current authenticated user
  const checkAuthStatus = useCallback(async () => {
    console.log("Auth Status checking in progress..")
    try {
      console.log("Fetching user data from API...")

      // the /user/me endpoint uses the server-side authentication middleware to
      // get the user data (if it exists) from the session cookie and refresh it if needed
      const response = await fetch(`${serverUrl}/api/user/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("Received user data from API!")
        setAuthState({
          user: userData.user,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {      // reaches this stage if the session cookie is expired or doesn't exist.
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {       // reaches this state if there is some indeterminate
      console.error('Auth check failed:', error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, [serverUrl]);

  // 3. Run auth check once when the provider mounts
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = useCallback(() => {       // Memoized login callback function
    window.location.href = `${serverUrl}/api/auth/login`;
  }, [serverUrl]);

  const logout = useCallback(async () => {

    try {       // Mainly done to update the app auth state
      setAuthState(prev => ({ ...prev, isLoading: true }));     // Changes global loading auth state — can be used to acivate loading components
      window.location.href = `${serverUrl}/api/auth/logout`;

    } catch (error) {
      console.error('Logout failed:', error);     // reaches this state if there is some indeterminate error
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, [serverUrl]);

  // 4. Expose refetch function for manual auth state refresh
  const refetchUser = useCallback(async () => {
    await checkAuthStatus();
  }, [checkAuthStatus]);

  // 5. After all the callbacks, return the final authentication state object.
  const contextValue: AuthContextType = {
    authState,
    login,
    logout,
    refetchUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
