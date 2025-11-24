"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import logoMark from "@/public/logomark.svg";
import logoMarkDark from "@/public/logomark_dark.svg";
import wordMark from "@/public/wordmark.svg";
import wordMarkDark from "@/public/wordmark_dark.svg";

export default function Header() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col gap-4 items-center">
        <Image src={logoMark} alt="Quicksilver Logomark" />
        <Image src={wordMark} alt="Quicksilver Wordmark" />
        <p className="text-foreground text-lg font-serif tracking-tight">
          <b>Self-Hosted</b> AI Document Inference
        </p>
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div className="flex flex-col gap-4 items-center">
      <Image
        src={isDark ? logoMarkDark : logoMark}
        alt="Quicksilver Logomark"
      />
      <Image
        src={isDark ? wordMarkDark : wordMark}
        alt="Quicksilver Wordmark"
      />
      <p className="text-foreground text-lg font-sans tracking-tight">
        <b>Self-Hosted</b> AI Document Inference
      </p>
    </div>
  );
}
