// app/page.tsx
import Image from 'next/image';
import fastctxLogo from '@/lib/assets/fastctx_logo.png';
import { Footer } from '@/components/Footer';
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className='flex flex-col h-screen'>
      <section className="flex flex-col w-full h-full items-center justify-center p-4 gap-4">
        <Image
          src={fastctxLogo}
          alt="FastCTX Logo"
          width={32}
          height={32}
        />
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-bold text-5xl">FastCTX</h1>
          <h2 className='text-xl'><b>locally hosted</b> AI document inference</h2>
        </div>
        <Button variant="outline" className='hover:cursor-pointer'> Sign Up</Button>
      </section>
      <Footer />
    </div>
  );
}
