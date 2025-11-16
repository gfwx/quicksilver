import Image from "next/image";
import logoMark from "@/public/logomark.svg";
import wordMark from "@/public/wordmark.svg";

export default function Header() {
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
