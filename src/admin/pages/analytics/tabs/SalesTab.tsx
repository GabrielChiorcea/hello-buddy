import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts';
import {
  Crown, Link2, Truck, MapPin, TrendingUp, TrendingDown,
  DollarSign, ShoppingCart, Receipt, Clock, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { texts } from '@/config/texts';
import type { AnalyticsData, ProductPairRow } from '../types';
import { KpiCard } from '../shared/KpiCard';
import {
  formatCurrency,
  formatHour,
  formatAnalyticsDateShort,
  formatAnalyticsDateLong,
  chartTooltipStyle,
} from '../format';
import { chartSeriesColor } from '../chartColors';

const t = texts.analytics;

export function SalesTab({
  data,
  productPairs,
  pairsLoading,
}: {
  data: AnalyticsData;
  productPairs: ProductPairRow[];
  pairsLoading: boolean;
}) {
  const { salesKpis: kpi } = data;
  const totalRevenue = data.revenueByCategory.reduce((s, c) => s + c.revenue, 0);
  const totalFulfillment = data.fulfillmentTotals.reduce((s, f) => s + f.count, 0);
  const revenueStroke = chartSeriesColor(1);

  const kpiCards = [
    { title: t.grossRevenue, value: formatCurrency(kpi.grossRevenue), icon: DollarSign, color: 'text-success', bg: 'bg-success/10' },
    { title: t.netProfitPerOrder, value: formatCurrency(kpi.netProfitPerOrder), icon: Receipt, color: 'text-chart-3', bg: 'bg-chart-3/10' },
    { title: t.aov, value: formatCurrency(kpi.aov), icon: ShoppingCart, color: 'text-chart-4', bg: 'bg-chart-4/10' },
    {
      title: t.revenueGrowthRate,
      value: `${kpi.revenueGrowthRate > 0 ? '+' : ''}${kpi.revenueGrowthRate}%`,
      icon: kpi.revenueGrowthRate >= 0 ? TrendingUp : TrendingDown,
      color: kpi.revenueGrowthRate >= 0 ? 'text-success' : 'text-destructive',
      bg: kpi.revenueGrowthRate >= 0 ? 'bg-success/10' : 'bg-destructive/10',
      subtitle: t.vsPreviousPeriod,
    },
    { title: t.totalDeliveryFees, value: formatCurrency(kpi.totalDeliveryFees), icon: Truck, color: 'text-warning', bg: 'bg-warning/10' },
    { title: t.totalOrders, value: kpi.totalOrders.toLocaleString('ro-RO'), icon: ShoppingCart, color: 'text-primary', bg: 'bg-primary/10' },
    { title: t.cancellationRate, value: `${kpi.cancellationRate}%`, icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', subtitle: `${kpi.cancelledOrders} ${t.cancelledOrders}` },
  ];

  return (
    <>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpiCards.map(card => (
          <KpiCard key={card.title} {...card} />
        ))}
      </div>

      {data.dailyRevenueTrend.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {t.dailyRevenueTrend}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer>
                <AreaChart data={data.dailyRevenueTrend}>
                  <defs>
                    <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={revenueStroke} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={revenueStroke} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" tickFormatter={formatAnalyticsDateShort} className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    labelFormatter={formatAnalyticsDateLong}
                    formatter={(v: number) => [formatCurrency(v), t.revenue]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke={revenueStroke} fillOpacity={1} fill="url(#fillRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {data.peakHours.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              {t.peakHours}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer>
                <BarChart data={data.peakHours}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="hour" tickFormatter={formatHour} className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    labelFormatter={v => formatHour(v as number)}
                    formatter={(v: number, name: string) => [name === 'orders' ? v : formatCurrency(v), name === 'orders' ? t.orders : t.revenue]}
                  />
                  <Bar dataKey="orders" fill={chartSeriesColor(2)} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {t.salesByCategory}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.revenueByCategory.length > 0 ? (
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="h-[220px] w-[220px] shrink-0">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={data.revenueByCategory}
                        dataKey="revenue"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={3}
                        strokeWidth={2}
                        stroke="hsl(var(--card))"
                      >
                        {data.revenueByCategory.map((_, i) => (
                          <Cell key={i} fill={chartSeriesColor(i)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [formatCurrency(value), t.revenue]} contentStyle={chartTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2 w-full">
                  {data.revenueByCategory.map((cat, i) => {
                    const pct = totalRevenue > 0 ? (cat.revenue / totalRevenue * 100).toFixed(1) : '0';
                    return (
                      <div key={cat.category} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: chartSeriesColor(i) }} />
                          <span className="text-foreground">{cat.category}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground text-xs">{pct}%</span>
                          <span className="font-medium text-foreground min-w-[80px] text-right">{formatCurrency(cat.revenue)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">{t.noData}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              {t.fulfillmentDeliveryVsInLocation}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalFulfillment > 0 ? (
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="h-[220px] w-[220px] shrink-0">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={data.fulfillmentTotals}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={4}
                        strokeWidth={2}
                        stroke="hsl(var(--card))"
                      >
                        <Cell fill={chartSeriesColor(2)} />
                        <Cell fill={chartSeriesColor(0)} />
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [value, name === 'delivery' ? t.delivery : t.inLocation]}
                        contentStyle={chartTooltipStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-4 w-full">
                  {data.fulfillmentTotals.map(f => {
                    const pct = totalFulfillment > 0 ? (f.count / totalFulfillment * 100).toFixed(1) : '0';
                    const isDelivery = f.type === 'delivery';
                    return (
                      <div key={f.type} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg',
                            isDelivery ? 'bg-primary/15 text-primary' : 'bg-warning/15 text-warning',
                          )}
                        >
                          {isDelivery ? <Truck className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground">{isDelivery ? t.delivery : t.inLocation}</div>
                          <div className="text-xs text-muted-foreground">
                            {f.count} {t.orders} · {formatCurrency(f.revenue)}
                          </div>
                        </div>
                        <span className="text-lg font-bold text-foreground">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">{t.noData}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-4 w-4 text-warning" />
              {t.topCustomers}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.topCustomers.length > 0 ? (
              <div className="divide-y divide-border">
                {data.topCustomers.map((customer, idx) => (
                  <div key={customer.id} className="flex items-center gap-3 px-6 py-3">
                    <div
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                        idx === 0 && 'bg-warning/15 text-warning',
                        idx === 1 && 'bg-muted text-muted-foreground',
                        idx === 2 && 'bg-chart-5/15 text-chart-5',
                        idx > 2 && 'bg-muted text-muted-foreground',
                      )}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{customer.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {customer.ordersCount} {t.orders} · media {customer.avgOrder.toFixed(0)} RON
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-foreground shrink-0">{formatCurrency(customer.totalSpent)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">{t.noData}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              {t.frequentlyOrderedTogether}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {pairsLoading ? (
              <div className="px-6 py-8 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            ) : productPairs.length > 0 ? (
              <div className="divide-y divide-border">
                {productPairs.map((pair, idx) => {
                  const maxCount = productPairs[0]?.pairCount || 1;
                  const pct = (pair.pairCount / maxCount) * 100;
                  return (
                    <div key={idx} className="px-6 py-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm min-w-0">
                          <span className="font-medium text-foreground truncate">{pair.productA}</span>
                          <span className="text-muted-foreground/50">+</span>
                          <span className="font-medium text-foreground truncate">{pair.productB}</span>
                        </div>
                        <Badge variant="secondary" className="shrink-0 ml-2">{pair.pairCount}x</Badge>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">{t.noData}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
