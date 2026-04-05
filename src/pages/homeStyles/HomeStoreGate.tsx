/**
 * Poartă pe Home: același UI ca Welcome, până la click sau după refresh.
 */
import React, { useState } from 'react';
import { ChevronRight, UtensilsCrossed } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { texts } from '@/config/texts';

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
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-primary">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-primary-foreground/5" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary-foreground/5" />
        <div className="absolute left-10 top-1/4 h-20 w-20 rounded-full bg-primary-foreground/5" />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8 px-6 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="flex h-28 w-28 items-center justify-center rounded-3xl bg-primary-foreground/15 shadow-2xl backdrop-blur-sm"
        >
          <UtensilsCrossed className="h-14 w-14 text-primary-foreground" strokeWidth={1.5} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h1 className="text-4xl font-bold tracking-tight text-primary-foreground">{texts.app.name}</h1>
          <p className="mt-3 text-lg leading-relaxed text-primary-foreground/75">{texts.app.tagline}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 flex w-full flex-col gap-3"
        >
          <Button
            type="button"
            onClick={() => {
              persistDismissed();
              setOpen(false);
            }}
            size="lg"
            className="h-14 w-full gap-2 bg-primary-foreground text-base font-semibold text-primary shadow-lg hover:bg-primary-foreground/90"
          >
            {texts.home.enterStore}
            <ChevronRight className="h-5 w-5" aria-hidden />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
