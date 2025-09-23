import StatusHeader from "./components/statusHeader";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-col h-screen">
      <StatusHeader title={"Onboarding"} subtitle={"Environment Setup"} />
      {children}
    </main>
  );
}
