import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Users, Award } from 'lucide-react';
import { texts } from '@/config/texts';
import type { TierAnalytics } from '../types';
import { formatCurrency, chartTooltipStyle } from '../format';
import { chartSeriesColor } from '../chartColors';

const t = texts.analytics;

export function TiersTab({ data }: { data: TierAnalytics[] }) {
  if (!data || data.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">{t.noData}</div>;
  }

  const totalUsers = data.reduce((s, row) => s + row.userCount, 0);

  return (
    <>
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
                    <Pie
                      data={data}
                      dataKey="userCount"
                      nameKey="tierName"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={3}
                      strokeWidth={2}
                      stroke="hsl(var(--card))"
                    >
                      {data.map((_, i) => (
                        <Cell key={i} fill={chartSeriesColor(i)} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(v: number, _label: string, p: { payload: TierAnalytics }) => [v, p.payload.tierName]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 w-full">
                {data.map((tier, i) => {
                  const pct = totalUsers > 0 ? (tier.userCount / totalUsers * 100).toFixed(1) : '0';
                  return (
                    <div key={tier.tierId} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: chartSeriesColor(i) }} />
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
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [formatCurrency(v), t.tierRevenue]} />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                    {data.map((_, i) => (
                      <Cell key={i} fill={chartSeriesColor(i)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

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
                    <td className="px-4 py-3 text-right">
                      <Badge variant="secondary">x{tier.multiplier}</Badge>
                    </td>
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
