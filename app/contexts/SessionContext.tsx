import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ClientSession } from '@chat-template/auth';

interface SessionContextType {
  session: ClientSession | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: ClientSession | null;
}) {
  const [session, setSession] = useState<ClientSession | null>(initialSession);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      // Optional manual refetch; not run by default
      const response = await fetch('/api/session', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }
      const data = (await response.json()) as ClientSession;
      setSession(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setSession(null);
    }
  }, []);

  return (
    <SessionContext.Provider
      value={{ session, loading, error, refetch: fetchSession }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
