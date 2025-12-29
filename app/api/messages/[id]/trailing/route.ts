import type { NextRequest } from 'next/server';
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  isDatabaseAvailable,
} from '@chat-template/db';
import { ChatSDKError, checkChatAccess } from '@chat-template/core';
import {
  chatErrorResponse,
  getSessionFromRequest,
  requireSession,
} from '@/server/api-helpers';

export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: messageId } = await params;
  const dbAvailable = isDatabaseAvailable();
  if (!dbAvailable) {
    return new Response(null, { status: 204 });
  }

  const session = await getSessionFromRequest(request);
  const authError = requireSession(session);
  if (authError) {
    return chatErrorResponse(authError);
  }

  try {
    const [message] = await getMessageById({ id: messageId });

    if (!message) {
      const messageError = new ChatSDKError('not_found:message');
      return chatErrorResponse(messageError);
    }

    const { allowed, reason } = await checkChatAccess(
      message.chatId,
      session?.user.id,
    );

    if (!allowed) {
      const chatError = new ChatSDKError('forbidden:chat', reason);
      return chatErrorResponse(chatError);
    }

    await deleteMessagesByChatIdAfterTimestamp({
      chatId: message.chatId,
      timestamp: message.createdAt,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting trailing messages:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete messages' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
