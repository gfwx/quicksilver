"use client";

// study this

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Profile {
  id: string;
  profileName: string;
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
  setCurrentProfile: (profile: Profile | null) => Promise<void>;
  setProfiles: (profiles: Profile[]) => void;
  addProfile: (profile: Profile) => void;
  updateProfile: (id: string, updates: Partial<Profile>) => void;
  removeProfile: (id: string) => void;
  setLoading: (loading: boolean) => void;
  loadProfiles: () => Promise<void>;
  switchProfile: (profileId: string) => Promise<void>;
  createProfile: (data: {
    profileName: string;
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

      setCurrentProfile: async (profile) => {
        console.log(`Set current profile to: ${profile?.profileName}`);
        set({ currentProfile: profile });
        // Client-side fetch uses relative URL
        if (profile) {
          const response = await fetch("/api/set-user-cookie", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: profile.id }),
          });

          if (response.ok) {
            console.log("Current profile successfuly set");
            // Also set the cookie client-side as a fallback
            // This ensures immediate availability for subsequent requests
            const maxAge = 60 * 60 * 24 * 365 * 20;
            document.cookie = `x-current-user-id=${profile.id}; path=/; max-age=${maxAge}; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error(
              "[useProfile] Failed to set current profile. Status:",
              response.status,
              errorData,
            );
          }
        } else {
          const response = await fetch("/api/set-user-cookie", {
            method: "DELETE",
          });

          if (response.ok) {
            console.log("Current profile successfuly unset (set to null)");
            // Clear cookie client-side as well
            document.cookie =
              "x-current-user-id=; path=/; max-age=0; SameSite=Lax";
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error(
              "[useProfile] Failed to unset current profile. Status:",
              response.status,
              errorData,
            );
          }
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
        // Client-side fetch uses relative URL
        try {
          const response = await fetch("/api/user", {
            method: "GET",
            credentials: "include",
          });

          if (response.ok) {
            const data = await response.json();
            set({ profiles: data.users || [] });

            const cookieMatch = document.cookie.match(
              /x-current-user-id=([^;]+)/,
            );
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
          console.error("[useProfile] Failed to load profiles:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      switchProfile: async (profileId) => {
        const profile = get().profiles.find((p) => p.id === profileId);
        // Client-side fetch uses relative URL
        if (profile) {
          await get().setCurrentProfile(profile);
          await fetch("/api/user", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: profileId,
              lastOpened: new Date().toISOString(),
            }),
          }).catch((error) => {
            console.error(
              "[useProfile] Error updating profile lastOpened:",
              error,
            );
          });
        }
      },

      createProfile: async (data) => {
        set({ isLoading: true });
        // Client-side fetch uses relative URL
        try {
          const response = await fetch("/api/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(
              "[useProfile] Failed to create profile. Status:",
              response.status,
              errorData,
            );
            throw new Error("Failed to create profile");
          }

          const newProfile = await response.json();
          get().addProfile(newProfile);
          return newProfile;
        } catch (error) {
          console.error("[useProfile] Error creating profile:", error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteProfile: async (profileId) => {
        set({ isLoading: true });
        // Client-side fetch uses relative URL
        try {
          const response = await fetch("/api/user", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: profileId }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(
              "[useProfile] Failed to delete profile. Status:",
              response.status,
              errorData,
            );
            throw new Error("Failed to delete profile");
          }

          get().removeProfile(profileId);
        } catch (error) {
          console.error("[useProfile] Error deleting profile:", error);
          throw error;
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
