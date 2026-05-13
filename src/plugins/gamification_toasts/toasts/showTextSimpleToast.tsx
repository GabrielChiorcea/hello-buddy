import { toast } from '@/hooks/use-toast';
import { getImageUrl } from '@/lib/imageUrl';
import { Sparkles } from 'lucide-react';
import { texts } from '@/config/texts';

interface ShowTextSimpleToastArgs {
  text: string;
  image?: string;
  durationMs: number;
}

export function showTextSimpleToast(args: ShowTextSimpleToastArgs): void {
  const imageUrl = args.image ? getImageUrl(args.image) : '';
  const t = texts.gamificationToasts.textSimple;

  toast({
    duration: args.durationMs,
    className:
      "group pointer-events-auto flex w-full max-w-none items-stretch justify-start overflow-hidden rounded-none border-x-0 border-b-0 bg-card p-0 shadow-lg md:w-[420px] md:max-w-[420px] md:rounded-xl md:border",
    description: (
      <>
        <div className="flex min-h-14 w-full items-center gap-2.5 px-3 py-2 md:hidden bg-gradient-to-br from-card to-primary/5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>

          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/70 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
              </span>
              <span className="truncate text-[11px] font-extrabold uppercase tracking-[0.1em] text-primary">
                {t.label}
              </span>
            </div>
            <span className="line-clamp-3 text-[12px] font-bold leading-snug text-foreground">
              {args.text}
            </span>
          </div>
        </div>

        <div
          className={`hidden w-full overflow-hidden md:flex ${imageUrl ? 'h-[120px]' : 'min-h-[88px]'}`}
        >
          {imageUrl ? (
            <div className="relative w-[30%] min-w-[108px] shrink-0 overflow-hidden">
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
                <Sparkles className="h-3 w-3 text-amber-300" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-white">{t.badge}</span>
              </div>
            </div>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 overflow-hidden px-4 py-3 bg-gradient-to-br from-card to-primary/5">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/70 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="truncate text-[10px] font-extrabold uppercase tracking-[0.1em] text-primary">
                {t.label}
              </span>
              {!imageUrl ? (
                <span className="ml-auto shrink-0 rounded-sm bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
                  {t.badge}
                </span>
              ) : null}
            </div>

            <p className="line-clamp-3 break-words pr-2 text-[13px] font-semibold leading-snug text-foreground">
              {args.text}
            </p>
          </div>
        </div>
      </>
    ),
  });
}
