"use client"

import logoMark from "@/public/logomark.svg"
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem
} from "./ui/context-menu";

export const UserNav = () => {
  const { authState, logout } = useAuth();
  const { user } = authState
  if (!user) return null;
  return (
    <div className="flex justify-between w-full">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="flex gap-4 w-fit items-center cursor-context-menu">
            <Avatar>
              <AvatarImage src={user?.profilePictureUrl} />
              <AvatarFallback>{user?.firstName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-md font-bold">{user?.firstName}</p>
              <p className="text-sm">{user?.email}</p>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            variant="destructive"
            onClick={logout}
          >
            Log Out
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <Image width={32} height={32} src={logoMark} alt="Quicksilver Logomark" />
    </div>
  );
}
