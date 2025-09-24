import { UserNav } from "@/components/userNav";
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="p-8 flex flex-col gap-9">
      <UserNav />
      {children}
    </main>
  );
};
