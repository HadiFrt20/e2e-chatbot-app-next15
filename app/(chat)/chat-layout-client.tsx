'use client';

import { useEffect, useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useSession } from '@/contexts/SessionContext';
import type { ChatHistory } from '@/components/sidebar-history';

export function ChatLayoutClient({
  children,
  initialHistory,
}: {
  children: React.ReactNode;
  initialHistory?: ChatHistory;
}) {
  const { session } = useSession();
  const [defaultOpen, setDefaultOpen] = useState(true);
  const [sidebarKey, setSidebarKey] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('sidebar:state');
    if (stored !== null) {
      setDefaultOpen(stored === 'true');
      setSidebarKey((key) => key + 1);
    }
  }, []);

  if (!session?.user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 font-bold text-2xl">Authentication Required</h1>
          <p className="text-muted-foreground">
            Please authenticate using Databricks to access this application.
          </p>
        </div>
      </div>
    );
  }

  const preferredUsername = session.user.preferredUsername ?? null;

  return (
    <SidebarProvider defaultOpen={defaultOpen} key={sidebarKey}>
      <AppSidebar
        user={session.user}
        preferredUsername={preferredUsername}
        initialHistory={initialHistory}
      />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
