/**
 * Iconițe SVG pentru niveluri de loialitate (tiers)
 * Folosesc Lucide React — culorile se moștenesc prin text-current / tokens semantice.
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

export interface TierBadgeIcon {
  id: string;
  label: string;
  icon: React.FC<LucideProps>;
}

/** Lista de iconițe relevante pentru rank-uri / niveluri */
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

/**
 * Returnează componenta Lucide pentru badge-ul de tier.
 * Dacă badgeIcon este un id cunoscut → returnează iconița corespunzătoare.
 * Altfel returnează Star (default).
 */
export function getTierBadgeIconComponent(badgeIcon?: string | null): React.FC<LucideProps> {
  if (badgeIcon == null || badgeIcon === '') return Star;
  const found = TIER_BADGE_ICONS.find((i) => i.id === badgeIcon);
  return found ? found.icon : Star;
}

/**
 * Componentă helper care randează iconița de tier la dimensiunea dorită.
 * Moștenește culoarea de la parent prin `text-current`.
 */
export const TierIcon: React.FC<{
  badgeIcon?: string | null;
  className?: string;
  size?: number;
}> = ({ badgeIcon, className = '', size = 20 }) => {
  const IconComponent = getTierBadgeIconComponent(badgeIcon);
  return <IconComponent size={size} className={className} />;
};
