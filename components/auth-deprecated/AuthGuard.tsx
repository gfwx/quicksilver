"use client"

import React from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Client-side route protection
 */

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

/**
 * AuthGuard component that protects routes based on authentication status
 *
 * @param children - Content to render when authentication requirements are met
 * @param fallback - Optional custom loading component
 * @param redirectTo - Optional redirect path for unauthenticated users (defaults to '/')
 * @param requireAuth - Whether authentication is required (defaults to true)
 */
export const AuthGuard = ({ children, fallback, redirectTo = '/', requireAuth = true }: AuthGuardProps) => {
  const { authState } = useAuth();
  const router = useRouter();

  useEffect(() => {       // Only redirect when loading is complete and auth requirement isn't met
    if (!authState.isLoading && requireAuth && !authState.isAuthenticated) {
      router.push(redirectTo);
    }
  }, [authState.isLoading, authState.isAuthenticated, requireAuth, redirectTo, router]);

  // Show loading state
  if (authState.isLoading) {
    return fallback || <AuthLoadingSpinner />;
  }

  // Show children if auth requirements are met
  if (requireAuth && authState.isAuthenticated) {
    return <>{children}</>;
  }

  // Show children if no auth is required
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Don't render anything while redirecting
  return fallback;
};

/**
 * Default loading spinner component
 */
const AuthLoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="text-sm text-gray-600">Loading...</p>
    </div>
  </div>
);
