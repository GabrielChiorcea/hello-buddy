/**
 * Pagina AdminAnalytics — analitice avansate
 * Secțiuni: Vânzări, Puncte loialitate, Campanii streak, Ranguri
 */

import { useEffect, useState, useCallback } from 'react';
import { useAdminApi } from '@/admin/hooks/useAdminApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area, LineChart, Line,
} from 'recharts';
import {
  Crown, Link2, Truck, MapPin, TrendingUp, TrendingDown,
  DollarSign, ShoppingCart, Receipt, Star, Flame, Award,
  Users, Clock, XCircle,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { texts } from '@/config/texts';

const t = texts.analytics;

// ===== Types =====
interface SalesKpis {
  grossRevenue: number; totalOrders: number; aov: number;
  netProfitPerOrder: number; revenueGrowthRate: number;
  totalDeliveryFees: number; cancellationRate: number; cancelledOrders: number;
}

interface PointsAnalytics {
  totalEarned: number; totalSpent: number; redemptionRate: number;
  redemptionsCount: number; uniqueEarners: number; uniqueRedeemers: number;
  aovWithPoints: number; aovWithoutPoints: number; totalDiscount: number;
  topEarners: { id: string; name: string; balance: number; earned: number; spent: number }[];
  trend: { day: string; earned: number; spent: number }[];
}

interface StreakCampaign {
  id: string; name: string; ordersRequired: number; bonusPoints: number;
  startDate: string; endDate: string;
  enrolled: number; completed: number; active: number;
  avgStreak: number; pointsAwarded: number; completionRate: number;
}

interface TierAnalytics {
  tierId: string; tierName: string; sortOrder: number; multiplier: number;
  userCount: number; revenue: number; ordersCount: number; avgOrder: number;
}

interface AnalyticsData {
  period: string;
  salesKpis: SalesKpis;
  topCustomers: { id: string; name: string; ordersCount: number; totalSpent: number; avgOrder: number; lastOrderAt: string }[];
  productPairs: { productA: string; productB: string; pairCount: number }[];
  revenueByCategory: { category: string; ordersCount: number; itemsSold: number; revenue: number }[];
  fulfillmentSplit: { weekStart: string; delivery: number; inLocation: number; total: number }[];
  fulfillmentTotals: { type: string; count: number; revenue: number }[];
  peakHours: { hour: number; orders: number; revenue: number }[];
  dailyRevenueTrend: { day: string; orders: number; revenue: number }[];
  pointsAnalytics: PointsAnalytics;
  streakAnalytics: StreakCampaign[];
  tierAnalytics: TierAnalytics[];
}

const CHART_COLORS = [
  'hsl(16, 90%, 50%)', 'hsl(142, 76%, 36%)', 'hsl(221, 83%, 53%)',
  'hsl(262, 83%, 58%)', 'hsl(45, 93%, 47%)', 'hsl(340, 75%, 55%)',
  'hsl(180, 60%, 45%)', 'hsl(30, 80%, 55%)',
];

const periods = [
  { label: '7 zile', value: '7d' },
  { label: '30 zile', value: '30d' },
  { label: '90 zile', value: '90d' },
];

function formatCurrency(val: number) {
  return val.toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' RON';
}

function formatHour(h: number) {
  return `${h.toString().padStart(2, '0')}:00`;
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

      {/* Tabs */}
      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales" className="text-xs sm:text-sm">💰 Vânzări</TabsTrigger>
          <TabsTrigger value="points" className="text-xs sm:text-sm">⭐ Puncte</TabsTrigger>
          <TabsTrigger value="streaks" className="text-xs sm:text-sm">🔥 Streak</TabsTrigger>
          <TabsTrigger value="tiers" className="text-xs sm:text-sm">🏆 Ranguri</TabsTrigger>
        </TabsList>

        {/* TAB: VÂNZĂRI */}
        <TabsContent value="sales" className="space-y-6">
          <SalesTab data={data} />
        </TabsContent>

        {/* TAB: PUNCTE */}
        <TabsContent value="points" className="space-y-6">
          <PointsTab data={data.pointsAnalytics} />
        </TabsContent>

        {/* TAB: STREAKS */}
        <TabsContent value="streaks" className="space-y-6">
          <StreaksTab data={data.streakAnalytics} />
        </TabsContent>

        {/* TAB: TIERS */}
        <TabsContent value="tiers" className="space-y-6">
          <TiersTab data={data.tierAnalytics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===== SALES TAB =====
function SalesTab({ data }: { data: AnalyticsData }) {
  const { salesKpis: kpi } = data;
  const totalRevenue = data.revenueByCategory.reduce((s, c) => s + c.revenue, 0);
  const totalFulfillment = data.fulfillmentTotals.reduce((s, f) => s + f.count, 0);

  const kpiCards = [
    { title: t.grossRevenue, value: formatCurrency(kpi.grossRevenue), icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: t.netProfitPerOrder, value: formatCurrency(kpi.netProfitPerOrder), icon: Receipt, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: t.aov, value: formatCurrency(kpi.aov), icon: ShoppingCart, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    {
      title: t.revenueGrowthRate,
      value: `${kpi.revenueGrowthRate > 0 ? '+' : ''}${kpi.revenueGrowthRate}%`,
      icon: kpi.revenueGrowthRate >= 0 ? TrendingUp : TrendingDown,
      color: kpi.revenueGrowthRate >= 0 ? 'text-emerald-500' : 'text-red-500',
      bg: kpi.revenueGrowthRate >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
      subtitle: t.vsPreviousPeriod,
    },
    { title: t.totalDeliveryFees, value: formatCurrency(kpi.totalDeliveryFees), icon: Truck, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { title: t.totalOrders, value: kpi.totalOrders.toLocaleString('ro-RO'), icon: ShoppingCart, color: 'text-primary', bg: 'bg-primary/10' },
    { title: t.cancellationRate, value: `${kpi.cancellationRate}%`, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', subtitle: `${kpi.cancelledOrders} ${t.cancelledOrders}` },
  ];

  return (
    <>
      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpiCards.map(card => (
          <KpiCard key={card.title} {...card} />
        ))}
      </div>

      {/* Daily Revenue Trend */}
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
                      <stop offset="5%" stopColor={CHART_COLORS[1]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS[1]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" tickFormatter={v => { try { return format(new Date(v), 'dd MMM', { locale: ro }); } catch { return v; } }} className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={v => { try { return format(new Date(v), 'dd MMMM yyyy', { locale: ro }); } catch { return v; } }} formatter={(v: number) => [formatCurrency(v), t.revenue]} />
                  <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS[1]} fillOpacity={1} fill="url(#fillRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Peak Hours */}
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
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={v => formatHour(v as number)} formatter={(v: number, name: string) => [name === 'orders' ? v : formatCurrency(v), name === 'orders' ? t.orders : t.revenue]} />
                  <Bar dataKey="orders" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue by Category + Fulfillment */}
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
                      <Pie data={data.revenueByCategory} dataKey="revenue" nameKey="category" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} strokeWidth={2} stroke="hsl(var(--card))">
                        {data.revenueByCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => [formatCurrency(value), t.revenue]} contentStyle={tooltipStyle} />
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
                          <span className="font-medium text-foreground min-w-[80px] text-right">{formatCurrency(cat.revenue)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : <div className="text-center py-8 text-muted-foreground text-sm">{t.noData}</div>}
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
                      <Pie data={data.fulfillmentTotals} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4} strokeWidth={2} stroke="hsl(var(--card))">
                        <Cell fill={CHART_COLORS[2]} /><Cell fill={CHART_COLORS[0]} />
                      </Pie>
                      <Tooltip formatter={(value: number, name: string) => [value, name === 'delivery' ? t.delivery : t.inLocation]} contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-4 w-full">
                  {data.fulfillmentTotals.map(f => {
                    const pct = totalFulfillment > 0 ? (f.count / totalFulfillment * 100).toFixed(1) : '0';
                    const isDelivery = f.type === 'delivery';
                    return (
                      <div key={f.type} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', isDelivery ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600')}>
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
            ) : <div className="text-center py-8 text-muted-foreground text-sm">{t.noData}</div>}
          </CardContent>
        </Card>
      </div>

      {/* Top Customers + Product Pairs */}
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
                    <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      idx === 0 && 'bg-amber-100 text-amber-700', idx === 1 && 'bg-slate-100 text-slate-600',
                      idx === 2 && 'bg-orange-100 text-orange-700', idx > 2 && 'bg-muted text-muted-foreground',
                    )}>{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{customer.name}</div>
                      <div className="text-xs text-muted-foreground">{customer.ordersCount} {t.orders} · media {customer.avgOrder.toFixed(0)} RON</div>
                    </div>
                    <span className="text-sm font-semibold text-foreground shrink-0">{formatCurrency(customer.totalSpent)}</span>
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-8 text-muted-foreground text-sm">{t.noData}</div>}
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
                        <Badge variant="secondary" className="shrink-0 ml-2">{pair.pairCount}x</Badge>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <div className="text-center py-8 text-muted-foreground text-sm">{t.noData}</div>}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// ===== POINTS TAB =====
function PointsTab({ data }: { data: PointsAnalytics }) {
  if (!data) return <div className="text-center py-12 text-muted-foreground">{t.noData}</div>;

  const kpis = [
    { title: t.pointsEarned, value: data.totalEarned.toLocaleString('ro-RO'), icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: t.pointsSpent, value: data.totalSpent.toLocaleString('ro-RO'), icon: Star, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: t.redemptionRate, value: `${data.redemptionRate}%`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', subtitle: `${data.redemptionsCount} ${t.redemptions}` },
    { title: t.totalDiscountFromPoints, value: formatCurrency(data.totalDiscount), icon: DollarSign, color: 'text-red-500', bg: 'bg-red-500/10' },
    { title: t.aovWithPoints, value: formatCurrency(data.aovWithPoints), icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: t.aovWithoutPoints, value: formatCurrency(data.aovWithoutPoints), icon: ShoppingCart, color: 'text-muted-foreground', bg: 'bg-muted' },
  ];

  return (
    <>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        {kpis.map(k => <KpiCard key={k.title} {...k} />)}
      </div>

      {/* Points Trend */}
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
                  <XAxis dataKey="day" tickFormatter={v => { try { return format(new Date(v), 'dd MMM', { locale: ro }); } catch { return v; } }} className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={v => { try { return format(new Date(v), 'dd MMMM', { locale: ro }); } catch { return v; } }} />
                  <Legend formatter={v => v === 'earned' ? t.earned : t.spent} />
                  <Line type="monotone" dataKey="earned" stroke={CHART_COLORS[1]} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="spent" stroke={CHART_COLORS[3]} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top earners */}
      {data.topEarners.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              {t.topPointsEarners}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {data.topEarners.map((u, idx) => (
                <div key={u.id} className="flex items-center gap-3 px-6 py-3">
                  <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    idx < 3 ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
                  )}>{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{t.balance}: {u.balance} · {t.spent}: {u.spent}</div>
                  </div>
                  <Badge variant="secondary">{u.earned} {t.earned.toLowerCase()}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// ===== STREAKS TAB =====
function StreaksTab({ data }: { data: StreakCampaign[] }) {
  if (!data || data.length === 0) return <div className="text-center py-12 text-muted-foreground">{t.noData}</div>;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.map(sc => (
          <Card key={sc.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                {sc.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground">
                {sc.startDate} → {sc.endDate} · {sc.ordersRequired} {t.orders} · {sc.bonusPoints} pts
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatMini label={t.enrolled} value={sc.enrolled} />
                <StatMini label={t.completed} value={sc.completed} />
                <StatMini label={t.active} value={sc.active} />
                <StatMini label={t.avgStreak} value={sc.avgStreak} />
                <StatMini label={t.completionRate} value={`${sc.completionRate}%`} highlight={sc.completionRate > 50} />
                <StatMini label={t.pointsAwarded} value={sc.pointsAwarded} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

// ===== TIERS TAB =====
function TiersTab({ data }: { data: TierAnalytics[] }) {
  if (!data || data.length === 0) return <div className="text-center py-12 text-muted-foreground">{t.noData}</div>;

  const totalUsers = data.reduce((s, t) => s + t.userCount, 0);

  return (
    <>
      {/* Distribution pie */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              {t.tierDistribution}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="h-[220px] w-[220px] shrink-0">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={data} dataKey="userCount" nameKey="tierName" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} strokeWidth={2} stroke="hsl(var(--card))">
                      {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number, _: any, p: any) => [v, p.payload.tierName]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 w-full">
                {data.map((tier, i) => {
                  const pct = totalUsers > 0 ? (tier.userCount / totalUsers * 100).toFixed(1) : '0';
                  return (
                    <div key={tier.tierId} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-foreground">{tier.tierName}</span>
                        <span className="text-xs text-muted-foreground">x{tier.multiplier}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground text-xs">{pct}%</span>
                        <span className="font-medium text-foreground">{tier.userCount}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue per tier bar chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              {t.tierLtv}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer>
                <BarChart data={data} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" tickFormatter={v => formatCurrency(v)} />
                  <YAxis type="category" dataKey="tierName" className="text-xs" width={100} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), t.tierRevenue]} />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                    {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier details table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t.tierName}</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t.userCount}</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t.tierRevenue}</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t.totalOrders}</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t.tierAvgOrder}</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t.tierMultiplier}</th>
                </tr>
              </thead>
              <tbody>
                {data.map(tier => (
                  <tr key={tier.tierId} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{tier.tierName}</td>
                    <td className="px-4 py-3 text-right text-foreground">{tier.userCount}</td>
                    <td className="px-4 py-3 text-right text-foreground">{formatCurrency(tier.revenue)}</td>
                    <td className="px-4 py-3 text-right text-foreground">{tier.ordersCount}</td>
                    <td className="px-4 py-3 text-right text-foreground">{formatCurrency(tier.avgOrder)}</td>
                    <td className="px-4 py-3 text-right"><Badge variant="secondary">x{tier.multiplier}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// ===== SHARED COMPONENTS =====
const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '13px' };

function KpiCard({ title, value, icon: Icon, color, bg, subtitle }: {
  title: string; value: string; icon: any; color: string; bg: string; subtitle?: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-xl font-bold text-foreground tracking-tight">{value}</p>
            {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', bg)}>
            <Icon className={cn('h-4 w-4', color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatMini({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="text-center p-2 rounded-lg bg-muted/50">
      <div className={cn('text-lg font-bold', highlight ? 'text-emerald-500' : 'text-foreground')}>{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-48" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-[300px]" />
    </div>
  );
}
