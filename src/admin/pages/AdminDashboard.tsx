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

const statusLabels: Record<keyof OrdersByStatus, { label: string; color: string }> = {
  pending: { label: 'În așteptare', color: 'bg-status-pending' },
  confirmed: { label: 'Confirmate', color: 'bg-status-confirmed' },
  preparing: { label: 'În preparare', color: 'bg-status-preparing' },
  delivering: { label: 'În livrare', color: 'bg-status-delivering' },
  delivered: { label: 'Livrate', color: 'bg-status-delivered' },
  cancelled: { label: 'Anulate', color: 'bg-destructive' },
};

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
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const result = await getDashboard();
      setData(normalizeDashboardData(result));
    } catch (error) {
      console.error('Eroare la încărcarea dashboard-ului:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca datele dashboard-ului',
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
    return <div className="text-center text-muted-foreground">Nu s-au putut încărca datele</div>;
  }

  return (
    <div className="space-y-6">
      {/* Titlu pagină */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Bun venit! Iată o privire de ansamblu asupra afacerii tale.
        </p>
      </div>

      {/* Carduri statistici */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Comenzi azi"
          value={data.stats?.today?.orders ?? 0}
          icon={ShoppingCart}
          description="comenzi plasate astăzi"
        />
        <StatsCard
          title="Venituri azi"
          value={`${(data.stats?.today?.revenue ?? 0).toLocaleString()} RON`}
          icon={DollarSign}
          description="încasări totale"
        />
        <StatsCard
          title="Utilizatori noi"
          value={data.stats?.today?.newUsers || 0}
          icon={Users}
          description="înregistrări azi"
        />
        <StatsCard
          title="Venituri luna aceasta"
          value={`${(data.stats?.thisMonth?.revenue ?? 0).toLocaleString()} RON`}
          icon={TrendingUp}
          description={`${data.stats?.thisMonth?.orders ?? 0} comenzi`}
        />
      </div>

      {/* Grafice */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Grafic vânzări */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vânzări ultimele 7 zile</CardTitle>
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
                      formatter={(value: number) => [`${value} RON`, 'Venituri']}
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
                  Nu există date de afișat
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Grafic comenzi pe status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comenzi pe status</CardTitle>
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

      {/* Comenzi recente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comenzi recente</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentOrders.length > 0 ? (
            <div className="space-y-4">
              {data.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">
                      Comanda #{order.id.slice(0, 8)}...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.deliveryAddress}, {order.deliveryCity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{order.total} RON</p>
                    <Badge
                      variant="secondary"
                      className={`${statusLabels[order.status as keyof OrdersByStatus]?.color} text-white`}
                    >
                      {statusLabels[order.status as keyof OrdersByStatus]?.label || order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nu există comenzi recente
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
