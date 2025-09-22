"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/hooks/useAuth"
import { UserNav } from "@/components/dashboard/UserNav";

export default function Dashboard() {
  const { logout, authState } = useAuth();

  return (
    <section className="m-8 flex flex-col gap-12">
      <div className="flex flex-col gap-8 w-fit">
        <h1 className="text-2xl">Welcome to Quicksilver</h1>
        <UserNav user={authState.user ?? null} />
        <Button className="hover:cursor-pointer" variant="destructive" onClick={logout}>Log Out</Button>
      </div>

      <div className='w-fit'>

      </div>
    </section>
  );
}
