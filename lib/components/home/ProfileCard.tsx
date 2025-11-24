"use client";

import { Button } from "@/lib/components/ui/button";
import { Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/lib/components/ui/avatar";

interface Profile {
  id: string;
  profileName: string;
  profilePictureUrl?: string | null;
  profileDescription?: string | null;
  lastOpened?: string | null;
}

interface ProfileCardProps {
  profile: Profile;
  isActive: boolean;
  onSelectAction: () => void;
  onDeleteAction: () => void;
}

export default function ProfileCard({
  profile,
  isActive,
  onSelectAction,
  onDeleteAction,
}: ProfileCardProps) {
  const initials = `${profile.profileName[0]}`.toUpperCase();

  return (
    <div
      className={`p-4 border rounded-lg transition-all hover:shadow-md ${
        isActive ? "border-primary bg-primary/5" : "border-border"
      }`}
    >
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg">{profile.profileName}</h3>
          {profile.profileDescription && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {profile.profileDescription}
            </p>
          )}
          {profile.lastOpened && (
            <p className="text-xs text-muted-foreground mt-2">
              Last opened: {new Date(profile.lastOpened).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {!isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectAction}
              className="hover:cursor-pointer"
            >
              Select
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onDeleteAction}
            className="hover:cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
            disabled={isActive}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
