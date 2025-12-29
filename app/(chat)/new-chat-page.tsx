'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Chat } from '@/components/chat';
import { generateUUID } from '@/lib/utils';
import { useSession } from '@/contexts/SessionContext';

export default function NewChatPage() {
  const { session } = useSession();
  const [id, setId] = useState(() => generateUUID());
  const [modelId, setModelId] = useState('chat-model');
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setId(generateUUID());
  }, [pathname, searchParams?.toString()]);

  useEffect(() => {
    const savedModel = typeof window !== 'undefined' ? localStorage.getItem('chat-model') : null;
    if (savedModel) {
      setModelId(savedModel);
    }
  }, []);

  if (!session?.user) {
    return null;
  }

  return (
    <Chat
      key={id}
      id={id}
      initialMessages={[]}
      initialChatModel={modelId}
      initialVisibilityType="private"
      isReadonly={false}
      session={session}
    />
  );
}
