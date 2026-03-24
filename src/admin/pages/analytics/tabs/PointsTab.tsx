import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Star, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { texts } from '@/config/texts';
import type { PointsAnalytics } from '../types';
import { KpiCard } from '../shared/KpiCard';
import {
  formatCurrency,
  formatAnalyticsDateShort,
  formatAnalyticsMonthDay,
  chartTooltipStyle,
} from '../format';
import { chartSeriesColor } from '../chartColors';

const t = texts.analytics;

export function PointsTab({ data }: { data: PointsAnalytics }) {
  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">{t.noData}</div>;
  }

  const kpis = [
    { title: t.pointsEarned, value: data.totalEarned.toLocaleString('ro-RO'), icon: Star, color: 'text-warning', bg: 'bg-warning/10' },
    { title: t.pointsSpent, value: data.totalSpent.toLocaleString('ro-RO'), icon: Star, color: 'text-chart-4', bg: 'bg-chart-4/10' },
    {
      title: t.redemptionRate,
      value: `${data.redemptionRate}%`,
      icon: TrendingUp,
      color: 'text-success',
      bg: 'bg-success/10',
      subtitle: `${data.redemptionsCount} ${t.redemptions}`,
    },
    { title: t.totalDiscountFromPoints, value: formatCurrency(data.totalDiscount), icon: DollarSign, color: 'text-destructive', bg: 'bg-destructive/10' },
    { title: t.aovWithPoints, value: formatCurrency(data.aovWithPoints), icon: ShoppingCart, color: 'text-chart-3', bg: 'bg-chart-3/10' },
    { title: t.aovWithoutPoints, value: formatCurrency(data.aovWithoutPoints), icon: ShoppingCart, color: 'text-muted-foreground', bg: 'bg-muted' },
  ];

  return (
    <>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        {kpis.map(k => (
          <KpiCard key={k.title} {...k} />
        ))}
      </div>

      {data.trend.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t.pointsTrend}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer>
                <LineChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" tickFormatter={formatAnalyticsDateShort} className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={chartTooltipStyle} labelFormatter={formatAnalyticsMonthDay} />
                  <Legend formatter={v => (v === 'earned' ? t.earned : t.spent)} />
                  <Line type="monotone" dataKey="earned" stroke={chartSeriesColor(1)} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="spent" stroke={chartSeriesColor(3)} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {data.topEarners.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-warning" />
              {t.topPointsEarners}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {data.topEarners.map((u, idx) => (
                <div key={u.id} className="flex items-center gap-3 px-6 py-3">
                  <div
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      idx < 3 ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{u.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.balance}: {u.balance} · {t.spent}: {u.spent}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {u.earned} {t.earned.toLowerCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
