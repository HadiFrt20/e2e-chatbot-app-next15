import type { NextRequest } from 'next/server';
import { checkChatAccess, ChatSDKError } from '@chat-template/core';
import {
  chatErrorResponse,
  getSessionFromRequest,
  requireSession,
} from '@/server/api-helpers';
import { nodeReadableToWeb, sseHeaders, streamCache } from '@/server/streaming';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: chatId } = await params;
  const cursorHeader = request.headers.get('x-resume-stream-cursor');
  const cursor = cursorHeader ? Number.parseInt(cursorHeader, 10) : undefined;

  const session = await getSessionFromRequest(request);
  const authError = requireSession(session);
  if (authError) {
    return chatErrorResponse(authError);
  }

  const streamId = streamCache.getActiveStreamId(chatId);
  if (!streamId) {
    return chatErrorResponse(new ChatSDKError('empty:stream'));
  }

  const { allowed, reason } = await checkChatAccess(
    chatId,
    session?.user.id,
  );

  if (reason !== 'not_found' && !allowed) {
    return chatErrorResponse(new ChatSDKError('forbidden:chat', reason));
  }

  const stream = streamCache.getStream(streamId, { cursor });

  if (!stream) {
    return chatErrorResponse(new ChatSDKError('empty:stream'));
  }

  return new Response(nodeReadableToWeb(stream), {
    headers: sseHeaders,
  });
}
