import type { NextRequest } from 'next/server';
import { checkChatAccess, ChatSDKError } from '@chat-template/core';
import {
  getMessagesByChatId,
  isDatabaseAvailable,
} from '@chat-template/db';
import {
  chatErrorResponse,
  getSessionFromRequest,
  requireSession,
} from '@/server/api-helpers';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: chatId } = await params;
  if (!chatId) {
    const error = new ChatSDKError('bad_request:api');
    return chatErrorResponse(error);
  }

  const session = await getSessionFromRequest(request);
  const authError = requireSession(session);
  if (authError) {
    return chatErrorResponse(authError);
  }

  const { allowed, reason } = await checkChatAccess(
    chatId,
    session?.user.id,
  );

  if (!allowed) {
    const error = new ChatSDKError('forbidden:chat', reason);
    return chatErrorResponse(error);
  }

  try {
    const messages = await getMessagesByChatId({ id: chatId });

    if (!messages && !isDatabaseAvailable()) {
      return new Response(null, { status: 404 });
    }

    return Response.json(messages);
  } catch (error) {
    console.error('Error getting messages by chat ID:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get messages' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
