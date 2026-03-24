import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame } from 'lucide-react';
import { texts } from '@/config/texts';
import type { StreakCampaign } from '../types';
import { StatMini } from '../shared/StatMini';

const t = texts.analytics;

export function StreaksTab({ data }: { data: StreakCampaign[] }) {
  if (!data || data.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">{t.noData}</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {data.map(sc => (
        <Card key={sc.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-4 w-4 text-warning" />
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
  );
}
