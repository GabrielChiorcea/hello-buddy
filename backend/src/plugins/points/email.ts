/**
 * Email - puncte câștigate
 * Plugin: plugins/points
 * Structură pregătită - doar loghează, nu trimite
 */

export function sendPointsEarnedEmail(
  userEmail: string,
  pointsEarned: number,
  totalPoints: number
): void {
  const message = `[Email] Către ${userEmail}: Ai primit ${pointsEarned} puncte. Total puncte: ${totalPoints}`;
  console.log(message);
}
