"use client"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/hooks/useAuth"

export default function Dashboard() {
  const { logout } = useAuth();

  return (
    <>
      <h1 className="text-2xl">Welcome to FastCTX</h1>
      <Button className="hover:cursor-pointer" variant="destructive" onClick={logout}>Log Out</Button>
    </>
  );
}
