// components/Footer.tsx
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="p-9 w-full">
      <div className="flex justify-end">
        <Link
          href="https://github.com/gfwx/Quicksilver"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          gfwx/Quicksilver
        </Link>
      </div>
    </footer>
  );
}
