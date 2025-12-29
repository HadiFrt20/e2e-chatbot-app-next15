'use client';

import { useEffect } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { SessionProvider } from '@/contexts/SessionContext';
import { AppConfigProvider } from '@/contexts/AppConfigContext';
import { DataStreamProvider } from '@/components/data-stream-provider';
import { Toaster } from 'sonner';
import type { ClientSession } from '@chat-template/auth';

const LIGHT_THEME_COLOR = 'hsl(0 0% 100%)';
const DARK_THEME_COLOR = 'hsl(240deg 10% 3.92%)';

function ThemeColorWatcher() {
  useEffect(() => {
    const html = document.documentElement;
    const meta = document.getElementById('theme-color-meta');

    if (!meta) return;

    const updateThemeColor = () => {
      const isDark = html.classList.contains('dark');
      meta.setAttribute('content', isDark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
    };

    const observer = new MutationObserver(updateThemeColor);
    observer.observe(html, { attributes: true, attributeFilter: ['class'] });
    updateThemeColor();

    return () => observer.disconnect();
  }, []);

  return null;
}

export function Providers({
  children,
  initialSession,
  initialConfig,
}: {
  children: React.ReactNode;
  initialSession: ClientSession | null;
  initialConfig: { features: { chatHistory: boolean } };
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider initialSession={initialSession}>
        <AppConfigProvider initialConfig={initialConfig}>
          <DataStreamProvider>
            <ThemeColorWatcher />
            <Toaster position="top-center" />
            {children}
          </DataStreamProvider>
        </AppConfigProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
