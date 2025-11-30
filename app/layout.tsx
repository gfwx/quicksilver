import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/components/theme-provider";

export const metadata: Metadata = {
  title: "Quicksilver",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <head>
        <link rel="icon" href="/logomark.svg" />
      </head>
      <html lang="en" suppressHydrationWarning className="bg-background">
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </>
  );
}
