import type { NextRequest } from 'next/server';
import {
  convertToModelMessages,
  createUIMessageStream,
  generateText,
  streamText,
  type LanguageModelUsage,
} from 'ai';
import {
  checkChatAccess,
  convertToUIMessages,
  generateUUID,
  myProvider,
  postRequestBodySchema,
  type ChatMessage,
  type PostRequestBody,
  type VisibilityType,
} from '@chat-template/core';
import {
  getMessagesByChatId,
  isDatabaseAvailable,
  saveChat,
  saveMessages,
  updateChatLastContextById,
} from '@chat-template/db';
import { DATABRICKS_TOOL_CALL_ID, DATABRICKS_TOOL_DEFINITION } from '@chat-template/ai-sdk-providers/tools';
import { extractApprovalStatus } from '@chat-template/ai-sdk-providers/mcp';
import { ChatSDKError } from '@chat-template/core/errors';
import {
  chatErrorResponse,
  getSessionFromRequest,
  requireSession,
} from '@/server/api-helpers';
import { sseHeaders, streamCache } from '@/server/streaming';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const dbAvailable = isDatabaseAvailable();

  let requestBody: PostRequestBody;
  try {
    requestBody = postRequestBodySchema.parse(await request.json());
  } catch (error) {
    console.error('Error parsing request body:', error);
    return chatErrorResponse(new ChatSDKError('bad_request:api'));
  }

  const session = await getSessionFromRequest(request);
  const authError = requireSession(session);
  if (authError) {
    return chatErrorResponse(authError);
  }

  try {
    console.log('[API /chat] Incoming request', {
      id: requestBody?.id,
      hasMessage: !!requestBody?.message,
      selectedChatModel: requestBody?.selectedChatModel,
      selectedVisibilityType: requestBody?.selectedVisibilityType,
      previousMessagesCount: requestBody?.previousMessages?.length ?? 0,
    });
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
      previousMessages,
      nextMessageId,
    }: {
      id: string;
      message?: ChatMessage;
      selectedChatModel: string;
      selectedVisibilityType: VisibilityType;
      previousMessages?: ChatMessage[];
      nextMessageId?: string;
    } = requestBody;

    const { chat, allowed, reason } = await checkChatAccess(
      id,
      session?.user.id,
    );

    if (reason !== 'not_found' && !allowed) {
      return chatErrorResponse(new ChatSDKError('forbidden:chat'));
    }

    if (!chat) {
      if (dbAvailable && message) {
        const title = await generateTitleFromUserMessage({ message });
        await saveChat({
          id,
          userId: session!.user.id,
          title,
          visibility: selectedVisibilityType,
        });
      }
    } else if (chat.userId !== session!.user.id) {
      return chatErrorResponse(new ChatSDKError('forbidden:chat'));
    }

    const messagesFromDb = await getMessagesByChatId({ id });

    const useClientMessages =
      !dbAvailable || (!message && previousMessages?.length);
    const priorMessages = useClientMessages
      ? (previousMessages ?? [])
      : convertToUIMessages(messagesFromDb);

    let uiMessages: ChatMessage[];
    if (message) {
      uiMessages = [...priorMessages, message];
      if (dbAvailable) {
        await saveMessages({
          messages: [
            {
              chatId: id,
              id: message.id,
              role: 'user',
              parts: message.parts,
              attachments: [],
              createdAt: new Date(),
            },
          ],
        });
      }
    } else {
      uiMessages = priorMessages as ChatMessage[];

      if (dbAvailable && previousMessages?.length) {
        const assistantMessages = previousMessages.filter(
          (m: ChatMessage) => m.role === 'assistant',
        );

        if (assistantMessages.length > 0) {
          await saveMessages({
            messages: assistantMessages.map((m: ChatMessage) => ({
              chatId: id,
              id: m.id,
              role: m.role,
              parts: m.parts,
              attachments: [],
              createdAt: m.metadata?.createdAt
                ? new Date(m.metadata.createdAt)
                : new Date(),
            })),
          });

          const lastAssistantMessage = assistantMessages.at(-1);
          const lastPart = lastAssistantMessage?.parts?.at(-1);
          const approvalStatus =
            lastPart?.type === 'tool-databricks-tool-call' && lastPart.output
              ? extractApprovalStatus(lastPart.output)
              : undefined;

          if (approvalStatus === false) {
            return new Response(
              new ReadableStream({
                start(controller) {
                  controller.close();
                },
              }),
              { headers: sseHeaders },
            );
          }
        }
      }
    }

    streamCache.clearActiveStream(id);

    let finalUsage: LanguageModelUsage | undefined;
    const streamId = generateUUID();

    const model = await myProvider.languageModel(selectedChatModel);
    console.log('[API /chat] Using model', selectedChatModel);
    const result = streamText({
      model,
      messages: convertToModelMessages(uiMessages),
      onFinish: ({ usage }) => {
        finalUsage = usage;
      },
      tools: {
        [DATABRICKS_TOOL_CALL_ID]: DATABRICKS_TOOL_DEFINITION,
      },
    });

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        writer.merge(
          result.toUIMessageStream({
            originalMessages: uiMessages,
            generateMessageId: () => nextMessageId ?? generateUUID(),
            sendReasoning: true,
            sendSources: true,
            onError: (error) => {
              console.error('Stream error:', error);

              const errorMessage =
                error instanceof Error ? error.message : JSON.stringify(error);

              writer.write({ type: 'data-error', data: errorMessage });

              return errorMessage;
            },
          }),
        );
      },
      onFinish: async ({ responseMessage }) => {
        if (dbAvailable) {
          await saveMessages({
            messages: [
              {
                id: responseMessage.id,
                role: responseMessage.role,
                parts: responseMessage.parts,
                createdAt: new Date(),
                attachments: [],
                chatId: id,
              },
            ],
          });

          if (finalUsage) {
            try {
              await updateChatLastContextById({
                chatId: id,
                context: finalUsage,
              });
            } catch (err) {
              console.warn('Unable to persist last usage for chat', id, err);
            }
          }
        }

        streamCache.clearActiveStream(id);
        console.log('[API /chat] Finished streaming response', {
          chatId: id,
          usage: finalUsage,
        });
      },
    });

    // Format as SSE and tee for resume cache
    const formattedStream = stream.pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          const payload = typeof chunk === 'string' ? chunk : JSON.stringify(chunk);
          controller.enqueue(`data: ${payload}\n\n`);
        },
      }),
    );

    const [responseStream, cachedStream] = formattedStream.tee();
    streamCache.storeStream({
      streamId,
      chatId: id,
      stream: cachedStream,
    });

    const encoder = new TextEncoder();
    const sseReadable = new ReadableStream({
      start(controller) {
        const reader = responseStream.getReader();
        (async () => {
          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) {
                controller.close();
                break;
              }
              if (value !== undefined) {
                controller.enqueue(encoder.encode(value));
              }
            }
          } catch (err) {
            controller.error(err);
          }
        })();
      },
    });

    return new Response(sseReadable, { headers: sseHeaders });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      console.error('[API /chat] ChatSDKError', error);
      return chatErrorResponse(error);
    }

    console.error('Unhandled error in chat API:', error);
    return chatErrorResponse(new ChatSDKError('offline:chat'));
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
