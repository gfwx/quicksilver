"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string | null;
  profileDescription?: string | null;
  createdAt: string;
  updatedAt: string;
  lastOpened?: string | null;
}

interface ProfileState {
  currentProfile: Profile | null;
  profiles: Profile[];
  isLoading: boolean;
  setCurrentProfile: (profile: Profile | null) => void;
  setProfiles: (profiles: Profile[]) => void;
  addProfile: (profile: Profile) => void;
  updateProfile: (id: string, updates: Partial<Profile>) => void;
  removeProfile: (id: string) => void;
  setLoading: (loading: boolean) => void;
  loadProfiles: () => Promise<void>;
  switchProfile: (profileId: string) => Promise<void>;
  createProfile: (data: {
    firstName: string;
    lastName: string;
    profileDescription?: string;
  }) => Promise<Profile>;
  deleteProfile: (profileId: string) => Promise<void>;
}

export const useProfile = create<ProfileState>()(
  persist(
    (set, get) => ({
      currentProfile: null,
      profiles: [],
      isLoading: false,

      setCurrentProfile: (profile) => {
        set({ currentProfile: profile });
        if (profile) {
          document.cookie = `x-user-data=${profile.id}; path=/; max-age=${60 * 60 * 24 * 30}`;
        } else {
          document.cookie = "x-user-data=; path=/; max-age=0";
        }
      },

      setProfiles: (profiles) => set({ profiles }),

      addProfile: (profile) =>
        set((state) => ({ profiles: [...state.profiles, profile] })),

      updateProfile: (id, updates) =>
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
          ),
          currentProfile:
            state.currentProfile?.id === id
              ? { ...state.currentProfile, ...updates }
              : state.currentProfile,
        })),

      removeProfile: (id) =>
        set((state) => ({
          profiles: state.profiles.filter((p) => p.id !== id),
          currentProfile:
            state.currentProfile?.id === id ? null : state.currentProfile,
        })),

      setLoading: (loading) => set({ isLoading: loading }),

      loadProfiles: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch("/api/user", {
            method: "GET",
            credentials: "include",
          });

          if (response.ok) {
            const data = await response.json();
            set({ profiles: data.users || [] });

            const cookieMatch = document.cookie.match(/x-user-data=([^;]+)/);
            const profileIdFromCookie = cookieMatch ? cookieMatch[1] : null;

            if (profileIdFromCookie) {
              const profile = data.users.find(
                (p: Profile) => p.id === profileIdFromCookie,
              );
              if (profile) {
                set({ currentProfile: profile });
              }
            }
          }
        } catch (error) {
          console.error("Failed to load profiles:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      switchProfile: async (profileId) => {
        const profile = get().profiles.find((p) => p.id === profileId);
        if (profile) {
          get().setCurrentProfile(profile);

          await fetch("/api/user", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: profileId,
              lastOpened: new Date().toISOString(),
            }),
          }).catch(console.error);
        }
      },

      createProfile: async (data) => {
        set({ isLoading: true });
        try {
          const response = await fetch("/api/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            throw new Error("Failed to create profile");
          }

          const newProfile = await response.json();
          get().addProfile(newProfile);
          return newProfile;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteProfile: async (profileId) => {
        set({ isLoading: true });
        try {
          const response = await fetch("/api/user", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: profileId }),
          });

          if (!response.ok) {
            throw new Error("Failed to delete profile");
          }

          get().removeProfile(profileId);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "profile-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentProfile: state.currentProfile,
      }),
    },
  ),
);
