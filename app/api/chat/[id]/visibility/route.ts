import type { NextRequest } from 'next/server';
import { checkChatAccess, ChatSDKError } from '@chat-template/core';
import { updateChatVisiblityById } from '@chat-template/db';
import {
  chatErrorResponse,
  getSessionFromRequest,
  requireSession,
} from '@/server/api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: chatId } = await params;
    const body = await request.json();
    const visibility = body?.visibility as string | undefined;

    const session = await getSessionFromRequest(request);
    const authError = requireSession(session);
    if (authError) {
      return chatErrorResponse(authError);
    }

    if (!visibility || !['public', 'private'].includes(visibility)) {
      return new Response(
        JSON.stringify({ error: 'Invalid visibility type' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const { allowed, reason } = await checkChatAccess(
      chatId,
      session?.user.id,
    );

    if (!allowed) {
      return chatErrorResponse(new ChatSDKError('forbidden:chat', reason));
    }

    await updateChatVisiblityById({
      chatId,
      visibility: visibility as 'public' | 'private',
    });
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error updating visibility:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update visibility' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
