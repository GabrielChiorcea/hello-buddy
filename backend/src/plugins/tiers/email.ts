/**
 * Email - notificare level up
 * Plugin: plugins/tiers
 * Deocamdată doar loghează mesajul, nu trimite email real.
 */

export function sendLevelUpEmail(
  userEmail: string,
  tierName: string,
  message: string
): void {
  const msg = `[Email][Tiers] Către ${userEmail}: Nivel nou "${tierName}". Mesaj: ${message}`;
  console.log(msg);
}

