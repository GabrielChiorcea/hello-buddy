/**
 * =============================================================================
 * PAGINA DASHBOARD ADMIN - INTEGRAT CU BACKEND
 * =============================================================================
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminApi } from '@/admin/hooks/useAdminApi';
import { StatsCard } from '@/admin/components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  ChevronRight,
  Package,
  User as UserIcon,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { DashboardData, OrdersByStatus } from '@/types/admin';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { texts } from '@/config/texts';

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: texts.admin.statusPending, color: 'bg-status-pending', bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  confirmed: { label: texts.admin.statusConfirmed, color: 'bg-status-confirmed', bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  preparing: { label: texts.admin.statusPreparing, color: 'bg-status-preparing', bg: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  delivering: { label: texts.admin.statusDelivering, color: 'bg-status-delivering', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', dot: 'bg-cyan-500' },
  delivered: { label: texts.admin.statusDelivered, color: 'bg-status-delivered', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  cancelled: { label: texts.admin.statusCancelled, color: 'bg-destructive', bg: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
};

const statusLabels = statusConfig;

const EMPTY_DASHBOARD_DATA: DashboardData = {
  stats: {
    today: { orders: 0, revenue: 0, newUsers: 0 },
    thisWeek: { orders: 0, revenue: 0 },
    thisMonth: { orders: 0, revenue: 0 },
  },
  recentOrders: [],
  topProducts: [],
  ordersByStatus: {
    pending: 0,
    confirmed: 0,
    preparing: 0,
    delivering: 0,
    delivered: 0,
    cancelled: 0,
  },
  salesChart: [],
};

function normalizeDashboardData(raw: unknown): DashboardData {
  const r = (raw ?? {}) as Partial<DashboardData>;
  return {
    ...EMPTY_DASHBOARD_DATA,
    ...r,
    stats: {
      ...EMPTY_DASHBOARD_DATA.stats,
      ...(r.stats ?? {}),
      today: {
        ...EMPTY_DASHBOARD_DATA.stats.today,
        ...(r.stats?.today ?? {}),
      },
      thisWeek: {
        ...EMPTY_DASHBOARD_DATA.stats.thisWeek,
        ...(r.stats?.thisWeek ?? {}),
      },
      thisMonth: {
        ...EMPTY_DASHBOARD_DATA.stats.thisMonth,
        ...(r.stats?.thisMonth ?? {}),
      },
    },
    recentOrders: Array.isArray(r.recentOrders) ? r.recentOrders : [],
    topProducts: Array.isArray(r.topProducts) ? r.topProducts : [],
    salesChart: Array.isArray(r.salesChart) ? r.salesChart : [],
    ordersByStatus: {
      ...EMPTY_DASHBOARD_DATA.ordersByStatus,
      ...(r.ordersByStatus ?? {}),
    },
  };
}

export default function AdminDashboard() {
  const { getDashboard } = useAdminApi();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const result = await getDashboard();
      setData(normalizeDashboardData(result));
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast({
        title: texts.admin.error,
        description: texts.admin.couldNotLoadDashboard,
        variant: 'destructive',
      });
      setData(EMPTY_DASHBOARD_DATA);
    } finally {
      setIsLoading(false);
    }
  }, [getDashboard]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return <div className="text-center text-muted-foreground">{texts.admin.couldNotLoadData}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Titlu pagină */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{texts.admin.dashboardTitle}</h1>
        <p className="text-muted-foreground">
          {texts.admin.dashboardSubtitle}
        </p>
      </div>

      {/* Carduri statistici */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={texts.admin.ordersToday}
          value={data.stats?.today?.orders ?? 0}
          icon={ShoppingCart}
          description={texts.admin.ordersPlacedToday}
        />
        <StatsCard
          title={texts.admin.revenueToday}
          value={`${(data.stats?.today?.revenue ?? 0).toLocaleString()} ${texts.common.currency}`}
          icon={DollarSign}
          description={texts.admin.totalEarnings}
        />
        <StatsCard
          title={texts.admin.newUsers}
          value={data.stats?.today?.newUsers || 0}
          icon={Users}
          description={texts.admin.registrationsToday}
        />
        <StatsCard
          title={texts.admin.revenueThisMonth}
          value={`${(data.stats?.thisMonth?.revenue ?? 0).toLocaleString()} ${texts.common.currency}`}
          icon={TrendingUp}
          description={`${data.stats?.thisMonth?.orders ?? 0} ${texts.admin.orders}`}
        />
      </div>

      {/* Grafice */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Grafic vânzări */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{texts.admin.salesLast7Days}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {data.salesChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.salesChart}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => format(new Date(value), 'dd MMM', { locale: ro })}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value} ${texts.common.currency}`, texts.admin.revenue]}
                      labelFormatter={(label) => format(new Date(label), 'dd MMMM yyyy', { locale: ro })}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  {texts.admin.noData}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Grafic comenzi pe status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{texts.admin.ordersByStatus}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(data.ordersByStatus).map(([key, value]) => ({
                    name: statusLabels[key as keyof OrdersByStatus]?.label || key,
                    value,
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comenzi recente — redesign premium */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg">{texts.admin.recentOrders}</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">{texts.admin.last10Orders}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary gap-1"
            onClick={() => navigate('/admin/orders')}
          >
            {texts.admin.viewAll}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {data.recentOrders.length > 0 ? (
            <div className="divide-y divide-border">
              {data.recentOrders.map((order, idx) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                const timeAgo = (() => {
                  try {
                    return formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: ro });
                  } catch {
                    return '';
                  }
                })();
                const customerName = (order as any).customer?.name || texts.admin.client;

                return (
                  <div
                    key={order.id}
                    className={cn(
                      'flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/40 cursor-pointer',
                      idx === 0 && order.status === 'pending' && 'bg-amber-50/50 dark:bg-amber-950/10',
                    )}
                    onClick={() => navigate('/admin/orders')}
                  >
                    {/* Avatar / icon client */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                      <UserIcon className="h-4.5 w-4.5 text-muted-foreground" />
                    </div>

                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground truncate">
                          {customerName}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          #{order.id.slice(0, 6)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="h-3 w-3 text-muted-foreground/60" />
                        <span className="text-xs text-muted-foreground">{timeAgo}</span>
                        {(order as any).itemsCount && (
                          <>
                            <span className="text-muted-foreground/40">·</span>
                            <Package className="h-3 w-3 text-muted-foreground/60" />
                            <span className="text-xs text-muted-foreground">
                              {(order as any).itemsCount} {(order as any).itemsCount === 1 ? texts.admin.product : texts.admin.products}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
                      status.bg,
                    )}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                      {status.label}
                    </div>

                    {/* Preț */}
                    <div className="text-right shrink-0 min-w-[80px]">
                      <span className="text-sm font-semibold text-foreground">
                        {order.total?.toLocaleString('ro-RO')} {texts.common.currency}
                      </span>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                        {order.paymentMethod === 'card' ? 'Card' : 'Cash'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">{texts.admin.noRecentOrders}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
      </div>
    </div>
  );
}
