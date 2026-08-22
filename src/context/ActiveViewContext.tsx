import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface ActiveViewContextValue {
  activeView: string | null;
  setActiveView: (key: string | null) => void;
}

const ActiveViewContext = createContext<ActiveViewContextValue | undefined>(undefined);

export function ActiveViewProvider({ children }: { children: ReactNode }) {
  const [activeView, setActiveView] = useState<string | null>(null);
  return <ActiveViewContext.Provider value={{ activeView, setActiveView }}>{children}</ActiveViewContext.Provider>;
}

export function useActiveView() {
  const ctx = useContext(ActiveViewContext);
  if (!ctx) throw new Error('useActiveView must be used within ActiveViewProvider');
  return ctx;
}

/** Declares that the current component is actively showing `key` (e.g. "dorm:gryffindor"), so notifications for it can be suppressed elsewhere. Pass null when nothing specific is being viewed. */
export function useDeclareActiveView(key: string | null) {
  const { setActiveView } = useActiveView();
  useEffect(() => {
    setActiveView(key);
    return () => setActiveView(null);
  }, [key, setActiveView]);
}
