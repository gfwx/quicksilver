import Image from "next/image";
import logoMark from "@/public/logomark.svg";

export default function StatusHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string | undefined;
}) {
  return (
    <div className="w-full flex items-center justify-between px-9 py-4">
      <div className="flex gap-2">
        <p className="font-bold font-sans text-foreground">{title}</p>
        <p className="font-bold font-sans text-foreground opacity-40">
          {subtitle}
        </p>
      </div>

      <Image width={32} height={32} src={logoMark} alt="Quicksilver Logo" />
    </div>
  );
}
