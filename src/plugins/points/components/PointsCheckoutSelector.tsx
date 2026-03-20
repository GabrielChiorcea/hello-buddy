/**
 * Points Checkout Selector — style-aware
 * Allows users to apply points discount at checkout.
 */

import { Gift, Coins, Check, Star, Heart } from 'lucide-react';
import type { PointsReward } from '../types';
import type { CheckoutData } from '@/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useComponentStyle, type ComponentStyleName } from '@/config/componentStyle';

interface PointsCheckoutSelectorProps {
  userPoints: number;
  rewards: PointsReward[];
  formData: CheckoutData;
  onPointsChange: (pointsToUse: number | undefined) => void;
  currency?: string;
  /** Totalul plătibil fără reducerea din puncte — pentru a filtra opțiunile irelevante */
  payableBeforePoints?: number;
  freeProductMinOrderValue?: number | null;
  hasFreeProductApplied?: boolean;
  onNeedMoreProducts?: () => void;
}

export function PointsCheckoutSelector(props: PointsCheckoutSelectorProps) {
  const style = useComponentStyle();
  switch (style) {
    case 'clean': return <CleanSelector {...props} />;
    case 'premium': return <PremiumSelector {...props} />;
    case 'friendly': return <FriendlySelector {...props} />;
    default: return <GamifiedSelector {...props} />;
  }
}

/* ═══ Gamified (original casino style) ═══ */
function GamifiedSelector(props: PointsCheckoutSelectorProps) {
  const safeUserPoints = Number(props.userPoints) || 0;
  if (props.rewards.length === 0 || safeUserPoints <= 0) return null;
  return (
    <SelectorContent
      variant="gamified"
      userPoints={safeUserPoints}
      {...props}
    />
  );
}

/* ═══ Clean ═══ */
function CleanSelector(props: PointsCheckoutSelectorProps) {
  const safeUserPoints = Number(props.userPoints) || 0;
  if (props.rewards.length === 0 || safeUserPoints <= 0) return null;
  return <SelectorContent variant="clean" userPoints={safeUserPoints} {...props} />;
}

/* ═══ Premium ═══ */
function PremiumSelector(props: PointsCheckoutSelectorProps) {
  const safeUserPoints = Number(props.userPoints) || 0;
  if (props.rewards.length === 0 || safeUserPoints <= 0) return null;
  return <SelectorContent variant="premium" userPoints={safeUserPoints} {...props} />;
}

/* ═══ Friendly ═══ */
function FriendlySelector(props: PointsCheckoutSelectorProps) {
  const safeUserPoints = Number(props.userPoints) || 0;
  if (props.rewards.length === 0 || safeUserPoints <= 0) return null;
  return <SelectorContent variant="friendly" userPoints={safeUserPoints} {...props} />;
}

function SelectorContent({
  variant,
  userPoints,
  rewards,
  formData,
  onPointsChange,
  currency = 'RON',
  payableBeforePoints,
  freeProductMinOrderValue,
  hasFreeProductApplied,
  onNeedMoreProducts,
}: PointsCheckoutSelectorProps & { variant: ComponentStyleName; userPoints: number }) {
  const [blockedDiscount, setBlockedDiscount] = useState<number | null>(null);
  const baseAvailable = rewards.filter((r) => r.pointsCost <= userPoints && (payableBeforePoints == null || r.discountAmount <= payableBeforePoints));
  const minRequiredAfterDiscount = hasFreeProductApplied && freeProductMinOrderValue != null ? freeProductMinOrderValue : null;
  const maxAllowedDiscount = minRequiredAfterDiscount != null && payableBeforePoints != null
    ? Math.max(0, payableBeforePoints - minRequiredAfterDiscount)
    : null;

  const handleRewardClick = (pointsCost: number, discountAmount: number) => {
    if (maxAllowedDiscount != null && discountAmount > maxAllowedDiscount) {
      setBlockedDiscount(discountAmount);
      return;
    }
    onPointsChange(pointsCost);
  };

  const rewardButton = (r: PointsReward) => (
    <RewardOption
      key={r.id}
      label={`${r.pointsCost} puncte`}
      value={`-${r.discountAmount} ${currency}`}
      selected={formData.pointsToUse === r.pointsCost}
      onClick={() => handleRewardClick(r.pointsCost, r.discountAmount)}
      variant={variant}
      disabled={maxAllowedDiscount != null && r.discountAmount > maxAllowedDiscount}
      onDisabledClick={() => setBlockedDiscount(r.discountAmount)}
    />
  );

  return (
    <>
      {variant === 'gamified' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 relative rounded-2xl overflow-hidden gamified-casino-card">
          <div className="absolute -top-16 -right-10 w-24 h-24 bg-reward/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-reward-light/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 px-5 py-4 border-b border-[rgba(255,160,60,0.35)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-reward via-reward to-reward-accent flex items-center justify-center shadow-md shadow-reward/40"><Gift className="h-4 w-4 text-reward-surface-foreground" /></div>
              <div className="leading-tight"><p className="points-casino-title">Folosește punctele tale</p><p className="points-casino-subtitle">Aplică o reducere din punctele acumulate</p></div>
            </div>
            <div className="points-balance-chip flex items-center gap-1.5 rounded-full px-3 py-1"><Coins className="h-3.5 w-3.5 text-reward-foreground" /><span className="points-balance-value">{userPoints.toFixed(2)}</span><span className="points-balance-unit">pt</span></div>
          </div>
          <div className="relative z-10 p-5 space-y-2">
            <RewardOption label="Nu folosi puncte" selected={!formData.pointsToUse} onClick={() => onPointsChange(undefined)} variant="gamified" />
            {baseAvailable.map(rewardButton)}
          </div>
          <SelectedFeedback formData={formData} rewards={rewards} currency={currency} variant="gamified" />
        </motion.div>
      )}
      {variant === 'clean' && (
        <div className="mt-5 rounded-xl border border-border bg-card">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between"><div className="flex items-center gap-2"><Coins className="h-4 w-4 text-primary" /><p className="text-sm font-medium text-foreground">Folosește punctele</p></div><span className="text-sm text-muted-foreground">{userPoints} pt disponibile</span></div>
          <div className="p-4 space-y-2"><RewardOption label="Nu folosi puncte" selected={!formData.pointsToUse} onClick={() => onPointsChange(undefined)} variant="clean" />{baseAvailable.map(rewardButton)}</div>
          <SelectedFeedback formData={formData} rewards={rewards} currency={currency} variant="clean" />
        </div>
      )}
      {variant === 'premium' && (
        <div className="mt-5 rounded-2xl bg-card border border-border/50 shadow-lg shadow-foreground/5 overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
          <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between"><div className="flex items-center gap-2"><Star className="h-4 w-4 text-primary" /><p className="text-sm font-medium text-foreground tracking-tight">Aplică reducere din puncte</p></div><span className="text-xs text-muted-foreground/60 tracking-wide uppercase">{userPoints} puncte</span></div>
          <div className="p-5 space-y-2"><RewardOption label="Fără reducere" selected={!formData.pointsToUse} onClick={() => onPointsChange(undefined)} variant="premium" />{baseAvailable.map(rewardButton)}</div>
          <SelectedFeedback formData={formData} rewards={rewards} currency={currency} variant="premium" />
        </div>
      )}
      {variant === 'friendly' && (
        <div className="mt-5 rounded-2xl bg-accent/30 border-2 border-accent shadow-md">
          <div className="px-4 py-3 border-b border-accent flex items-center justify-between"><div className="flex items-center gap-2"><Heart className="h-4 w-4 text-primary" /><p className="text-sm font-bold text-foreground">Folosește punctele!</p></div><span className="bg-primary/15 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">{userPoints} pt</span></div>
          <div className="p-4 space-y-2"><RewardOption label="Nu folosi puncte" selected={!formData.pointsToUse} onClick={() => onPointsChange(undefined)} variant="friendly" />{baseAvailable.map(rewardButton)}</div>
          <SelectedFeedback formData={formData} rewards={rewards} currency={currency} variant="friendly" />
        </div>
      )}

      <Dialog open={blockedDiscount != null} onOpenChange={(open) => !open && setBlockedDiscount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reducerea din puncte nu poate fi aplicată</DialogTitle>
            <DialogDescription>
              Pentru a păstra produsul gratuit, totalul după reduceri trebuie să rămână cel puțin {freeProductMinOrderValue ?? 0} {currency}. Adaugă produse în coș sau elimină reducerea din puncte.
            </DialogDescription>
          </DialogHeader>
          {blockedDiscount != null && maxAllowedDiscount != null && (
            <p className="text-sm text-muted-foreground">
              Ai ales -{blockedDiscount} {currency}, dar maximul permis acum este -{maxAllowedDiscount.toFixed(2)} {currency}.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { onPointsChange(undefined); setBlockedDiscount(null); }}>
              Elimină reducerea puncte
            </Button>
            <Button onClick={() => { setBlockedDiscount(null); onNeedMoreProducts?.(); }}>
              Adaugă produse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ═══ Shared sub-components ═══ */

function RewardOption({ label, value, selected, onClick, variant, disabled = false, onDisabledClick }: {
  label: string; value?: string; selected: boolean; onClick: () => void; variant: ComponentStyleName; disabled?: boolean; onDisabledClick?: () => void;
}) {
  const styles: Record<ComponentStyleName, { base: string; selected: string; unselected: string; radio: string; radioSelected: string }> = {
    gamified: {
      base: 'w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left bg-white/5 border-white/10',
      selected: 'gamified-option-selected border-[rgba(255,100,30,0.6)] bg-[rgba(255,80,0,0.12)] shadow-[0_0_16px_rgba(0,0,0,0.5)] scale-[1.01]',
      unselected: 'hover:border-[rgba(255,160,60,0.4)]',
      radio: 'border-[1.5px] border-white/25 bg-transparent',
      radioSelected: 'border-transparent bg-gradient-to-br from-[#ff4500] to-[#ff6b00] shadow-[0_0_8px_rgba(255,80,0,0.5)]',
    },
    clean: {
      base: 'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-colors text-left',
      selected: 'border-primary bg-primary/5',
      unselected: 'border-border hover:border-primary/40',
      radio: 'border-muted-foreground/30',
      radioSelected: 'border-primary bg-primary',
    },
    premium: {
      base: 'w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left',
      selected: 'border-primary/40 bg-primary/5',
      unselected: 'border-border/50 hover:border-primary/30',
      radio: 'border-muted-foreground/20',
      radioSelected: 'border-primary bg-primary',
    },
    friendly: {
      base: 'w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors text-left',
      selected: 'border-primary bg-primary/10',
      unselected: 'border-border hover:border-primary/40',
      radio: 'border-muted-foreground/30',
      radioSelected: 'border-primary bg-primary',
    },
  };

  const s = styles[variant];
  const isGamified = variant === 'gamified';
  const isGamifiedNone = isGamified && label.toLowerCase().startsWith('nu folosi');

  return (
    <button
      type="button"
      onClick={disabled ? (onDisabledClick ?? (() => {})) : onClick}
      className={cn(
        s.base,
        disabled && 'opacity-60 cursor-not-allowed',
        selected
          ? isGamifiedNone
            ? 'border-white/20 bg-white/5'
            : s.selected
          : s.unselected
      )}
    >
      <div
        className={cn(
          'w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 transition-all',
          selected
            ? isGamifiedNone && isGamified
              ? 'border-[1.5px] border-[rgba(255,180,120,0.9)] bg-[rgba(255,255,255,0.08)]'
              : s.radioSelected
            : s.radio
        )}
      >
        {selected && (
          <Check
            className={cn(
              'h-3 w-3',
              isGamified
                ? isGamifiedNone
                  ? 'text-[rgba(255,180,120,0.95)]'
                  : 'text-white'
                : 'text-primary-foreground'
            )}
          />
        )}
      </div>
      <div className="flex-1 flex items-center justify-between">
        <span
          className={cn(
            'text-[14px] font-medium',
            isGamified
              ? 'text-white'
              : selected
                ? 'text-foreground'
                : 'text-muted-foreground'
          )}
        >
          {label}
        </span>
        {value && (
          <span
            className={cn(
              'text-[15px] font-bold',
              isGamified
                ? 'text-[#ffcc44] tracking-wide'
                : selected
                  ? 'text-primary'
                  : 'text-muted-foreground'
            )}
          >
            {value}
          </span>
        )}
      </div>
    </button>
  );
}

function SelectedFeedback({ formData, rewards, currency, variant }: {
  formData: CheckoutData; rewards: PointsReward[]; currency: string; variant: ComponentStyleName;
}) {
  const isGamified = variant === 'gamified';
  return (
    <AnimatePresence>
      {formData.pointsToUse && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden">
          <div
            className={cn(
              'px-5 py-3 flex items-center justify-between',
              isGamified ? 'bg-[rgba(0,0,0,0.45)] border-t border-[rgba(255,160,60,0.4)]' : 'bg-muted/50 border-t border-border'
          )}>
            <span className={cn('text-xs', isGamified ? 'text-[rgba(255,255,255,0.6)]' : 'text-muted-foreground')}>Reducere aplicată</span>
            <span className={cn('text-sm font-bold', isGamified ? 'text-[#ffcc44]' : 'text-primary')}>
              -{rewards.find((r) => r.pointsCost === formData.pointsToUse)?.discountAmount ?? 0} {currency}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
