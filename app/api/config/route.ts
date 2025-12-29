import { isDatabaseAvailable } from '@chat-template/db';

export const runtime = 'nodejs';

export function GET() {
  return Response.json({
    features: {
      chatHistory: isDatabaseAvailable(),
    },
  });
}
