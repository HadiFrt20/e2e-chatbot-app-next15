import type { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/server/api-helpers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session?.user) {
    return Response.json({ user: null });
  }

  return Response.json({
    user: {
      email: session.user.email,
      name: session.user.name,
      preferredUsername: session.user.preferredUsername,
    },
  });
}
