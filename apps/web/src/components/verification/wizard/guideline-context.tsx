'use client';

import * as React from 'react';

interface GuidelineContextType {
  activeKey: string;
  setActiveKey: (key: string) => void;
  defaultStepKey: string;
}

const GuidelineContext = React.createContext<GuidelineContextType | undefined>(undefined);

export function GuidelineProvider({
  defaultStepKey,
  children,
}: {
  defaultStepKey: string;
  children: React.ReactNode;
}) {
  const [activeKey, setActiveKey] = React.useState<string>(defaultStepKey);

  // Sync with defaultStepKey when step changes
  React.useEffect(() => {
    setActiveKey(defaultStepKey);
  }, [defaultStepKey]);

  return (
    <GuidelineContext.Provider value={{ activeKey, setActiveKey, defaultStepKey }}>
      {children}
    </GuidelineContext.Provider>
  );
}

export function useGuideline() {
  const ctx = React.useContext(GuidelineContext);
  if (!ctx) {
    throw new Error('useGuideline must be used within a GuidelineProvider');
  }
  return ctx;
}

interface GuidedFieldProps {
  guideKey: string;
  children: React.ReactNode;
  className?: string;
}

export function GuidedField({ guideKey, children, className }: GuidedFieldProps) {
  const { setActiveKey } = useGuideline();

  return (
    <div
      onFocusCapture={() => setActiveKey(guideKey)}
      onClick={() => setActiveKey(guideKey)}
      className={className}
    >
      {children}
    </div>
  );
}
