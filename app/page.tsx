// app/page.tsx
import { FileUpload } from '@/components/file-upload';

export default function Home() {
  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">FastCTX</h1>
      <FileUpload />
    </main>
  );
}
