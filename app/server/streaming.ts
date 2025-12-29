import { Readable } from 'node:stream';
import { StreamCache } from '@chat-template/core';

export const streamCache = new StreamCache();

export const sseHeaders = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
};

export function nodeReadableToWeb(
  stream: Readable,
): ReadableStream<Uint8Array> {
  return Readable.toWeb(stream) as ReadableStream<Uint8Array>;
}
