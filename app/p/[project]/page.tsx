"use client";

import Logomark from "@/public/logomark.svg";
import Wordmark from "@/public/wordmark.svg";
import Image from "next/image";

export default function Chat() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-9 pb-50">
      <div className="flex flex-col items-center justify-center gap-4">
        <Image src={Logomark} alt="Logo" width={200} height={200} />
        <Image src={Wordmark} alt="Wordmark" width={400} height={100} />
      </div>
    </main>
  );
}
