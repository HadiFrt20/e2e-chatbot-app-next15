export const runtime = 'nodejs';

export function GET() {
  return new Response('pong', { status: 200 });
}
