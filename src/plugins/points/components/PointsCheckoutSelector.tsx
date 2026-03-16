/**
 * Points Checkout Selector — style-aware
 * Allows users to apply points discount at checkout.
 */

import { Gift, Sparkles, Coins, Check, Star, Heart } from 'lucide-react';
import type { PointsReward } from '../types';
import type { CheckoutData } from '@/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useComponentStyle, type ComponentStyleName } from '@/config/componentStyle';

interface PointsCheckoutSelectorProps {
  userPoints: number;
  rewards: PointsReward[];
  formData: CheckoutData;
  onPointsChange: (pointsToUse: number | undefined) => void;
  currency?: string;
  /** Totalul plătibil fără reducerea din puncte — pentru a filtra opțiunile irelevante */
  payableBeforePoints?: number;
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
function GamifiedSelector({ userPoints, rewards, formData, onPointsChange, currency = 'RON', payableBeforePoints }: PointsCheckoutSelectorProps) {
  if (rewards.length === 0 || userPoints <= 0) return null;
  const availableRewards = rewards.filter((r) => r.pointsCost <= userPoints && (payableBeforePoints == null || r.discountAmount <= payableBeforePoints));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="mt-5 rounded-xl overflow-hidden border border-reward/40 bg-reward-surface">
      <div className="px-4 py-3 bg-gradient-to-r from-reward/20 via-reward-accent/10 to-reward/15 border-b border-reward/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-reward via-reward to-reward-accent flex items-center justify-center shadow-md shadow-reward/40">
            <Gift className="h-4 w-4 text-reward-surface-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-reward-surface-foreground">Folosește punctele tale</p>
            <p className="text-xs text-reward-light/80">Aplică o reducere din punctele acumulate</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-reward-foreground/40 border border-reward/40 rounded-full px-3 py-1">
          <Coins className="h-3.5 w-3.5 text-reward" />
          <span className="text-sm font-bold streak-shimmer text-reward-surface-foreground">{userPoints}</span>
          <span className="text-xs text-reward-light/80">pt</span>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <RewardOption label="Nu folosi puncte" selected={!formData.pointsToUse} onClick={() => onPointsChange(undefined)} variant="gamified" />
        {availableRewards.map((r) => (
          <RewardOption key={r.id} label={`${r.pointsCost} puncte`} value={`-${r.discountAmount} ${currency}`}
            selected={formData.pointsToUse === r.pointsCost} onClick={() => onPointsChange(r.pointsCost)} variant="gamified" />
        ))}
      </div>
      <SelectedFeedback formData={formData} rewards={rewards} currency={currency} variant="gamified" />
    </motion.div>
  );
}

/* ═══ Clean ═══ */
function CleanSelector({ userPoints, rewards, formData, onPointsChange, currency = 'RON', payableBeforePoints }: PointsCheckoutSelectorProps) {
  if (rewards.length === 0 || userPoints <= 0) return null;
  const availableRewards = rewards.filter((r) => r.pointsCost <= userPoints && (payableBeforePoints == null || r.discountAmount <= payableBeforePoints));

  return (
    <div className="mt-5 rounded-xl border border-border bg-card">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium text-foreground">Folosește punctele</p>
        </div>
        <span className="text-sm text-muted-foreground">{userPoints} pt disponibile</span>
      </div>
      <div className="p-4 space-y-2">
        <RewardOption label="Nu folosi puncte" selected={!formData.pointsToUse} onClick={() => onPointsChange(undefined)} variant="clean" />
        {availableRewards.map((r) => (
          <RewardOption key={r.id} label={`${r.pointsCost} puncte`} value={`-${r.discountAmount} ${currency}`}
            selected={formData.pointsToUse === r.pointsCost} onClick={() => onPointsChange(r.pointsCost)} variant="clean" />
        ))}
      </div>
      <SelectedFeedback formData={formData} rewards={rewards} currency={currency} variant="clean" />
    </div>
  );
}

/* ═══ Premium ═══ */
function PremiumSelector({ userPoints, rewards, formData, onPointsChange, currency = 'RON' }: PointsCheckoutSelectorProps) {
  if (rewards.length === 0 || userPoints <= 0) return null;
  const availableRewards = rewards.filter((r) => r.pointsCost <= userPoints);

  return (
    <div className="mt-5 rounded-2xl bg-card border border-border/50 shadow-lg shadow-foreground/5 overflow-hidden">
      <div className="h-0.5 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
      <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium text-foreground tracking-tight">Aplică reducere din puncte</p>
        </div>
        <span className="text-xs text-muted-foreground/60 tracking-wide uppercase">{userPoints} puncte</span>
      </div>
      <div className="p-5 space-y-2">
        <RewardOption label="Fără reducere" selected={!formData.pointsToUse} onClick={() => onPointsChange(undefined)} variant="premium" />
        {availableRewards.map((r) => (
          <RewardOption key={r.id} label={`${r.pointsCost} puncte`} value={`-${r.discountAmount} ${currency}`}
            selected={formData.pointsToUse === r.pointsCost} onClick={() => onPointsChange(r.pointsCost)} variant="premium" />
        ))}
      </div>
      <SelectedFeedback formData={formData} rewards={rewards} currency={currency} variant="premium" />
    </div>
  );
}

/* ═══ Friendly ═══ */
function FriendlySelector({ userPoints, rewards, formData, onPointsChange, currency = 'RON' }: PointsCheckoutSelectorProps) {
  if (rewards.length === 0 || userPoints <= 0) return null;
  const availableRewards = rewards.filter((r) => r.pointsCost <= userPoints);

  return (
    <div className="mt-5 rounded-2xl bg-accent/30 border-2 border-accent shadow-md">
      <div className="px-4 py-3 border-b border-accent flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-primary" />
          <p className="text-sm font-bold text-foreground">Folosește punctele!</p>
        </div>
        <span className="bg-primary/15 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">{userPoints} pt</span>
      </div>
      <div className="p-4 space-y-2">
        <RewardOption label="Nu folosi puncte" selected={!formData.pointsToUse} onClick={() => onPointsChange(undefined)} variant="friendly" />
        {availableRewards.map((r) => (
          <RewardOption key={r.id} label={`${r.pointsCost} puncte`} value={`-${r.discountAmount} ${currency}`}
            selected={formData.pointsToUse === r.pointsCost} onClick={() => onPointsChange(r.pointsCost)} variant="friendly" />
        ))}
      </div>
      <SelectedFeedback formData={formData} rewards={rewards} currency={currency} variant="friendly" />
    </div>
  );
}

/* ═══ Shared sub-components ═══ */

function RewardOption({ label, value, selected, onClick, variant }: {
  label: string; value?: string; selected: boolean; onClick: () => void; variant: ComponentStyleName;
}) {
  const styles: Record<ComponentStyleName, { base: string; selected: string; unselected: string; radio: string; radioSelected: string }> = {
    gamified: {
      base: 'w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 text-left',
      selected: 'border-reward/60 bg-reward-foreground/40 shadow-md shadow-reward/20',
      unselected: 'border-reward-surface-foreground/10 bg-reward-surface-foreground/5 hover:border-reward/40',
      radio: 'border-reward-surface-foreground/30',
      radioSelected: 'border-reward bg-reward',
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

  return (
    <button type="button" onClick={onClick} className={cn(s.base, selected ? s.selected : s.unselected)}>
      <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
        selected ? s.radioSelected : s.radio
      )}>
        {selected && <Check className={cn('h-3 w-3', isGamified ? 'text-reward-foreground' : 'text-primary-foreground')} />}
      </div>
      <div className="flex-1 flex items-center justify-between">
        <span className={cn('text-sm font-medium',
          isGamified ? (selected ? 'text-reward-surface-foreground' : 'text-reward-light/80') : (selected ? 'text-foreground' : 'text-muted-foreground')
        )}>{label}</span>
        {value && (
          <span className={cn('text-sm font-bold',
            isGamified ? (selected ? 'streak-shimmer text-reward' : 'text-reward/80') : (selected ? 'text-primary' : 'text-muted-foreground')
          )}>{value}</span>
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
          <div className={cn('px-4 py-3 flex items-center justify-between',
            isGamified ? 'bg-reward/10 border-t border-reward/15' : 'bg-muted/50 border-t border-border'
          )}>
            <span className={cn('text-xs', isGamified ? 'text-reward/70' : 'text-muted-foreground')}>Reducere aplicată</span>
            <span className={cn('text-sm font-bold', isGamified ? 'text-reward' : 'text-primary')}>
              -{rewards.find((r) => r.pointsCost === formData.pointsToUse)?.discountAmount ?? 0} {currency}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
