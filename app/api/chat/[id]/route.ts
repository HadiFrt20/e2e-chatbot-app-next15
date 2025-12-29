import type { NextRequest } from 'next/server';
import { checkChatAccess, ChatSDKError } from '@chat-template/core';
import { deleteChatById } from '@chat-template/db';
import {
  chatErrorResponse,
  getSessionFromRequest,
  requireSession,
} from '@/server/api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: chatId } = await params;
  const session = await getSessionFromRequest(request);
  const authError = requireSession(session);
  if (authError) {
    return chatErrorResponse(authError);
  }

  const { chat, allowed, reason } = await checkChatAccess(
    chatId,
    session?.user.id,
  );

  if (!chat || !allowed) {
    const error =
      reason === 'not_found'
        ? new ChatSDKError('not_found:chat')
        : new ChatSDKError('forbidden:chat', reason);
    return chatErrorResponse(error);
  }

  return Response.json(chat);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: chatId } = await params;
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
    return chatErrorResponse(new ChatSDKError('forbidden:chat', reason));
  }

  const deletedChat = await deleteChatById({ id: chatId });
  return Response.json(deletedChat);
}
