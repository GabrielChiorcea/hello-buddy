import { useMutation, useQuery } from '@apollo/client';
import { Lock, Sparkles, Ticket } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GET_COUPONS_CATALOG, GET_CURRENT_USER, GET_LOYALTY_TIERS, GET_MY_COUPONS } from '@/graphql/queries';
import { ACTIVATE_COUPON } from '@/graphql/mutations';
import { toast } from '@/hooks/use-toast';
import { getImageUrl } from '@/lib/imageUrl';
import { texts } from '@/config/texts';
import { useAppDispatch } from '@/store';
import { useAppSelector } from '@/store';
import { fetchActiveCouponDiscounts } from '@/store/slices/productsSlice';

interface Coupon {
  id: string;
  title: string;
  imageUrl?: string | null;
  discountPercent: number;
  pointsCost: number;
  requiredTierId?: string | null;
  requiredTierName?: string | null;
  targetProductName?: string | null;
}

interface LoyaltyTier {
  id: string;
  name: string;
  xpThreshold: number;
}

interface MyCouponWalletEntry {
  id: string;
  couponId: string;
  status: 'active' | 'used' | 'expired';
}

export default function CouponsPage() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const { data } = useQuery<{ couponsCatalog: Coupon[] }>(GET_COUPONS_CATALOG);
  const { data: me } = useQuery(GET_CURRENT_USER);
  const { data: tiersData } = useQuery<{ loyaltyTiers: LoyaltyTier[] }>(GET_LOYALTY_TIERS);
  const { data: myCouponsData } = useQuery<{ myCoupons: MyCouponWalletEntry[] }>(GET_MY_COUPONS, {
    skip: !isAuthenticated,
  });
  const [activateCoupon, { loading }] = useMutation(ACTIVATE_COUPON, {
    refetchQueries: [{ query: GET_MY_COUPONS }, { query: GET_CURRENT_USER }],
  });

  const user = me?.currentUser;
  const userTierId: string | null = user?.tier?.id ?? null;
  const tiers = tiersData?.loyaltyTiers ?? [];
  const tierNameById = new Map(tiers.map((tier) => [tier.id, tier.name]));
  const tierThresholdById = new Map(tiers.map((tier) => [tier.id, Number(tier.xpThreshold) || 0]));
  const points = Number(user?.pointsBalance ?? 0);
  const coupons = data?.couponsCatalog ?? [];
  const activeCouponIds = new Set(
    (myCouponsData?.myCoupons ?? [])
      .filter((entry) => entry.status === 'active')
      .map((entry) => entry.couponId)
  );

  const handleActivate = async (couponId: string) => {
    if (!user?.id) {
      toast({
        title: texts.coupons.loginRequiredTitle,
        description: texts.coupons.loginRequiredDescription,
        variant: 'destructive',
      });
      return;
    }
    try {
      const result = await activateCoupon({ variables: { couponId } });
      if ((result?.errors?.length ?? 0) > 0 || !result?.data?.activateCoupon) {
        const firstError = result?.errors?.[0]?.message;
        throw new Error(firstError || texts.coupons.activateErrorDescription);
      }
      toast({
        title: texts.coupons.activateSuccessTitle,
        description: texts.coupons.activateSuccessDescription,
      });
      dispatch(fetchActiveCouponDiscounts());
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : texts.coupons.activateErrorDescription;
      toast({ title: texts.common.error, description: message, variant: 'destructive' });
    }
  };

  return (
    <Layout>
      <section className="py-10 md:py-14 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-4 text-sm font-bold text-primary">
              <Ticket className="h-4 w-4" />
              <Sparkles className="h-3 w-3" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">
              {texts.coupons.pageTitle}
            </h1>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4 space-y-6">
          {user?.id && (
            <div className="inline-flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-muted px-4 py-1.5 text-sm font-semibold text-foreground">
                Rang: {user?.tier?.name || '-'}
              </span>
              <span className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">
                Puncte: {points}
              </span>
            </div>
          )}
          {coupons.length === 0 ? (
            <p className="text-muted-foreground">{texts.coupons.emptyCatalog}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coupons.map((coupon) => {
                const missingPoints = Math.max(0, coupon.pointsCost - points);
                const alreadyActive = activeCouponIds.has(coupon.id);
                const hasRequiredTier = (() => {
                  if (!coupon.requiredTierId) return true;
                  if (!userTierId) return false;
                  if (userTierId === coupon.requiredTierId) return true;
                  const userThreshold = tierThresholdById.get(userTierId);
                  const requiredThreshold = tierThresholdById.get(coupon.requiredTierId);
                  if (userThreshold == null || requiredThreshold == null) return false;
                  return userThreshold >= requiredThreshold;
                })();
                const isTierLocked = !!coupon.requiredTierId && !hasRequiredTier;
                const requiredTierLabel = coupon.requiredTierName
                  || (coupon.requiredTierId ? tierNameById.get(coupon.requiredTierId) : undefined)
                  || '';
                const canActivate = !!user?.id && missingPoints === 0 && !alreadyActive && !isTierLocked;
                const reason = missingPoints > 0
                  ? texts.coupons.missingPoints.replace('{points}', String(missingPoints))
                  : alreadyActive
                    ? texts.coupons.alreadyActive
                    : null;
                return (
                  <Card
                    key={coupon.id}
                    className="relative flex flex-row items-stretch rounded-xl bg-card overflow-hidden transition-all group p-0 shadow-[0_2px_16px_-2px_hsl(var(--primary)/0.15)] hover:shadow-[0_4px_24px_-4px_hsl(var(--primary)/0.25)] border border-primary/20 hover:border-primary/40"
                  >
                    <div className="pointer-events-none absolute left-1/2 top-3 bottom-3 -translate-x-1/2 border-l-2 border-dashed border-primary z-10" />
                    <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-primary" />
                    <div className="pointer-events-none absolute left-1/2 bottom-0 z-10 h-5 w-5 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary ring-2 ring-primary" />
                    {coupon.imageUrl && (
                      <div className="relative w-1/2 min-h-[180px] shrink-0 overflow-hidden">
                        <img
                          src={getImageUrl(coupon.imageUrl)}
                          alt={coupon.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                    <div className="flex w-1/2 min-w-0 flex-col justify-between p-4">
                      <CardHeader className="p-0">
                        <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary text-primary-foreground text-sm font-black leading-none shadow-sm">
                          {coupon.discountPercent}%
                        </div>
                        <CardTitle className="font-bold text-foreground text-sm md:text-[15px] truncate">
                          {coupon.targetProductName || coupon.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 mt-1 space-y-1.5">
                        {isTierLocked ? (
                          <div className="mt-2 space-y-2">
                            <div className="inline-flex w-full items-center justify-center rounded-full bg-muted px-4 py-1.5 text-sm font-semibold text-foreground">
                              {requiredTierLabel}
                            </div>
                            <div className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-white shadow-sm">
                              <Lock className="h-4 w-4 shrink-0 text-white" />
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm">{texts.coupons.costLabel.replace('{points}', String(coupon.pointsCost))}</p>
                            {reason && <p className="text-xs text-muted-foreground">{reason}</p>}
                            <Button
                              className="w-full mt-2 md:mt-2.5"
                              disabled={!canActivate || loading}
                              onClick={() => handleActivate(coupon.id)}
                            >
                              {alreadyActive ? texts.coupons.alreadyActivatedButton : texts.coupons.activateButton}
                            </Button>
                          </>
                        )}
                      </CardContent>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

