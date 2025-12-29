import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { headers } from 'next/headers';
import { getAuthSession } from '@chat-template/auth';
import { isDatabaseAvailable } from '@chat-template/db';

export const metadata: Metadata = {
  title: 'Databricks Chatbot',
  description: 'Chat template for Databricks agents',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const initialSession =
    (await getAuthSession({
      getRequestHeader: (name: string) => headerStore.get(name),
    })) ?? null;
  const initialConfig = {
    features: { chatHistory: isDatabaseAvailable() },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta id="theme-color-meta" name="theme-color" content="hsl(0 0% 100%)" />
      </head>
      <body>
        <Providers initialSession={initialSession} initialConfig={initialConfig}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
