/**
 * Sloturi unificate pentru imaginile promo Home (cupoane + streak).
 * Asset recomandat: bandă lată ~2,5–3:1 (ex. 1200×400 sau 1200×450 px), subiect centrat; @2x: 2400×900.
 */

/** Card principal cupoane + orice bandă care trece mobil → desktop (lg). */
export const homePromoImageBandResponsiveClass =
  'relative w-full shrink-0 overflow-hidden bg-muted/25 ' +
  'h-[128px] max-h-[40vw] ' +
  'lg:h-[200px] lg:w-full';

/** Rând mobil: card compact cupoane lângă streak — aceeași înălțime bandă ca MobileStreakCompactCard. */
export const homePromoImageBandCompactRowClass =
  'relative w-full shrink-0 overflow-hidden bg-muted/25 h-[128px] max-h-[40vw]';

export const homePromoImageImgClass = 'h-full w-full object-cover object-center';
