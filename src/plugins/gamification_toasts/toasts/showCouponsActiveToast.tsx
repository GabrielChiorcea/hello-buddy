import { toast } from '@/hooks/use-toast';
import { AninnimatedHourglass } from '@/components/icons/AninnimatedHourglass';
import { COUPONS_EMPTY_TEXT, COUPONS_FOMO_TEXT } from './texts';
import { getImageUrl } from '@/lib/imageUrl';
import { Ticket } from 'lucide-react';

interface CouponItem {
  id: string;
  title: string;
  discountPercent: number;
}

interface ShowCouponsActiveToastArgs {
  title: string;
  text?: string;
  image?: string;
  coupons: CouponItem[];
  durationMs: number;
}

export function showCouponsActiveToast(args: ShowCouponsActiveToastArgs): void {
  const visibleCoupons = args.coupons.slice(0, 4);
  const couponsCount = args.coupons.length;
  const hasCoupons = visibleCoupons.length > 0;
  const imageUrl = args.image ? getImageUrl(args.image) : '';
  const isEmptyWithImage = !hasCoupons && Boolean(imageUrl);
  const bestDiscount = hasCoupons
    ? args.coupons.reduce((max, c) => Math.max(max, c.discountPercent), 0)
    : 0;

  toast({
    duration: args.durationMs,
    className:
      "group pointer-events-auto flex w-full max-w-none items-stretch justify-start overflow-hidden rounded-none border-x-0 border-b-0 bg-card p-0 shadow-lg md:w-[420px] md:max-w-[420px] md:rounded-xl md:border",
    description: (
      <>
        <div className="flex min-h-14 w-full items-center gap-3 px-3 py-2 md:hidden">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm ring-1 ring-inset ${
              hasCoupons ? 'bg-primary/15 text-primary ring-primary/25' : 'bg-primary/15 text-primary ring-primary/20'
            }`}
          >
            <Ticket className="h-5 w-5" strokeWidth={2.25} />
          </div>

          {hasCoupons ? (
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 leading-snug">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[14px] font-black tabular-nums text-foreground">{couponsCount}</span>
                <span className="text-[11px] font-extrabold uppercase tracking-wide text-primary">
                  {couponsCount === 1 ? 'cupon activ' : 'cupoane active'}
                </span>
                {bestDiscount > 0 && (
                  <span className="ml-auto truncate text-[12px] font-black text-success">
                    pănă la -{bestDiscount}%
                  </span>
                )}
              </div>
              <span className="line-clamp-2 text-[11px] font-semibold leading-snug text-foreground/85">
                {COUPONS_FOMO_TEXT}
              </span>
            </div>
          ) : (
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 leading-snug">
              <span className="truncate text-[13px] font-extrabold leading-tight tracking-tight text-foreground">
                {args.title}
              </span>
              <span className="line-clamp-2 text-[11px] font-semibold leading-snug text-foreground/90">
                {COUPONS_EMPTY_TEXT}
              </span>
            </div>
          )}

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary shadow-sm ring-1 ring-inset ring-primary/25">
            <AninnimatedHourglass className="h-5 w-5" durationSeconds={2} />
          </div>
        </div>

        <div className={`hidden h-[120px] w-full flex-col overflow-hidden md:flex ${isEmptyWithImage ? 'p-0' : 'px-4 py-3'}`}>
          {isEmptyWithImage ? (
            <div className="flex h-[120px] w-full overflow-hidden">
              <div className="relative w-[30%] min-w-[108px] shrink-0 overflow-hidden">
                <img src={imageUrl} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between px-4 py-3">
                <div>
                  <span className="line-clamp-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-primary">
                    {args.title}
                  </span>
                  <p className="mt-1.5 line-clamp-3 text-[15px] font-semibold leading-snug text-foreground">
                    {COUPONS_EMPTY_TEXT}
                  </p>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="line-clamp-2 min-w-0 flex-1 text-[13px] font-semibold leading-snug text-foreground">
                    {COUPONS_FOMO_TEXT}
                  </span>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary shadow-sm ring-1 ring-inset ring-primary/25">
                    <AninnimatedHourglass className="h-5 w-5" durationSeconds={2} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-2 w-full">
                <span className="line-clamp-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-primary">
                  {args.title}
                </span>
                {args.text && (
                  <p className="mt-0.5 line-clamp-2 text-xs font-semibold leading-tight text-foreground">
                    {args.text}
                  </p>
                )}
              </div>

              {hasCoupons ? (
                <div className="grid w-full grid-cols-3 gap-1.5">
                  {visibleCoupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      className="relative min-w-0 px-1"
                    >
                      <div className="relative flex items-center justify-between gap-1 rounded-sm border border-primary/35 bg-primary/5 py-1.5 px-2.5">
                        <span className="absolute -left-[7px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-r border-primary/35 bg-card" />
                        <span className="absolute -right-[7px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-l border-primary/35 bg-card" />
                        <p className="truncate text-[9px] font-bold uppercase tracking-tight text-foreground">
                          {coupon.title}
                        </p>
                        <span className="shrink-0 text-[10px] font-black text-success">
                          -{coupon.discountPercent}%
                        </span>
                        <div className="absolute bottom-1 left-1/4 top-1 border-l border-dashed border-primary/20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] font-semibold leading-snug text-foreground">{COUPONS_EMPTY_TEXT}</p>
              )}

              <div className="mt-2 flex w-full items-center justify-start gap-2">
                <span className="min-w-0 flex-1 text-[13px] font-semibold text-foreground">{COUPONS_FOMO_TEXT}</span>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary shadow-sm ring-1 ring-inset ring-primary/25">
                  <AninnimatedHourglass className="h-5 w-5" durationSeconds={2} />
                </div>
              </div>
            </>
          )}
        </div>
      </>
    ),
  });
}