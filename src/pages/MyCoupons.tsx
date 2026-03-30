import { useQuery } from '@apollo/client';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GET_MY_COUPONS } from '@/graphql/queries';

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
  if (status === 'active') return 'Activ';
  if (status === 'used') return 'Folosit';
  return 'Expirat';
}

export default function MyCouponsPage() {
  const { data } = useQuery<{ myCoupons: MyCoupon[] }>(GET_MY_COUPONS);
  const coupons = data?.myCoupons ?? [];

  return (
    <ProtectedRoute>
      <Layout>
        <div className="container mx-auto px-4 py-8 space-y-6">
          <h1 className="text-3xl font-bold">My Coupons</h1>
          <div className="space-y-4">
            {coupons.length === 0 && <p className="text-muted-foreground">Nu ai cupoane activate încă.</p>}
            {coupons.map((entry) => (
              <Card key={entry.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{entry.coupon.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">Reducere: -{entry.coupon.discountPercent}% {entry.coupon.targetProductName ? `la ${entry.coupon.targetProductName}` : ''}</p>
                  <p className="text-sm">Status: {formatCouponStatus(entry.status)}</p>
                  <p className="text-xs text-muted-foreground">Activat la: {new Date(entry.activatedAt).toLocaleString()}</p>
                  {entry.usedAt && (
                    <p className="text-xs text-muted-foreground">Folosit la: {new Date(entry.usedAt).toLocaleString()}</p>
                  )}
                  {entry.expiresAt && <p className="text-xs text-muted-foreground">Expiră la: {new Date(entry.expiresAt).toLocaleString()}</p>}
                  {entry.status === 'used' && (
                    <p className="text-xs text-muted-foreground">
                      Pentru o nouă comandă, activează din nou cuponul din pagina Cupoane.
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

