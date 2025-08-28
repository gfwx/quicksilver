"use client"
// app/page.tsx
import Image from 'next/image';
import fastctxLogo from '@/lib/assets/fastctx_logo.png';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Home() {
  const { authState, login, logout } = useAuth();

  return (
    <div className='flex flex-col h-screen'>
      <section className="flex flex-col w-full h-full items-center justify-center p-4 gap-4">
        <Image
          src={fastctxLogo}
          alt="FastCTX Logo"
          width={32}
          height={32}
        />
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-bold text-5xl">FastCTX</h1>
          <h2 className='text-xl'><b>locally hosted</b> AI document inference</h2>

          {authState.isLoading ? (
            <Button variant="outline" disabled>
              Loading...
            </Button>
          ) : authState.isAuthenticated ? (
            <div className="flex flex-col items-center gap-3">
              <div className="text-center">
                <p className="text-lg">Welcome back, {authState.user?.firstName || authState.user?.email}!</p>
                <p className="text-sm text-gray-600">You are signed in</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Go to Dashboard
                </Button>
                <Button variant="outline" onClick={logout}>
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
