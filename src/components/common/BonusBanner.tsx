import { Sparkles } from 'lucide-react';
import { texts } from '@/config/texts';

interface BonusBannerProps {
  desktop?: boolean;
  visibility?: 'mobile' | 'desktop' | 'all';
}

const BonusBanner = ({ desktop = false, visibility }: BonusBannerProps) => {
  const resolvedVisibility = visibility ?? (desktop ? 'desktop' : 'mobile');
  const visibilityClass =
    resolvedVisibility === 'mobile'
      ? 'lg:hidden'
      : resolvedVisibility === 'desktop'
        ? 'hidden lg:flex'
        : 'flex';

  return (
    <div
      className={`flex items-center gap-3.5 rounded-xl border border-orange-300 bg-orange-50 px-3 py-3 md:gap-4 md:rounded-2xl md:px-5 md:py-4 ${
        desktop ? 'mb-4 lg:mb-6 lg:px-4 lg:py-4' : 'mt-4'
      } ${visibilityClass}`}
    >
      {/* Icon cu pulse ring */}
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center md:h-12 md:w-12">
        <span className="absolute inset-[-4px] animate-ping rounded-full border-2 border-orange-400 opacity-50" />
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-200 bg-orange-50 md:h-12 md:w-12">
          <Sparkles className="h-4 w-4 text-orange-500 md:h-5 md:w-5" aria-hidden />
        </div>
      </div>

      {/* Text + progress bar */}
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5 md:mb-2">
          <span className="text-sm font-semibold leading-snug text-orange-900 md:text-base">
            {texts.home.heroGuestFomo}
          </span>
          {/* <span className="rounded-full border border-orange-300 bg-orange-100 px-2 py-0.5 text-sm font-bold text-orange-600">
            {texts.home.heroGuestFomoPercent}
          </span> */}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 overflow-hidden rounded-full bg-orange-200 md:h-2">
          <div className="h-full w-[73%] rounded-full bg-orange-500 transition-all duration-1000 ease-out" />
        </div>

        <div className="mt-1 flex justify-between md:mt-1.5">
          <span className="text-[11px] text-orange-600 md:text-sm">{texts.home.heroGuestFomoPercent}</span>
          <span className="text-[11px] font-bold text-orange-600 md:text-sm">{texts.home.heroGuestFomoReward}</span>
        </div>
      </div>

    </div>
  );
};

export default BonusBanner;