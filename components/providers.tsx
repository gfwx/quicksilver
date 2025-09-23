// components/providers.tsx
'use client';

import { SWRConfig } from 'swr';
import { AuthProvider } from '@/lib/contexts/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SWRConfig
        value={{
          fetcher: (resource, init) =>
            fetch(resource, init).then((res) => res.json()),
        }}
      >
        {children}
      </SWRConfig>
    </AuthProvider>
  );
}
