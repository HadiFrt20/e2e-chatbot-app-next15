import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { Chat } from '@/components/chat';
import { convertToUIMessages } from '@/lib/utils';
import { getMessagesByChatId, getChatById, isDatabaseAvailable } from '@chat-template/db';
import { getAuthSession } from '@chat-template/auth';

export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: chatId } = await params;
  const headerStore = await headers();
  const session =
    (await getAuthSession({
      getRequestHeader: (name: string) => headerStore.get(name),
    })) ?? null;

  if (!session?.user) {
    notFound();
  }

  const dbAvailable = isDatabaseAvailable();
  const chat = dbAvailable ? await getChatById({ id: chatId }) : null;

  if (dbAvailable && !chat) {
    notFound();
  }

  const messages =
    dbAvailable && chat
      ? convertToUIMessages(await getMessagesByChatId({ id: chatId }))
      : [];

  return (
    <Chat
      key={chatId}
      id={chatId}
      initialMessages={messages}
      initialChatModel="chat-model"
      initialVisibilityType={chat?.visibility ?? 'private'}
      isReadonly={false}
      session={{ user: session.user }}
      initialLastContext={chat?.lastContext ?? undefined}
    />
  );
}
