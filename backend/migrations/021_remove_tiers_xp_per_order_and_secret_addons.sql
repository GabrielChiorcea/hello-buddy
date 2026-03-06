-- Elimină setările scoase din admin: XP fix per comandă și Add-on-uri secrete pe nivel.
-- XP se acordă doar pe baza RON cheltuiți (tiers_xp_per_ron). Add-on-urile secrete pe nivel nu mai sunt folosite.

DELETE FROM app_settings WHERE id IN (
  'tiers_xp_per_order',
  'tiers_secret_addons_enabled'
);
