/**
 * TierProgressBar — delegates rendering to the active component style variant.
 * Marketing-optimized: FOMO for unauthenticated users.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@apollo/client';
import { useAppSelector } from '@/store';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { Button } from '@/components/ui/button';
import { routes } from '@/config/routes';
import { GET_LOYALTY_TIERS } from '@/graphql/queries';
import { TierIcon } from '@/config/tierIcons';
import { useTierStyle } from '@/config/componentStyle';
import { useTierDisplayData } from './tierStyles/shared';
import { GamifiedTier } from './tierStyles/gamifiedTier';
import { CleanTier } from './tierStyles/cleanTier';
import { PremiumTier } from './tierStyles/premiumTier';
import { FriendlyTier } from './tierStyles/friendlyTier';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';

const TIER_VARIANTS = {
  gamified: GamifiedTier,
  clean: CleanTier,
  premium: PremiumTier,
  friendly: FriendlyTier,
} as const;

interface LoyaltyTierLite {
  id: string;
  name: string;
  xpThreshold: number;
  pointsMultiplier: number;
  badgeIcon?: string | null;
  sortOrder: number;
  benefitDescription?: string | null;
}

export const TierProgressBar: React.FC = () => {
  const { isAuthenticated } = useAppSelector((s) => s.user);
  const { enabled: tiersEnabled } = usePluginEnabled('tiers');
  const style = useTierStyle();
  const data = useTierDisplayData();
  const { data: tiersData } = useQuery<{ loyaltyTiers: LoyaltyTierLite[] }>(GET_LOYALTY_TIERS, {
    fetchPolicy: 'cache-first',
  });

  if (!tiersEnabled) return null;

  if (!data) {
    const tiers: LoyaltyTierLite[] =
      (tiersData?.loyaltyTiers ?? []).slice().sort((a, b) => {
        const aOrder = a.sortOrder ?? a.xpThreshold;
        const bOrder = b.sortOrder ?? b.xpThreshold;
        return aOrder - bOrder;
      });

    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {isAuthenticated ? (
          <div className="relative overflow-hidden rounded-2xl border border-dashed border-border/70 bg-card/80 px-4 py-3 shadow-sm">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Momentan nu ai încă un rang de loialitate afișabil. Plasează câteva comenzi sau
              verifică-ți datele din secțiunea Profil pentru a debloca nivelele.
            </p>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-dashed border-border/70 bg-card/80 px-4 py-4 shadow-sm space-y-4">
            {/* FOMO banner */}
            <div className="flex items-center gap-2 rounded-lg bg-reward/10 border border-reward/20 px-3 py-2">
              <Sparkles className="h-4 w-4 text-reward flex-shrink-0" />
              <p className="text-[11px] font-medium text-foreground">
                Alți clienți câștigă deja puncte bonus! <span className="font-bold text-reward">Nu pierde recompensele.</span>
              </p>
            </div>

            {tiers.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {tiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="relative rounded-xl border border-border/70 bg-background/70 p-3 flex flex-col items-center text-center gap-1 shadow-sm"
                  >
                    <div className="relative inline-flex">
                      <span className="inline-flex items-center justify-center leading-none">
                        <TierIcon badgeIcon={tier.badgeIcon} tierLabel={tier.name} size={30} />
                      </span>
                      <span className="absolute -top-4 -right-12 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-background shadow-sm">
                        x{tier.pointsMultiplier.toFixed(1)}
                      </span>
                    </div>
                    <div className="mt-1">
                      <p className="text-xs font-bold text-foreground">{tier.name}</p>
                      <p className="text-[9px] text-muted-foreground">{tier.xpThreshold} XP</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-1">
              <Button asChild size="sm" className="w-full text-xs font-medium group">
                <Link to={routes.login} className="flex items-center justify-center gap-2">
                  <Zap className="h-3.5 w-3.5" />
                  Autentifică-te pentru rang
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  const Variant = TIER_VARIANTS[style];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <Variant data={data} />
    </motion.div>
  );
};
