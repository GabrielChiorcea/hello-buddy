import { Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { texts } from '@/config/texts';

export interface MyCoupon {
  id: string;
  status: 'active' | 'used' | 'expired';
  expiresAt?: string | null;
  coupon: {
    id: string;
    title: string;
    discountPercent: number;
    targetProductId?: string | null;
    targetProductName?: string | null;
  };
}

interface CouponsCheckoutSelectorProps {
  coupons: MyCoupon[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  cartProductIds?: string[];
  currency?: string;
}

export function CouponsCheckoutSelector({ coupons, selectedIds, onChange, cartProductIds = [] }: CouponsCheckoutSelectorProps) {
  const cartProductIdSet = new Set(cartProductIds);
  const activeCoupons = coupons.filter((c) => c.status === 'active');
  const visibleCoupons = activeCoupons.filter((c) => {
    const targetId = c.coupon.targetProductId;
    if (!targetId) return true;
    return cartProductIdSet.has(targetId);
  });
  if (activeCoupons.length === 0) return null;

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((v) => v !== id));
      return;
    }
    onChange([...selectedIds, id]);
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Ticket className="h-4 w-4" />
          {texts.checkout.activeCouponsTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {visibleCoupons.length === 0 && (
          <p className="text-xs text-muted-foreground">
            {texts.checkout.noEligibleCouponsForCart}
          </p>
        )}
        {visibleCoupons.map((c) => {
          const selected = selectedIds.includes(c.id);
          return (
            <Button
              key={c.id}
              type="button"
              variant={selected ? 'default' : 'outline'}
              className="w-full justify-between"
              onClick={() => toggle(c.id)}
            >
              <span className="truncate">{c.coupon.title}</span>
              <span>
                -{c.coupon.discountPercent}%{' '}
                {c.coupon.targetProductName ? `(${texts.checkout.couponForProduct.replace('{product}', c.coupon.targetProductName)})` : ''}
              </span>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}

