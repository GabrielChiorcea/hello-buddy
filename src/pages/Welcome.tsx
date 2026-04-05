import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import {
  ArrowRight,
  ChevronRight,
  Gift,
  Lock,
  ShoppingCart,
  Sparkles,
  Timer,
  TrendingUp,
  UtensilsCrossed,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TierIcon } from '@/config/tierIcons';
import { useAppDispatch, useAppSelector } from '@/store';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { getProductUrl, routes } from '@/config/routes';
import { getImageUrl } from '@/lib/imageUrl';
import type { Product } from '@/types';
import { GET_LOYALTY_TIERS } from '@/graphql/queries';
import { BRANDING_LOGO_URL } from '@/config/branding';
import { texts } from '@/config/texts';
import { prefetchHomeCatalogData } from '@/pages/homeStyles/shared';
import { motion } from 'framer-motion';

interface LoyaltyTierLite {
  id: string;
  name: string;
  xpThreshold: number;
  pointsMultiplier: number;
  badgeIcon?: string | null;
  sortOrder: number;
}

/** Previzualizare produse — doar desktop, în coloana primary de pe Welcome */
function WelcomeProductPeek() {
  const navigate = useNavigate();
  const { items, recommendedProducts, isLoading } = useAppSelector((s) => s.products);

  const preview = useMemo(() => {
    const source: Product[] = recommendedProducts.length > 0 ? recommendedProducts : [...items];
    return source.filter((p) => p.isAvailable).slice(0, 4);
  }, [items, recommendedProducts]);

  const showSkeleton = isLoading && preview.length === 0;
  if (!showSkeleton && preview.length === 0) return null;

  return (
    <div className="mt-8 hidden w-full max-w-md flex-col gap-3 self-center lg:mt-0 lg:flex lg:max-w-none">
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/75">
        {texts.home.welcomeProductPeekTitle}
      </p>
      {showSkeleton ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-primary-foreground/15" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {preview.map((product, i) => (
            <motion.button
              key={product.id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.06 * i }}
              onClick={() => navigate(getProductUrl(product.id))}
              className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl text-left ring-1 ring-primary-foreground/25 transition hover:scale-[1.02] hover:ring-primary-foreground/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/70"
            >
              <img
                src={getImageUrl(product.image)}
                alt={product.name}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <p className="absolute bottom-2 left-2.5 right-2.5 line-clamp-2 text-xs font-semibold leading-tight text-white drop-shadow-md">
                {product.name}
              </p>
            </motion.button>
          ))}
        </div>
      )}
      {!showSkeleton && preview.length > 0 && (
        <p className="text-center text-[10px] text-primary-foreground/60">{texts.home.welcomeProductPeekHint}</p>
      )}
    </div>
  );
}

/**
 * Timer decorativ Welcome — setezi aici durata (minute), aleator între min și max la încărcare și după fiecare reset.
 * Intervalul de schimbare a mesajelor: `WELCOME_URGENCY_LINE_ROTATION_MS`.
 */
const WELCOME_URGENCY_TIMER_MIN_MINUTES = 8;
const WELCOME_URGENCY_TIMER_MAX_MINUTES = 15;
const WELCOME_URGENCY_LINE_ROTATION_MS = 5200;

function randomUrgencySeconds(): number {
  const min = WELCOME_URGENCY_TIMER_MIN_MINUTES * 60;
  const max = WELCOME_URGENCY_TIMER_MAX_MINUTES * 60;
  return min + Math.floor(Math.random() * (max - min));
}

/** Timer decorativ + mesaje rotative (marketing / gamificare) — sub zona principală Welcome */
function WelcomeUrgencyStrip() {
  const lines = texts.home.welcomeUrgencyGamifyLines;
  const [lineIndex, setLineIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(() => randomUrgencySeconds());

  useEffect(() => {
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          return randomUrgencySeconds();
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % lines.length);
    }, WELCOME_URGENCY_LINE_ROTATION_MS);
    return () => window.clearInterval(id);
  }, [lines.length]);

  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;
  const timeLabel = `${mm}:${String(ss).padStart(2, '0')}`;

  return (
    <div className="mt-8 w-full border-t border-border/60 pt-6 lg:mt-10">
      <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-muted/50 to-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5 sm:py-5">
        <div className="flex min-w-0 flex-1 gap-3 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Timer className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{texts.home.welcomeUrgencyKicker}</p>
            <motion.p
              key={lineIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28 }}
              className="mt-1 min-h-[2.85rem] text-sm leading-snug text-muted-foreground sm:min-h-0"
            >
              {lines[lineIndex]}
            </motion.p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl bg-card px-5 py-3 shadow-sm ring-1 ring-border/80">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {texts.home.welcomeUrgencyEndsIn}
          </span>
          <span className="font-mono text-3xl font-bold tabular-nums tracking-tight text-primary" aria-live="polite">
            {timeLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

const Welcome = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.user);
  const { enabled: tiersEnabled } = usePluginEnabled('tiers');
  const { data: tiersListData } = useQuery<{ loyaltyTiers: LoyaltyTierLite[] }>(GET_LOYALTY_TIERS, {
    fetchPolicy: 'cache-first',
    skip: isAuthenticated || !tiersEnabled,
  });

  const guestPreviewTiers: LoyaltyTierLite[] = (tiersListData?.loyaltyTiers ?? [])
    .slice()
    .sort((a, b) => (a.sortOrder ?? a.xpThreshold) - (b.sortOrder ?? b.xpThreshold))
    .slice(0, 3);

  useEffect(() => {
    prefetchHomeCatalogData(dispatch, 'welcome');
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:flex lg:min-h-screen lg:flex-row">
        <div className="bg-primary px-6 pb-12 pt-8 text-primary-foreground lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:justify-between lg:px-10 lg:py-10">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="flex flex-col items-center gap-3 text-center lg:gap-4"
            >
              {BRANDING_LOGO_URL ? (
                <img
                  src={BRANDING_LOGO_URL}
                  alt={texts.app.name}
                  className="h-16 w-auto max-w-[220px] object-contain object-center lg:h-28 lg:max-w-[280px]"
                  draggable={false}
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20 text-primary-foreground lg:h-16 lg:w-16">
                  <UtensilsCrossed className="h-7 w-7 lg:h-8 lg:w-8" strokeWidth={2} />
                </div>
              )}
              <p className="mt-1 w-full max-w-[220px] text-center text-[11px] leading-snug text-primary-foreground/80 lg:mt-2 lg:max-w-[280px] lg:text-sm">
                {texts.app.tagline}
              </p>
            </motion.div>

            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-3 text-primary-foreground lg:hidden">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary-foreground" aria-hidden />
              <p className="text-sm font-semibold leading-snug">
                {texts.home.heroGuestFomo} <span className="font-bold">{texts.home.heroGuestFomoReward}</span>
              </p>
            </div>
          </div>

          <WelcomeProductPeek />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="-mt-5 rounded-t-[20px] bg-card px-5 pb-6 pt-5 lg:mt-0 lg:flex lg:min-h-screen lg:flex-1 lg:flex-col lg:rounded-none lg:px-10 lg:py-[60px]"
        >
          <div className="w-full lg:mx-auto lg:max-w-[800px]">
            <p className="mb-4 text-xl font-medium text-card-foreground lg:text-3xl">{texts.home.welcomeTitle}</p>
            <div className="mb-4 border-b border-border/70 pb-4 lg:mb-6 lg:pb-6">
              <div className="flex items-start gap-3.5 lg:gap-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted/40 lg:h-16 lg:w-16">
                  <ShoppingCart className="h-6 w-6 text-primary lg:h-8 lg:w-8" />
                </div>
                <div>
                  <p className="text-base font-medium text-card-foreground lg:text-xl">{texts.home.welcomeStepOrderTitle}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground lg:text-base">{texts.home.heroHowPointsWork}</p>
                </div>
              </div>
            </div>

            <div className="mb-4 border-b border-border/70 pb-4 lg:mb-6 lg:pb-6">
              <div className="flex items-start gap-3.5 lg:gap-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted/40 lg:h-16 lg:w-16">
                  <Gift className="h-6 w-6 text-primary lg:h-8 lg:w-8" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-medium text-card-foreground lg:text-xl">{texts.home.welcomeStepRanksTitle}</p>
                  <p className="mb-2 text-sm leading-relaxed text-muted-foreground lg:text-base">{texts.home.heroGuestFreeProductsHint}</p>
                  {guestPreviewTiers.length > 0 && (
                    <div className="hidden grid-cols-[50px_1fr_28px_1fr_28px] items-center gap-x-1 lg:grid lg:grid-cols-[80px_1fr_42px_1fr_42px] lg:gap-x-3">
                      <div className="flex flex-col items-center gap-1 text-center">
                        <TierIcon badgeIcon={guestPreviewTiers[0].badgeIcon} tierLabel={guestPreviewTiers[0].name} size={24} />
                        <p className="text-[10px] font-semibold leading-tight text-card-foreground lg:text-xs">{guestPreviewTiers[0].name}</p>
                      </div>
                      <div className="h-[2px] w-full rounded-full bg-border lg:h-[3px]" />
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border/70 bg-muted/20 lg:h-11 lg:w-11">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground/90 lg:h-5 lg:w-5" />
                      </div>
                      <div className="h-[2px] w-full rounded-full bg-border lg:h-[3px]" />
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border/70 bg-muted/20 lg:h-11 lg:w-11">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground/90 lg:h-5 lg:w-5" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-5 lg:mb-7">
              <div className="flex items-start gap-3.5 lg:gap-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted/40 lg:h-16 lg:w-16">
                  <TrendingUp className="h-6 w-6 text-primary lg:h-8 lg:w-8" />
                </div>
                <div>
                  <p className="text-base font-medium text-card-foreground lg:text-xl">{texts.home.welcomeStepAdvanceTitle}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground lg:text-base">{texts.home.heroHowRanksWork}</p>
                </div>
              </div>
            </div>

            <div className="mb-4 hidden items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-3 text-card-foreground lg:mb-6 lg:flex lg:px-4 lg:py-4">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary lg:h-6 lg:w-6" aria-hidden />
              <p className="text-sm font-semibold leading-snug lg:text-base">
                {texts.home.heroGuestFomo} <span className="font-bold text-primary">{texts.home.heroGuestFomoReward}</span>
              </p>
            </div>

            <div className="mx-auto grid w-full max-w-[360px] grid-cols-1 gap-2.5 lg:max-w-[560px] lg:grid-cols-2">
              {!isAuthenticated ? (
                <>
                  <Button asChild size="sm" className="h-11 w-full rounded-full bg-primary font-medium text-primary-foreground hover:bg-primary/90 lg:h-12">
                    <Link to={routes.login} className="flex items-center justify-center gap-2">
                      {texts.home.welcomeRegisterNow}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>

                  <Button
                    type="button"
                    onClick={() => navigate(routes.home)}
                    size="sm"
                    variant="outline"
                    className="h-11 w-full rounded-full border-border bg-transparent font-medium text-card-foreground hover:bg-muted/30 lg:h-12"
                  >
                    {texts.home.enterStore}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  onClick={() => navigate(routes.home)}
                  size="sm"
                  className="h-11 w-full rounded-full bg-primary font-medium text-primary-foreground hover:bg-primary/90 lg:col-span-2 lg:h-12"
                >
                  {texts.home.enterStore}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>

            <WelcomeUrgencyStrip />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Welcome;
