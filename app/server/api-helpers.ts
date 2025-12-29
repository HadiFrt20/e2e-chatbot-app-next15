import type { NextRequest } from 'next/server';
import { getAuthSession, type AuthSession } from '@chat-template/auth';
import { ChatSDKError } from '@chat-template/core/errors';

export async function getSessionFromRequest(
  request: NextRequest,
): Promise<AuthSession | null> {
  return getAuthSession({
    getRequestHeader: (name: string) => request.headers.get(name),
  });
}

export function requireSession(session?: AuthSession | null): ChatSDKError | null {
  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat');
  }
  return null;
}

export function chatErrorResponse(error: ChatSDKError): Response {
  const response = error.toResponse();
  return new Response(JSON.stringify(response.json), {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
