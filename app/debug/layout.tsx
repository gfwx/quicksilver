export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="layout">
      <header className="header">
        <h1 className="title">Debug</h1>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}
