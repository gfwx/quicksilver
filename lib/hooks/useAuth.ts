"use client"

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface UseAuthReturn {
  login: () => void;
  logout: () => void;
  authState: AuthState;
}

export const useAuth = (): UseAuthReturn => {
  // Single state object to reduce rerenders
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const router = useRouter();
  const serverUrl = process.env.NEXT_PUBLIC_EXPRESS_SERVER_PATH || "http://localhost:3001";

  useEffect(() => {
    checkAuthStatus();
  }, []); // Empty dependency array - only run once

  const checkAuthStatus = useCallback(async () => {
    console.log("Auth Status checking in progress..")
    try {
      // Try to get user data from a protected endpoint
      console.log("Fetching user data from API...")
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
        // Single state update with user data
        setAuthState({
          user: userData.user,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        // Single state update for failed auth
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Single state update for error
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, [serverUrl]);

  const login = useCallback(() => {
    window.location.href = `${serverUrl}/api/auth/login`;
  }, [serverUrl]);

  const logout = useCallback(async () => {
    try {
      // Set loading state
      setAuthState(prev => ({ ...prev, isLoading: true }));

      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });

      window.location.href = `${serverUrl}/api/auth/logout`;
      // Redirect to home page
      router.push('/');

    } catch (error) {
      console.error('Logout failed:', error);
      // Reset loading on error
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, [serverUrl, router]);

  return {
    authState,
    login,
    logout,
  };
};
