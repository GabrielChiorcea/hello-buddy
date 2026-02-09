-- ============================================
-- Feature flag plugin puncte
-- ============================================

-- Adaugă setarea plugin_points_enabled (activat implicit)
INSERT INTO app_settings (id, value, description) VALUES
    ('plugin_points_enabled', 'true', 'Activează/dezactivează plugin-ul de puncte loialitate')
ON DUPLICATE KEY UPDATE id = id;
