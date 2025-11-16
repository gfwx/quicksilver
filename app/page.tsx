"use client";
// app/page.tsx
import { Header } from "@/lib/components/home";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import Link from "next/link";

export default function Home() {
  const { authState, login, logout } = useAuth();
  return (
    <div className="flex flex-col h-screen">
      <section className="flex flex-col w-full h-full items-center justify-center p-4 gap-9">
        <Header />
        <div className="flex gap-4">
          {authState.isLoading ? (
            <Button variant="default" disabled>
              Loading...
            </Button>
          ) : authState.isAuthenticated ? (
            <div className="flex flex-col items-center gap-3">
              <div className="text-center">
                <p className="text-lg">
                  Welcome back,{" "}
                  {authState.user?.firstName || authState.user?.email}!
                </p>
              </div>
              <div className="flex gap-4">
                <Link href="/projects">
                  <Button variant="default" className="hover:cursor-pointer">
                    Go to Dashboard
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  onClick={logout}
                  className="hover:cursor-pointer"
                >
                  Sign Out
                </Button>

                <Link href="/onboarding">
                  <Button variant="link" className="hover:cursor-pointer">
                    Onboarding (Debug)
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="default"
                className="hover:cursor-pointer"
                onClick={login}
              >
                Sign Ip
              </Button>
              <Link href="/onboarding">
                <Button variant="secondary" className="hover:cursor-pointer">
                  Onboarding (Debug)
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
