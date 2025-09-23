"use client"

import React from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import Image from 'next/image';

interface AuthStatusProps {
  showDetails?: boolean;
  className?: string;
}

/**
 * AuthStatus component that displays the current authentication state
 * Useful for debugging or showing user info in the UI
 */
export const AuthStatus = ({ showDetails = false, className = "" }: AuthStatusProps) => {
  const { authState, login, logout } = useAuth();

  if (authState.isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Checking auth...</span>
      </div>
    );
  }

  if (authState.isAuthenticated && authState.user) {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        <div className="flex items-center space-x-2">
          {authState.user.profilePictureUrl && (
            <Image
              src={authState.user.profilePictureUrl}
              alt="Profile"
              className="w-8 h-8 rounded-full"
            />
          )}
          <div>
            <p className="text-sm font-medium">
              {authState.user.firstName && authState.user.lastName
                ? `${authState.user.firstName} ${authState.user.lastName}`
                : authState.user.email}
            </p>
            {showDetails && (
              <p className="text-xs text-gray-500">{authState.user.email}</p>
            )}
          </div>
        </div>
        <button
          onClick={logout}
          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-gray-600">Not authenticated</span>
      <button
        onClick={login}
        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
      >
        Login
      </button>
    </div>
  );
};
