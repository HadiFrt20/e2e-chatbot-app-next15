import { createContext, useContext, useMemo, type ReactNode } from 'react';

interface ConfigResponse {
  features: {
    chatHistory: boolean;
  };
}

interface AppConfigContextType {
  config: ConfigResponse | undefined;
  isLoading: boolean;
  error: Error | undefined;
  chatHistoryEnabled: boolean;
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(
  undefined,
);

export function AppConfigProvider({
  children,
  initialConfig,
}: {
  children: ReactNode;
  initialConfig: ConfigResponse;
}) {
  const value: AppConfigContextType = useMemo(
    () => ({
      config: initialConfig,
      isLoading: false,
      error: undefined,
      chatHistoryEnabled: initialConfig?.features.chatHistory ?? true,
    }),
    [initialConfig],
  );

  return (
    <AppConfigContext.Provider value={value}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  const context = useContext(AppConfigContext);
  if (context === undefined) {
    throw new Error('useAppConfig must be used within an AppConfigProvider');
  }
  return context;
}
