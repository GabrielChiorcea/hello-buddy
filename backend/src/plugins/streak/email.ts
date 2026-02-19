/**
 * Email content for streak campaign (template only, no sending)
 * Plugin: plugins/streak
 */

import type { StreakCampaign } from './repositories/campaignsRepository.js';

export interface UserForEmail {
  name: string;
  email: string;
}

export interface JoinCampaignEmailContent {
  subject: string;
  html: string;
  text: string;
}

/**
 * Returns subject and body for "you joined the campaign" email.
 * Ready for when an email service is integrated; no send is performed here.
 */
export function getJoinCampaignEmailContent(
  campaign: StreakCampaign,
  user: UserForEmail
): JoinCampaignEmailContent {
  const subject = `Te-ai înscris la campania: ${campaign.name}`;
  const text = `Bună ${user.name},\n\nTe-ai înscris la campania "${campaign.name}".\n\n${campaign.customText ?? ''}\n\nMult succes!`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(campaign.name)}</title></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #333;">Te-ai înscris la campania</h1>
  <h2 style="color: #16a34a;">${escapeHtml(campaign.name)}</h2>
  <p>Bună ${escapeHtml(user.name)},</p>
  <p>${escapeHtml(campaign.customText ?? 'Fă comenzi în perioada campaniei și câștigă puncte bonus.')}</p>
  <p>Mult succes!</p>
</body>
</html>`;
  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
