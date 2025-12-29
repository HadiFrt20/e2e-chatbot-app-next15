import type { NextRequest } from 'next/server';
import { getChatsByUserId, isDatabaseAvailable } from '@chat-template/db';
import { ChatSDKError } from '@chat-template/core/errors';
import {
  chatErrorResponse,
  getSessionFromRequest,
  requireSession,
} from '@/server/api-helpers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const dbAvailable = isDatabaseAvailable();
  if (!dbAvailable) {
    return new Response(null, { status: 204 });
  }

  const session = await getSessionFromRequest(request);
  const authError = requireSession(session);
  if (authError) {
    return chatErrorResponse(authError);
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = Number.parseInt(searchParams.get('limit') || '10');
  const startingAfter = searchParams.get('starting_after') ?? undefined;
  const endingBefore = searchParams.get('ending_before') ?? undefined;

  if (startingAfter && endingBefore) {
    const error = new ChatSDKError(
      'bad_request:api',
      'Only one of starting_after or ending_before can be provided.',
    );
    return chatErrorResponse(error);
  }

  try {
    const chats = await getChatsByUserId({
      id: session!.user.id,
      limit,
      startingAfter: startingAfter ?? null,
      endingBefore: endingBefore ?? null,
    });

    return Response.json(chats);
  } catch (error) {
    console.error('[/api/history] Error in handler:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch chat history' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
