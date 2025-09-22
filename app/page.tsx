"use client"
// app/page.tsx
import Image from 'next/image';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import logoMark from "@/public/logomark.svg"
import wordMark from "@/public/wordmark.svg"

export default function Home() {
  const { authState, login, logout } = useAuth();
  return (
    <div className='flex flex-col h-screen'>
      <section className="flex flex-col w-full h-full items-center justify-center p-4 gap-4">
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-10">
            <Image src={logoMark} alt="Quicksilver Logomark" />
            <Image src={wordMark} alt="Quicksilver Wordmark" />
          </div>

          {authState.isLoading ? (
            <Button variant="outline" disabled>
              Loading...
            </Button>
          ) : authState.isAuthenticated ? (
            <div className="flex flex-col items-center gap-3">
              <div className="text-center">
                <p className="text-lg">Welcome back, {authState.user?.firstName || authState.user?.email}!</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  className="hover:cursor-pointer"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Go to Dashboard
                </Button>
                <Button variant="outline" onClick={logout}
                  className="hover:cursor-pointer">
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={login}>
              Sign Up
            </Button>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
