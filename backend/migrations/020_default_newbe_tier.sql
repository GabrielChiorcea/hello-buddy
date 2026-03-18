-- ============================================
-- Tier implicit "Newbe" pentru utilizatori noi (0 XP)
-- ============================================
-- Orice utilizator nou are total_xp = 0; tier-ul se determină din getTierForXp(totalXp).
-- Un tier cu xp_threshold = 0 asigură că utilizatorii noi au rank-ul "Newbe".

INSERT INTO loyalty_tiers (id, name, xp_threshold, points_multiplier, badge_icon, sort_order, benefit_description)
VALUES (
    'a0000000-0000-4000-8000-000000000001',
    'Incepator',
    0,
    1.00,
    NULL,
    0,
    'Nivelul de start pentru utilizatori noi'
)
ON DUPLICATE KEY UPDATE
    name = 'Incepator',
    xp_threshold = 0,
    points_multiplier = 1.00,
    sort_order = 0,
    benefit_description = 'Nivelul de start pentru utilizatori noi';
