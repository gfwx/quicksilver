"use client";

import { useEffect } from "react";
import { useProfile } from "@/lib/hooks/useProfile";
import ProfileCard from "./ProfileCard";
import CreateProfileDialog from "./CreateProfileDialog";
import { Loader2 } from "lucide-react";

export default function ProfileSelector() {
  const {
    profiles,
    currentProfile,
    isLoading,
    loadProfiles,
    switchProfile,
    deleteProfile,
  } = useProfile();

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleSelectProfile = async (profileId: string) => {
    await switchProfile(profileId);
    // Force a full page reload instead of client-side navigation
    // This ensures the cookie is set before the server renders the page
    window.location.href = "/projects";
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this profile? This action cannot be undone and all associated data will be lost.",
      )
    ) {
      await deleteProfile(profileId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Select a Profile</h2>
        <CreateProfileDialog />
      </div>

      {profiles.length === 0 ? (
        <div className="text-center p-8 border rounded-lg border-dashed">
          <p className="text-muted-foreground mb-4">
            No profiles found. Create your first profile to get started.
          </p>
          <CreateProfileDialog />
        </div>
      ) : (
        <div className="grid gap-4">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              isActive={currentProfile?.id === profile.id}
              onSelectAction={() => handleSelectProfile(profile.id)}
              onDeleteAction={() => handleDeleteProfile(profile.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
