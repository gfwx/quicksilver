"use client";

import logoMark from "@/public/logomark.svg";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "./ui/context-menu";
import { useProfile } from "@/lib/hooks/useProfile";

export const UserNav = () => {
  const { currentProfile } = useProfile();

  const handleClick = () => {
    console.log("to implement...");
  };

  if (!currentProfile) return null;
  return (
    <div className="flex justify-between w-full">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="flex gap-4 w-fit items-center cursor-context-menu">
            <Avatar>
              <AvatarImage height={32} width={32} />
              <AvatarFallback>
                {currentProfile.profileName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p>
                Active Profile:
                <span className="text-md font-bold">
                  {currentProfile.profileName}
                </span>
              </p>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem variant="destructive" onClick={handleClick}>
            Switch Account
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <Link href="/">
        <Image
          width={32}
          height={32}
          src={logoMark}
          alt="Quicksilver Logomark"
        />
      </Link>
    </div>
  );
};
