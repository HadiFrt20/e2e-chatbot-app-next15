import type { NextRequest } from 'next/server';
import { generateText } from 'ai';
import { myProvider, type ChatMessage } from '@chat-template/core';
import { ChatSDKError } from '@chat-template/core/errors';
import {
  chatErrorResponse,
  getSessionFromRequest,
  requireSession,
} from '@/server/api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  const authError = requireSession(session);
  if (authError) {
    return chatErrorResponse(authError);
  }

  try {
    const { message } = (await request.json()) as { message: ChatMessage };
    const title = await generateTitleFromUserMessage({ message });
    return Response.json({ title });
  } catch (error) {
    console.error('Error generating title:', error);
    const err =
      error instanceof ChatSDKError
        ? error
        : new ChatSDKError('bad_request:api');
    return chatErrorResponse(err);
  }
}

async function generateTitleFromUserMessage({
  message,
}: {
  message: ChatMessage;
}) {
  const model = await myProvider.languageModel('title-model');
  const { text: title } = await generateText({
    model,
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons. do not include other expository content ("I'll help...")`,
    prompt: JSON.stringify(message),
  });

  return title;
}
