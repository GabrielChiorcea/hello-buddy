/**
 * Badge-uri tier: emoji native (glyph colorat) mapat 1:1 pe id-urile de rank,
 * echivalent semantic cu iconițele SVG Lucide din listă — nu catalogul de categorii food.
 */

import React from 'react';
import {
  Star,
  Sparkles,
  Medal,
  Trophy,
  Crown,
  Gem,
  Flame,
  Rocket,
  Heart,
  Award,
  Ribbon,
  Sprout,
  Clover,
  Sun,
  Moon,
  type LucideProps,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TierBadgeIcon {
  id: string;
  label: string;
  icon: React.FC<LucideProps>;
}

/** Emoji echivalent fiecărui id tier (aceleași chei ca în DB / picker). */
export const TIER_BADGE_EMOJI: Record<string, string> = {
  star: '⭐',
  stars: '🌟',
  sparkles: '✨',
  'medal-bronze': '🥉',
  'medal-silver': '🥈',
  'medal-gold': '🥇',
  trophy: '🏆',
  crown: '👑',
  'crown-gold': '👑',
  gem: '💎',
  fire: '🔥',
  rocket: '🚀',
  heart: '❤️',
  badge: '🎖️',
  ribbon: '🎀',
  newbe: '🌱',
  leaf: '🍀',
  sun: '☀️',
  moon: '🌙',
  default: '⭐',
};

/** Lista de iconițe rank (id + label + referință Lucide pentru tooling / viitor SVG). */
export const TIER_BADGE_ICONS: TierBadgeIcon[] = [
  { id: 'star', icon: Star, label: 'Stea' },
  { id: 'stars', icon: Sparkles, label: 'Stele strălucitoare' },
  { id: 'sparkles', icon: Sparkles, label: 'Scântei' },
  { id: 'medal-bronze', icon: Medal, label: 'Medalie bronz' },
  { id: 'medal-silver', icon: Medal, label: 'Medalie argint' },
  { id: 'medal-gold', icon: Medal, label: 'Medalie aur' },
  { id: 'trophy', icon: Trophy, label: 'Trofeu' },
  { id: 'crown', icon: Crown, label: 'Coroană' },
  { id: 'crown-gold', icon: Crown, label: 'Coroană aur' },
  { id: 'gem', icon: Gem, label: 'Diamant' },
  { id: 'fire', icon: Flame, label: 'Foc' },
  { id: 'rocket', icon: Rocket, label: 'Rachetă' },
  { id: 'heart', icon: Heart, label: 'Inimă' },
  { id: 'badge', icon: Award, label: 'Insignă' },
  { id: 'ribbon', icon: Ribbon, label: 'Panglică' },
  { id: 'newbe', icon: Sprout, label: 'Newbe / Începător' },
  { id: 'leaf', icon: Clover, label: 'Patru foi' },
  { id: 'sun', icon: Sun, label: 'Soare' },
  { id: 'moon', icon: Moon, label: 'Lună' },
  { id: 'default', icon: Star, label: 'Implicit' },
];

const TIER_ID_SET = new Set(TIER_BADGE_ICONS.map((i) => i.id));

function looksLikeRawEmoji(value: string): boolean {
  if (value.length > 16) return false;
  return /\p{Extended_Pictographic}/u.test(value);
}

export function getTierBadgeEmoji(badgeIcon?: string | null): string {
  if (badgeIcon == null || badgeIcon === '') return TIER_BADGE_EMOJI.default;
  return TIER_BADGE_EMOJI[badgeIcon] ?? TIER_BADGE_EMOJI.default;
}

/**
 * Returnează componenta Lucide pentru badge-ul de tier (ex. exporturi, preview SVG).
 */
export function getTierBadgeIconComponent(badgeIcon?: string | null): React.FC<LucideProps> {
  if (badgeIcon == null || badgeIcon === '') return Star;
  const found = TIER_BADGE_ICONS.find((i) => i.id === badgeIcon);
  return found ? found.icon : Star;
}

const TierEmojiGlyph: React.FC<{
  emoji: string;
  tierLabel: string;
  className?: string;
  size: number;
}> = ({ emoji, tierLabel, className = '', size }) => (
  <span
    className={cn(className)}
    style={{
      fontSize: size,
      lineHeight: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
    role="img"
    aria-label={tierLabel}
  >
    {emoji}
  </span>
);

export const TierIcon: React.FC<{
  badgeIcon?: string | null;
  tierLabel?: string;
  className?: string;
  size?: number;
}> = ({ badgeIcon, tierLabel = 'Nivel', className = '', size = 20 }) => {
  if (badgeIcon == null || badgeIcon === '') {
    return (
      <TierEmojiGlyph emoji={TIER_BADGE_EMOJI.default} tierLabel={tierLabel} className={className} size={size} />
    );
  }

  if (TIER_ID_SET.has(badgeIcon)) {
    return (
      <TierEmojiGlyph
        emoji={getTierBadgeEmoji(badgeIcon)}
        tierLabel={tierLabel}
        className={className}
        size={size}
      />
    );
  }

  if (looksLikeRawEmoji(badgeIcon)) {
    return (
      <TierEmojiGlyph emoji={badgeIcon} tierLabel={tierLabel} className={className} size={size} />
    );
  }

  return (
    <TierEmojiGlyph emoji={TIER_BADGE_EMOJI.default} tierLabel={tierLabel} className={className} size={size} />
  );
};
