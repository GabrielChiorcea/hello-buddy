import { Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface MyCoupon {
  id: string;
  status: 'active' | 'used' | 'expired';
  expiresAt?: string | null;
  coupon: {
    id: string;
    title: string;
    discountPercent: number;
    targetProductName?: string | null;
  };
}

interface CouponsCheckoutSelectorProps {
  coupons: MyCoupon[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  currency?: string;
}

export function CouponsCheckoutSelector({ coupons, selectedIds, onChange }: CouponsCheckoutSelectorProps) {
  const activeCoupons = coupons.filter((c) => c.status === 'active');
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
          Cupoane active
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {activeCoupons.map((c) => {
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
              <span>-{c.coupon.discountPercent}% {c.coupon.targetProductName ? `(${c.coupon.targetProductName})` : ''}</span>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}

