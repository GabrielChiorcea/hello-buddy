/**
 * Pagina AdminAnalytics — analitice avansate
 */

import { useEffect, useState, useCallback } from 'react';
import { useAdminApi } from '@/admin/hooks/useAdminApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area,
} from 'recharts';
import {
  Crown, Link2, Truck, MapPin, TrendingUp, TrendingDown,
  DollarSign, ShoppingCart, Receipt, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { texts } from '@/config/texts';

const t = texts.analytics;

interface SalesKpis {
  grossRevenue: number;
  totalOrders: number;
  aov: number;
  netProfitPerOrder: number;
  revenueGrowthRate: number;
  totalDeliveryFees: number;
}

interface AnalyticsData {
  period: string;
  salesKpis: SalesKpis;
  topCustomers: { id: string; name: string; ordersCount: number; totalSpent: number; avgOrder: number; lastOrderAt: string }[];
  productPairs: { productA: string; productB: string; pairCount: number }[];
  revenueByCategory: { category: string; ordersCount: number; itemsSold: number; revenue: number }[];
  fulfillmentSplit: { weekStart: string; delivery: number; inLocation: number; total: number }[];
  fulfillmentTotals: { type: string; count: number; revenue: number }[];
}

const CHART_COLORS = [
  'hsl(16, 90%, 50%)',
  'hsl(142, 76%, 36%)',
  'hsl(221, 83%, 53%)',
  'hsl(262, 83%, 58%)',
  'hsl(45, 93%, 47%)',
  'hsl(340, 75%, 55%)',
  'hsl(180, 60%, 45%)',
  'hsl(30, 80%, 55%)',
];

const periods = [
  { label: '7 zile', value: '7d' },
  { label: '30 zile', value: '30d' },
  { label: '90 zile', value: '90d' },
];

function formatCurrency(val: number) {
  return val.toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' RON';
}

export default function AdminAnalytics() {
  const { getAnalytics } = useAdminApi();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAnalytics(period);
      setData(result as AnalyticsData);
    } catch {
      toast({ title: 'Eroare', description: 'Nu s-au putut încărca analiticele', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [getAnalytics, period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (isLoading) return <AnalyticsSkeleton />;
  if (!data) return <div className="text-center text-muted-foreground py-12">{t.noData}</div>;

  const { salesKpis: kpi } = data;
  const totalRevenue = data.revenueByCategory.reduce((s, c) => s + c.revenue, 0);
  const totalFulfillment = data.fulfillmentTotals.reduce((s, f) => s + f.count, 0);

  const kpiCards = [
    {
      title: t.grossRevenue,
      value: formatCurrency(kpi.grossRevenue),
      icon: DollarSign,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      title: t.netProfitPerOrder,
      value: formatCurrency(kpi.netProfitPerOrder),
      icon: Receipt,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: t.aov,
      value: formatCurrency(kpi.aov),
      icon: ShoppingCart,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      title: t.revenueGrowthRate,
      value: `${kpi.revenueGrowthRate > 0 ? '+' : ''}${kpi.revenueGrowthRate}%`,
      icon: kpi.revenueGrowthRate >= 0 ? TrendingUp : TrendingDown,
      color: kpi.revenueGrowthRate >= 0 ? 'text-emerald-500' : 'text-red-500',
      bg: kpi.revenueGrowthRate >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
      subtitle: t.vsPreviousPeriod,
    },
    {
      title: t.totalDeliveryFees,
      value: formatCurrency(kpi.totalDeliveryFees),
      icon: Truck,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      title: t.totalOrders,
      value: kpi.totalOrders.toLocaleString('ro-RO'),
      icon: ShoppingCart,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{t.subtitle}</p>
        </div>
        <div className="flex gap-1.5 bg-muted rounded-lg p-1">
          {periods.map(p => (
            <Button
              key={p.value}
              variant={period === p.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod(p.value)}
              className={cn('text-xs', period !== p.value && 'text-muted-foreground')}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        {kpiCards.map(card => (
          <Card key={card.title} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground truncate">{card.title}</p>
                  <p className="text-xl font-bold text-foreground tracking-tight">{card.value}</p>
                  {card.subtitle && (
                    <p className="text-[11px] text-muted-foreground">{card.subtitle}</p>
                  )}
                </div>
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', card.bg)}>
                  <card.icon className={cn('h-4 w-4', card.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 1: Venituri pe categorie + Fulfillment donut */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Venituri pe categorie — Pie chart */}
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
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={95}
                        paddingAngle={3}
                        strokeWidth={2}
                        stroke="hsl(var(--card))"
                      >
                        {data.revenueByCategory.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), t.revenue]}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '13px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2 w-full">
                  {data.revenueByCategory.map((cat, i) => {
                    const pct = totalRevenue > 0 ? (cat.revenue / totalRevenue * 100).toFixed(1) : '0';
                    return (
                      <div key={cat.category} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-foreground">{cat.category}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground text-xs">{pct}%</span>
                          <span className="font-medium text-foreground min-w-[80px] text-right">
                            {formatCurrency(cat.revenue)}
                          </span>
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

        {/* Fulfillment split — donut + stats */}
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
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={95}
                        paddingAngle={4}
                        strokeWidth={2}
                        stroke="hsl(var(--card))"
                      >
                        <Cell fill={CHART_COLORS[2]} />
                        <Cell fill={CHART_COLORS[0]} />
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [value, name === 'delivery' ? t.delivery : t.inLocation]}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '13px' }}
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
                        <div className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-lg',
                          isDelivery ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600',
                        )}>
                          {isDelivery ? <Truck className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground">{isDelivery ? t.delivery : t.inLocation}</div>
                          <div className="text-xs text-muted-foreground">{f.count} {t.orders} · {formatCurrency(f.revenue)}</div>
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

      {/* Row 2: Fulfillment trend area chart */}
      {data.fulfillmentSplit.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t.fulfillmentTrend}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer>
                <AreaChart data={data.fulfillmentSplit}>
                  <defs>
                    <linearGradient id="fillDelivery" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS[2]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS[2]} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fillInLocation" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="weekStart"
                    tickFormatter={v => { try { return format(new Date(v), 'dd MMM', { locale: ro }); } catch { return v; } }}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    labelFormatter={v => { try { return format(new Date(v), 'dd MMMM yyyy', { locale: ro }); } catch { return v; } }}
                  />
                  <Legend formatter={v => v === 'delivery' ? t.delivery : t.inLocation} />
                  <Area type="monotone" dataKey="delivery" stroke={CHART_COLORS[2]} fillOpacity={1} fill="url(#fillDelivery)" />
                  <Area type="monotone" dataKey="inLocation" stroke={CHART_COLORS[0]} fillOpacity={1} fill="url(#fillInLocation)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Row 3: Top clienți + Produse frecvent comandate împreună */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              {t.topCustomers}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.topCustomers.length > 0 ? (
              <div className="divide-y divide-border">
                {data.topCustomers.map((customer, idx) => (
                  <div key={customer.id} className="flex items-center gap-3 px-6 py-3">
                    <div className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      idx === 0 && 'bg-amber-100 text-amber-700',
                      idx === 1 && 'bg-slate-100 text-slate-600',
                      idx === 2 && 'bg-orange-100 text-orange-700',
                      idx > 2 && 'bg-muted text-muted-foreground',
                    )}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{customer.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {customer.ordersCount} {t.orders} · media {customer.avgOrder.toFixed(0)} RON
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-foreground shrink-0">
                      {formatCurrency(customer.totalSpent)}
                    </span>
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
            {data.productPairs.length > 0 ? (
              <div className="divide-y divide-border">
                {data.productPairs.map((pair, idx) => {
                  const maxCount = data.productPairs[0]?.pairCount || 1;
                  const pct = (pair.pairCount / maxCount) * 100;
                  return (
                    <div key={idx} className="px-6 py-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm min-w-0">
                          <span className="font-medium text-foreground truncate">{pair.productA}</span>
                          <span className="text-muted-foreground/50">+</span>
                          <span className="font-medium text-foreground truncate">{pair.productB}</span>
                        </div>
                        <Badge variant="secondary" className="ml-2 shrink-0 text-xs">
                          {pair.pairCount}×
                        </Badge>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/70 transition-all"
                          style={{ width: `${pct}%` }}
                        />
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
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px]" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[320px]" />
        <Skeleton className="h-[320px]" />
      </div>
      <Skeleton className="h-[280px]" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
      </div>
    </div>
  );
}
