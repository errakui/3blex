-- Aggiungi 3 affiliati all'admin (id=1)
-- Aggiungi 5 affiliati a RICC@GMAIL.COM (id=2)

-- Prima verifica gli ID
-- SELECT id, email FROM users WHERE email IN ('admin@3blex.com', 'RICC@GMAIL.COM');

-- 3 Affiliati per admin (referred_by = 1)
INSERT INTO users (name, email, password_hash, referral_code, referred_by, role) VALUES
('Affiliato Admin 1', 'aff1-admin@test.com', '$2a$10$dummy1', 'AFFADMIN1', 1, 'affiliate_basic'),
('Affiliato Admin 2', 'aff2-admin@test.com', '$2a$10$dummy2', 'AFFADMIN2', 1, 'affiliate_basic'),
('Affiliato Admin 3', 'aff3-admin@test.com', '$2a$10$dummy3', 'AFFADMIN3', 1, 'affiliate_basic')
ON CONFLICT (email) DO NOTHING;

-- 5 Affiliati per RICC@GMAIL.COM (referred_by = 2)
INSERT INTO users (name, email, password_hash, referral_code, referred_by, role) VALUES
('Affiliato Ricc 1', 'aff1-ricc@test.com', '$2a$10$dummy4', 'AFFRICC1', 2, 'affiliate_basic'),
('Affiliato Ricc 2', 'aff2-ricc@test.com', '$2a$10$dummy5', 'AFFRICC2', 2, 'affiliate_basic'),
('Affiliato Ricc 3', 'aff3-ricc@test.com', '$2a$10$dummy6', 'AFFRICC3', 2, 'affiliate_basic'),
('Affiliato Ricc 4', 'aff4-ricc@test.com', '$2a$10$dummy7', 'AFFRICC4', 2, 'affiliate_basic'),
('Affiliato Ricc 5', 'aff5-ricc@test.com', '$2a$10$dummy8', 'AFFRICC5', 2, 'affiliate_basic')
ON CONFLICT (email) DO NOTHING;

