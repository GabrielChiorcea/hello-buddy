import { toast } from '@/hooks/use-toast';
import { getImageUrl } from '@/lib/imageUrl';
import { Sparkles } from 'lucide-react';

interface ShowPointsToastArgs {
  text: string;
  image?: string;
  pointsAmount: number;
  durationMs: number;
}

export function showPointsToast(args: ShowPointsToastArgs): void {
  const description = args.text.replace(/\{puncte_amount\}/g, String(args.pointsAmount));
  const imageUrl = args.image ? getImageUrl(args.image) : '';

  toast({
    duration: args.durationMs,
    className:
      "group pointer-events-auto flex w-full max-w-none items-stretch justify-start overflow-hidden rounded-none border-x-0 border-b-0 bg-card p-0 shadow-lg md:w-[420px] md:max-w-[420px] md:rounded-xl md:border",
    description: (
      <>
        <div className="flex h-14 w-full items-center gap-2.5 px-3 md:hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <Sparkles className="h-4 w-4" />
          </div>

          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-orange-600">
                Economisești
              </span>
              <span className="ml-auto shrink-0 rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                Limitat
              </span>
            </div>
            <span className="truncate text-[12px] font-bold leading-tight text-foreground">
              {description}
            </span>
          </div>

          {args.pointsAmount > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-orange-600 px-2.5 py-1 text-[11px] font-black text-white shadow-sm">
              {args.pointsAmount} pct
            </span>
          )}
        </div>

        <div className="hidden h-[120px] w-full overflow-hidden md:flex">
          {imageUrl && (
            <div className="relative w-[30%] min-w-[108px] shrink-0 overflow-hidden">
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            </div>
          )}

          <div className="flex flex-1 flex-col justify-center px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-orange-600">
                Economisește acum
              </span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                Limitat
              </span>
            </div>

            <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-tight text-foreground/90">
              {description}
            </p>

            {args.pointsAmount > 0 && (
              <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-1.5">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold">{args.pointsAmount}</span>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">puncte</span>
                </div>
                <span className="text-xs font-medium text-muted-foreground">Disponibile</span>
              </div>
            )}
          </div>
        </div>
      </>
    ),
  });
}