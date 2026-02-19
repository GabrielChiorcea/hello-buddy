/**
 * Modal afișat la prima autentificare după ce utilizatorul a primit puncte cadou la înregistrare.
 * Afișează confetti și mesaj „Ai câștigat X puncte” cu buton „Mergi la produse”.
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Gift } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { texts } from '@/config/texts';

interface WelcomeBonusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pointsAmount: number;
  onGoToProducts: () => void;
}

export const WelcomeBonusModal: React.FC<WelcomeBonusModalProps> = ({
  open,
  onOpenChange,
  pointsAmount,
  onGoToProducts,
}) => {
  useEffect(() => {
    if (open && pointsAmount > 0) {
      const duration = 4500;
      const interval = 280;
      const end = Date.now() + duration;
      const colors = ['#22c55e', '#eab308', '#3b82f6', '#a855f7', '#ec4899'];
      const run = () => {
        if (Date.now() > end) return;
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 50,
          origin: { x: 0.15, y: 0.7 },
          colors,
          drift: 0.4,
          scalar: 1.1,
          ticks: 200,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 50,
          origin: { x: 0.85, y: 0.7 },
          colors,
          drift: -0.4,
          scalar: 1.1,
          ticks: 200,
        });
        setTimeout(run, interval);
      };
      const t = setTimeout(run, 400);
      return () => clearTimeout(t);
    }
  }, [open, pointsAmount]);

  const handleGoToProducts = () => {
    onGoToProducts();
    onOpenChange(false);
  };

  const title = texts.welcomeBonus.title.replace('{count}', String(pointsAmount));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!w-[calc(100%-2rem)] !max-w-md rounded-2xl shadow-xl border-0 bg-gradient-to-b from-primary/5 to-background p-8"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 ring-4 ring-primary/10">
            <Gift className="h-9 w-9 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {texts.welcomeBonus.description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-6">
          <Button onClick={handleGoToProducts} size="lg" className="min-w-[200px] rounded-xl">
            {texts.welcomeBonus.goToProducts}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
