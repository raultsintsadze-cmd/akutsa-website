'use client';

import { createContext, useContext, useState } from 'react';

interface FloatingButtonsContextValue {
  hideFloatingButtons: boolean;
  setHideFloatingButtons: (hide: boolean) => void;
}

const FloatingButtonsContext = createContext<FloatingButtonsContextValue>({
  hideFloatingButtons: false,
  setHideFloatingButtons: () => {}
});

export function FloatingButtonsProvider({ children }: { children: React.ReactNode }) {
  const [hideFloatingButtons, setHideFloatingButtons] = useState(false);

  return (
    <FloatingButtonsContext.Provider value={{ hideFloatingButtons, setHideFloatingButtons }}>
      {children}
    </FloatingButtonsContext.Provider>
  );
}

export function useFloatingButtons() {
  return useContext(FloatingButtonsContext);
}
