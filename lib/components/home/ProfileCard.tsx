"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  onSelect: () => void;
  onDelete: () => void;
}

export default function ProfileCard({
  profile,
  isActive,
  onSelect,
  onDelete,
}: ProfileCardProps) {
  const initials = `${profile.profileName}`.toUpperCase();

  return (
    <div
      className={`p-4 border rounded-lg transition-all hover:shadow-md ${
        isActive ? "border-primary bg-primary/5" : "border-border"
      }`}
    >
      <div className="flex items-start gap-4">
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
              onClick={onSelect}
              className="hover:cursor-pointer"
            >
              Select
            </Button>
          )}
          {isActive && (
            <span className="text-xs bg-primary text-primary-foreground px-2 rounded">
              Active
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
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
