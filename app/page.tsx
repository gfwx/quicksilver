"use client";

import { Header, ProfileSelector } from "@/lib/components/home";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/lib/hooks/useProfile";
import Link from "next/link";

export default function Home() {
  const { currentProfile } = useProfile();

  return (
    <div className="flex flex-col h-screen">
      <section className="flex flex-col w-full h-full items-center justify-center p-4 gap-9">
        <Header />

        <div className="flex flex-col items-center gap-6 w-full">
          {currentProfile && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Active Profile: {currentProfile.profileName}{" "}
              </p>
            </div>
          )}

          <ProfileSelector />

          <div className="flex gap-4 mt-4">
            {currentProfile && (
              <Link href="/projects">
                <Button variant="default" className="hover:cursor-pointer">
                  Go to Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
