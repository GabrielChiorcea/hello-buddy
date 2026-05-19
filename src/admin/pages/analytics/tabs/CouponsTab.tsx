import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, Percent, CheckCircle, TrendingUp } from 'lucide-react';
import { texts } from '@/config/texts';
import { useAdminApi } from '@/admin/hooks/useAdminApi';
import type { CouponsAnalytics } from '../types';
import { KpiCard } from '../shared/KpiCard';
import { formatCurrency } from '../format';

const t = texts.analytics;

export function CouponsTab({ period }: { period: string }) {
  const { getCouponsAnalyticsAdmin } = useAdminApi();
  const [data, setData] = useState<CouponsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCouponsAnalyticsAdmin(period)
      .then(res => {
        if (!cancelled) setData(res as CouponsAnalytics);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period, getCouponsAnalyticsAdmin]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">{texts.common.loading}</div>;
  }
  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">{t.noData}</div>;
  }

  const kpis = [
    {
      title: t.couponsTotalDiscount,
      value: formatCurrency(data.totalDiscount),
      icon: Percent,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
    {
      title: t.couponsActivated,
      value: data.totalActivated.toLocaleString('ro-RO'),
      icon: Ticket,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: t.couponsUsed,
      value: data.totalUsed.toLocaleString('ro-RO'),
      icon: CheckCircle,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      title: t.couponsUsageRate,
      value: `${(data.usageRate * 100).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-chart-3',
      bg: 'bg-chart-3/10',
    },
  ];

  return (
    <>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map(k => (
          <KpiCard key={k.title} {...k} />
        ))}
      </div>

      {data.topActivated?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Ticket className="h-4 w-4 text-primary" />
              {t.couponsTopActivated}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {data.topActivated.map((row, i) => (
                <div key={row.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-medium text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                    <span className="font-medium truncate">{row.title}</span>
                  </div>
                  <span className="text-muted-foreground shrink-0 ml-3">
                    {Number(row.activations).toLocaleString('ro-RO')} {t.activations}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
