import { useMutation, useQuery } from '@apollo/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GET_COUPONS_CATALOG, GET_CURRENT_USER, GET_MY_COUPONS } from '@/graphql/queries';
import { ACTIVATE_COUPON } from '@/graphql/mutations';
import { toast } from '@/hooks/use-toast';
import { getImageUrl } from '@/lib/imageUrl';

interface Coupon {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  discountPercent: number;
  pointsCost: number;
  requiredTierId?: string | null;
  requiredTierName?: string | null;
  targetProductName?: string | null;
}

interface MyCouponWalletEntry {
  id: string;
  couponId: string;
  status: 'active' | 'used' | 'expired';
}

export default function CouponsPage() {
  const { data } = useQuery<{ couponsCatalog: Coupon[] }>(GET_COUPONS_CATALOG);
  const { data: me } = useQuery(GET_CURRENT_USER);
  const { data: myCouponsData } = useQuery<{ myCoupons: MyCouponWalletEntry[] }>(GET_MY_COUPONS);
  const [activateCoupon, { loading }] = useMutation(ACTIVATE_COUPON, {
    refetchQueries: [{ query: GET_MY_COUPONS }, { query: GET_CURRENT_USER }],
  });

  const user = me?.currentUser;
  const points = Number(user?.pointsBalance ?? 0);
  const userTierId: string | null = user?.tier?.id ?? null;
  const coupons = data?.couponsCatalog ?? [];
  const activeCouponIds = new Set(
    (myCouponsData?.myCoupons ?? [])
      .filter((entry) => entry.status === 'active')
      .map((entry) => entry.couponId)
  );

  const handleActivate = async (couponId: string) => {
    if (!user?.id) {
      toast({ title: 'Autentificare necesară', description: 'Conectează-te pentru a activa cupoane', variant: 'destructive' });
      return;
    }
    try {
      const result = await activateCoupon({ variables: { couponId } });
      if ((result?.errors?.length ?? 0) > 0 || !result?.data?.activateCoupon) {
        const firstError = result?.errors?.[0]?.message;
        throw new Error(firstError || 'Nu s-a putut activa cuponul');
      }
      toast({ title: 'Cupon activat', description: 'Cuponul a fost adăugat în portofel' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Nu s-a putut activa cuponul';
      toast({ title: 'Eroare', description: message, variant: 'destructive' });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Cupoane</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((coupon) => {
            const missingPoints = Math.max(0, coupon.pointsCost - points);
            const tierBlocked = coupon.requiredTierId && coupon.requiredTierId !== userTierId;
            const alreadyActive = activeCouponIds.has(coupon.id);
            const canActivate = !!user?.id && missingPoints === 0 && !tierBlocked && !alreadyActive;
            const reason = !user?.id
              ? 'Autentifică-te pentru activare'
              : missingPoints > 0
                ? `Îți lipsesc ${missingPoints} puncte`
                : tierBlocked
                  ? `Necesită rangul ${coupon.requiredTierName ?? 'superior'}`
                  : alreadyActive
                    ? 'Cupon deja activ în portofel'
                  : null;
            return (
              <Card
                key={coupon.id}
                className="flex flex-row items-stretch rounded-xl bg-card overflow-hidden transition-all group p-0 shadow-[0_2px_16px_-2px_hsl(var(--primary)/0.15)] hover:shadow-[0_4px_24px_-4px_hsl(var(--primary)/0.25)] border border-primary/20 hover:border-primary/40"
              >
                {coupon.imageUrl && (
                  <div className="relative w-1/2 min-h-[180px] shrink-0 overflow-hidden">
                    <img
                      src={getImageUrl(coupon.imageUrl)}
                      alt={coupon.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {coupon.targetProductName && (
                      <span className="absolute left-2 top-2 text-[10px] inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold bg-card/90 backdrop-blur-md border-0">
                        {coupon.targetProductName}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex w-1/2 min-w-0 flex-col justify-between p-4">
                  <CardHeader className="p-0">
                    <CardTitle className="font-bold text-foreground text-sm md:text-[15px] truncate">
                      {coupon.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 mt-1 space-y-1.5">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {coupon.description || 'Reducere la produs țintă'}
                    </p>
                    <p className="text-sm font-medium">
                      Reducere: -{coupon.discountPercent}% {coupon.targetProductName ? `la ${coupon.targetProductName}` : ''}
                    </p>
                    <p className="text-sm">Cost: {coupon.pointsCost} puncte</p>
                    {reason && <p className="text-xs text-muted-foreground">{reason}</p>}
                    <Button
                      className="w-full mt-2 md:mt-2.5"
                      disabled={!canActivate || loading}
                      onClick={() => handleActivate(coupon.id)}
                    >
                      {alreadyActive ? 'Deja activat' : 'Activează cuponul'}
                    </Button>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}

