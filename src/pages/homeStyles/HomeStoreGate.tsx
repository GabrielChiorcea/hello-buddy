/**
 * Poartă pe Home: același UI ca Welcome, până la click sau după refresh.
 */
import React, { useState } from 'react';
import { StoreEntryScreen } from '@/components/StoreEntryScreen';

const STORAGE_KEY = 'helloBuddy.homeStoreGate.dismissed';

function shouldShowHomeStoreGate(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (nav?.type === 'reload') return true;
    return !sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return true;
  }
}

function persistDismissed(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

export const HomeStoreGate: React.FC = () => {
  const [open, setOpen] = useState(shouldShowHomeStoreGate);

  if (!open) return null;

  return (
    <StoreEntryScreen
      presentation="overlay"
      onEnter={() => {
        persistDismissed();
        setOpen(false);
      }}
    />
  );
};
