-- ============================================
-- Plugin Add-ons – feature flag
-- ============================================

INSERT INTO app_settings (id, value, description) VALUES
    ('plugin_addons_enabled', 'true', 'Activează secțiunea Adaugă la comandă în coș – sugestii sosuri, băuturi, desert, garnituri; pe viitor reguli per produs și add-on cu puncte')
ON DUPLICATE KEY UPDATE id = id;
