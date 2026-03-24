/**
 * Pagina AdminAnalytics — analitice avansate
 * Secțiuni: Vânzări, Puncte loialitate, Campanii streak, Ranguri
 */

import { useEffect, useState } from 'react';
import { useAdminApi } from '@/admin/hooks/useAdminApi';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { texts } from '@/config/texts';
import { analyticsPeriods, type AnalyticsData, type ProductPairRow } from './analytics/types';
import { AnalyticsSkeleton } from './analytics/shared/AnalyticsSkeleton';
import { SalesTab } from './analytics/tabs/SalesTab';
import { PointsTab } from './analytics/tabs/PointsTab';
import { StreaksTab } from './analytics/tabs/StreaksTab';
import { TiersTab } from './analytics/tabs/TiersTab';

const t = texts.analytics;

const tabErrorMsg =
  'Acest grafic sau tabel nu s-a putut afișa. Încearcă să reîncarci pagina sau schimbă fila.';

export default function AdminAnalytics() {
  const { getAnalytics, getAnalyticsProductPairs } = useAdminApi();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [productPairs, setProductPairs] = useState<ProductPairRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pairsLoading, setPairsLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setPairsLoading(true);
    setData(null);
    setProductPairs([]);

    getAnalytics(period)
      .then(res => {
        if (!cancelled) setData(res as AnalyticsData);
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
          toast({ title: 'Eroare', description: 'Nu s-au putut încărca analiticele', variant: 'destructive' });
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    getAnalyticsProductPairs(period)
      .then(res => {
        if (!cancelled) setProductPairs(res.productPairs ?? []);
      })
      .catch(() => {
        if (!cancelled) setProductPairs([]);
      })
      .finally(() => {
        if (!cancelled) setPairsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [period, getAnalytics, getAnalyticsProductPairs]);

  if (isLoading) return <AnalyticsSkeleton />;
  if (!data) return <div className="text-center text-muted-foreground py-12">{t.noData}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{t.subtitle}</p>
        </div>
        <div className="flex gap-1.5 bg-muted rounded-lg p-1">
          {analyticsPeriods.map(p => (
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

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales" className="text-xs sm:text-sm">Vânzări</TabsTrigger>
          <TabsTrigger value="points" className="text-xs sm:text-sm">Puncte</TabsTrigger>
          <TabsTrigger value="streaks" className="text-xs sm:text-sm">Streak</TabsTrigger>
          <TabsTrigger value="tiers" className="text-xs sm:text-sm">Ranguri</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <ErrorBoundary fallbackMessage={tabErrorMsg}>
            <SalesTab data={data} productPairs={productPairs} pairsLoading={pairsLoading} />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="points" className="space-y-6">
          <ErrorBoundary fallbackMessage={tabErrorMsg}>
            <PointsTab data={data.pointsAnalytics} />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="streaks" className="space-y-6">
          <ErrorBoundary fallbackMessage={tabErrorMsg}>
            <StreaksTab data={data.streakAnalytics} />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="tiers" className="space-y-6">
          <ErrorBoundary fallbackMessage={tabErrorMsg}>
            <TiersTab data={data.tierAnalytics} />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}
