/**
 * Iconițe predefinite pentru niveluri de loialitate (tiers)
 * Adminul poate selecta dintr-o listă sau introduce text/emoji custom.
 */

export interface TierBadgeIcon {
  id: string;
  emoji: string;
  label: string;
}

/** Lista de iconițe relevante pentru rank-uri / niveluri (stele, medalii, coroane etc.) */
export const TIER_BADGE_ICONS: TierBadgeIcon[] = [
  { id: 'star', emoji: '⭐', label: 'Stea' },
  { id: 'stars', emoji: '🌟', label: 'Stele strălucitoare' },
  { id: 'sparkles', emoji: '✨', label: 'Scântei' },
  { id: 'medal-bronze', emoji: '🥉', label: 'Medalie bronz' },
  { id: 'medal-silver', emoji: '🥈', label: 'Medalie argint' },
  { id: 'medal-gold', emoji: '🥇', label: 'Medalie aur' },
  { id: 'trophy', emoji: '🏆', label: 'Trofeu' },
  { id: 'crown', emoji: '👑', label: 'Coroană' },
  { id: 'crown-gold', emoji: '👑', label: 'Coroană aur' },
  { id: 'gem', emoji: '💎', label: 'Diamant' },
  { id: 'fire', emoji: '🔥', label: 'Foc' },
  { id: 'rocket', emoji: '🚀', label: 'Rachetă' },
  { id: 'heart', emoji: '❤️', label: 'Inimă' },
  { id: 'badge', emoji: '🎖️', label: 'Insignă' },
  { id: 'ribbon', emoji: '🎀', label: 'Panglică' },
  { id: 'newbe', emoji: '🌱', label: 'Newbe / Începător' },
  { id: 'leaf', emoji: '🍀', label: 'Patru foi' },
  { id: 'sun', emoji: '☀️', label: 'Soare' },
  { id: 'moon', emoji: '🌙', label: 'Lună' },
  { id: 'default', emoji: '⭐', label: 'Implicit' },
];

/**
 * Returnează emoji-ul pentru badge-ul de tier.
 * Dacă badgeIcon este un id cunoscut din TIER_BADGE_ICONS → returnează emoji-ul.
 * Altfel returnează badgeIcon ca atare (emoji sau text custom).
 */
export function getTierBadgeIcon(badgeIcon?: string | null): string {
  if (badgeIcon == null || badgeIcon === '') return '⭐';
  const found = TIER_BADGE_ICONS.find((i) => i.id === badgeIcon);
  return found ? found.emoji : badgeIcon;
}
