-- ============================================
-- Plugin Welcome Bonus – feature flag
-- ============================================

INSERT INTO app_settings (id, value, description) VALUES
    ('plugin_welcome_bonus_enabled', 'true', 'Activează/dezactivează plugin-ul de puncte cadou la prima autentificare (popup + alocare puncte)')
ON DUPLICATE KEY UPDATE id = id;
