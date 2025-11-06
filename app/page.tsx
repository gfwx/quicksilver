"use client";
// app/page.tsx
import Image from "next/image";
// import { Footer } from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import logoMark from "@/public/logomark.svg";
import wordMark from "@/public/wordmark.svg";
import Link from "next/link";

export default function Home() {
  const { authState, login, logout } = useAuth();
  return (
    <div className="flex flex-col h-screen">
      <section className="flex flex-col w-full h-full items-center justify-center p-4 gap-9">
        <Image src={logoMark} alt="Quicksilver Logomark" />
        <div className="flex flex-col gap-4 items-center">
          <Image src={wordMark} alt="Quicksilver Wordmark" />
          <p className="text-foreground text-lg font-serif tracking-tight">
            <b>Self-Hosted</b> AI Document Inference
          </p>
        </div>

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
                <Button
                  variant="default"
                  className="hover:cursor-pointer"
                  onClick={() => (window.location.href = "/projects")}
                >
                  Go to Dashboard
                </Button>
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
                Sign Up
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
      {/*<Footer />*/}
    </div>
  );
}
