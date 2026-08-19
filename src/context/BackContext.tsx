import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

type BackHandler = (() => void) | null;

interface BackContextValue {
  handler: BackHandler;
  setBackHandler: (fn: BackHandler) => void;
}

const BackContext = createContext<BackContextValue | undefined>(undefined);

export function BackProvider({ children }: { children: ReactNode }) {
  const [handler, setHandler] = useState<BackHandler>(null);
  const setBackHandler = useCallback((fn: BackHandler) => setHandler(() => fn), []);
  return <BackContext.Provider value={{ handler, setBackHandler }}>{children}</BackContext.Provider>;
}

export function useBackContext() {
  const ctx = useContext(BackContext);
  if (!ctx) throw new Error('useBackContext must be used within BackProvider');
  return ctx;
}

/** Registers a page-local "close this detail view" handler for the shared top-left back button. Pass null when there's nothing to close (falls back to normal navigation). */
export function usePageBack(handler: BackHandler) {
  const { setBackHandler } = useBackContext();
  useEffect(() => {
    setBackHandler(handler);
    return () => setBackHandler(null);
  }, [handler, setBackHandler]);
}
