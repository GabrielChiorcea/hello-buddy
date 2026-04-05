import { useQuery } from '@apollo/client';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GET_MY_COUPONS } from '@/graphql/queries';
import { texts } from '@/config/texts';

interface MyCoupon {
  id: string;
  status: 'active' | 'used' | 'expired';
  activatedAt: string;
  expiresAt?: string | null;
  usedAt?: string | null;
  coupon: {
    title: string;
    imageUrl?: string | null;
    discountPercent: number;
    targetProductName?: string | null;
  };
}

function formatCouponStatus(status: MyCoupon['status']): string {
  if (status === 'active') return texts.myCoupons.statusActive;
  if (status === 'used') return texts.myCoupons.statusUsed;
  return texts.myCoupons.statusExpired;
}

export default function MyCouponsPage() {
  const { data } = useQuery<{ myCoupons: MyCoupon[] }>(GET_MY_COUPONS);
  const coupons = data?.myCoupons ?? [];

  return (
    <ProtectedRoute>
      <Layout>
        <div className="container mx-auto px-4 py-8 space-y-6">
          <h1 className="text-3xl font-bold">{texts.myCoupons.pageTitle}</h1>
          <div className="space-y-4">
            {coupons.length === 0 && <p className="text-muted-foreground">{texts.myCoupons.empty}</p>}
            {coupons.map((entry) => (
              <Card key={entry.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{entry.coupon.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">{texts.myCoupons.discountLabel} -{entry.coupon.discountPercent}% {entry.coupon.targetProductName ? texts.myCoupons.forProduct.replace('{product}', entry.coupon.targetProductName) : ''}</p>
                  <p className="text-sm">{texts.myCoupons.statusLabel} {formatCouponStatus(entry.status)}</p>
                  <p className="text-xs text-muted-foreground">{texts.myCoupons.activatedAtLabel} {new Date(entry.activatedAt).toLocaleString()}</p>
                  {entry.usedAt && (
                    <p className="text-xs text-muted-foreground">{texts.myCoupons.usedAtLabel} {new Date(entry.usedAt).toLocaleString()}</p>
                  )}
                  {entry.expiresAt && <p className="text-xs text-muted-foreground">{texts.myCoupons.expiresAtLabel} {new Date(entry.expiresAt).toLocaleString()}</p>}
                  {entry.status === 'used' && (
                    <p className="text-xs text-muted-foreground">
                      {texts.myCoupons.usedHint}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

