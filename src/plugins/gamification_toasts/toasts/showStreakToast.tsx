import { toast } from '@/hooks/use-toast';
import { getImageUrl } from '@/lib/imageUrl';
import { Clock, Sparkles } from 'lucide-react';
import { texts } from '@/config/texts';
import { AninnimatedHourglass } from '@/components/icons/AninnimatedHourglass';

interface ShowStreakToastArgs {
  title: string;
  text: string;
  current: number;
  total: number;
  rewardPoints: number;
  isEncourage: boolean;
  remainingOrders: number;
  estimatedSavingsRon?: number;
  image?: string;
  durationMs: number;
}

export function showStreakToast(args: ShowStreakToastArgs): void {
  const progressPct = Math.min(100, (args.current / Math.max(1, args.total)) * 100);
  const imageUrl = args.image ? getImageUrl(args.image) : '';
  const t = texts.streak.toast;

  const hasSavings = args.estimatedSavingsRon != null && args.estimatedSavingsRon > 0;
  const rewardLabelShort = hasSavings
    ? t.savingsShort.replace('{amount}', args.estimatedSavingsRon!.toFixed(0))
    : args.rewardPoints > 0
      ? t.pointsShort.replace('{points}', String(args.rewardPoints))
      : '';

  toast({
    duration: args.durationMs,
    className:
      "group pointer-events-auto flex w-full max-w-none items-stretch justify-start overflow-hidden rounded-none border-x-0 border-b-0 bg-card p-0 shadow-lg md:w-[420px] md:max-w-[420px] md:rounded-xl md:border",
    description: (
      <>
        <div className="flex h-14 w-full items-center gap-2.5 px-3 md:hidden bg-gradient-to-br from-card to-orange-50/20">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <AninnimatedHourglass className="h-4 w-4" durationSeconds={2} />
          </div>

          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500"></span>
              </span>
              <span className="truncate text-[11px] font-black uppercase tracking-wide text-orange-600">
                {args.title}
              </span>
            </div>
            <span className="truncate text-[12px] font-bold leading-tight text-orange-900">
              {args.isEncourage
                ? args.text
                : t.ordersProgress
                    .replace('{current}', String(args.current))
                    .replace('{total}', String(args.total))}
            </span>
          </div>

          {rewardLabelShort && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-orange-600 px-2.5 py-1 text-[11px] font-black text-white shadow-sm">
              <Sparkles className="h-3 w-3" />
              {rewardLabelShort}
            </span>
          )}
        </div>

        <div className="hidden h-[120px] w-full overflow-hidden md:flex">
          {imageUrl && (
            <div className="relative w-[30%] min-w-[108px] shrink-0 overflow-hidden">
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
              <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[9px] font-bold text-white uppercase">
                <Clock className="w-3 h-3 text-orange-400" />
                <span>{t.limited}</span>
              </div>
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 overflow-hidden px-4 py-2.5 bg-gradient-to-br from-card to-orange-50/10">
            <div className="flex min-w-0 items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
                <span className="truncate text-[10px] font-black uppercase tracking-tighter text-orange-600">
                  {args.title}
                </span>
              </div>
              <span className="shrink-0 rounded-full bg-orange-600 px-2 py-0.5 text-[9px] font-bold text-white animate-pulse">
                {args.isEncourage ? t.statusLastChance : t.statusExpiringSoon}
              </span>
            </div>

            {args.isEncourage ? (
              <>
                {args.text && (
                  <p className="line-clamp-2 break-words pr-1 text-xs font-medium leading-snug text-orange-900">
                    {args.text}
                  </p>
                )}
                {rewardLabelShort && (
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 shrink-0 text-orange-600" />
                    <span className="truncate text-xs font-black text-orange-700">
                      {rewardLabelShort}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex min-w-0 items-center justify-between gap-2 text-[11px] font-bold">
                  <span className="truncate text-orange-900">
                    {t.ordersProgress
                      .replace('{current}', String(args.current))
                      .replace('{total}', String(args.total))}
                  </span>
                  {rewardLabelShort && (
                    <span className="inline-flex shrink-0 items-center gap-1 text-orange-700">
                      <Sparkles className="h-3 w-3" />
                      <span className="font-black">{rewardLabelShort}</span>
                    </span>
                  )}
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-orange-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </>
    ),
  });
}
