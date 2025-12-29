import { headers } from 'next/headers';
import { ChatLayoutClient } from './chat-layout-client';
import { getAuthSession } from '@chat-template/auth';
import { getChatsByUserId, isDatabaseAvailable } from '@chat-template/db';

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const session =
    (await getAuthSession({
      getRequestHeader: (name: string) => headerStore.get(name),
    })) ?? null;

  let initialHistory = undefined;
  const dbAvailable = isDatabaseAvailable();
  if (session?.user && dbAvailable) {
    const chats = await getChatsByUserId({
      id: session.user.id,
      limit: 20,
      startingAfter: null,
      endingBefore: null,
    });
    initialHistory = chats;
  }

  return (
    <ChatLayoutClient initialHistory={initialHistory}>{children}</ChatLayoutClient>
  );
}
