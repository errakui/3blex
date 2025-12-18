-- ============================================
-- SCHEMA DATABASE ESTESO - 3BLEX NETWORK
-- Funzionalità Complete e Funzionanti
-- ============================================

-- ============================================
-- 1. TABELLE ESISTENTI (mantenute)
-- ============================================

-- Users Table - ESTESA
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS left_leg INTEGER REFERENCES users(id); -- Gamba sinistra binario
ALTER TABLE users ADD COLUMN IF NOT EXISTS right_leg INTEGER REFERENCES users(id); -- Gamba destra binario
ALTER TABLE users ADD COLUMN IF NOT EXISTS placement_side VARCHAR(10) CHECK (placement_side IN ('left', 'right', NULL)); -- Scelta gamba
ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_volume DECIMAL(10, 2) DEFAULT 0; -- PV
ALTER TABLE users ADD COLUMN IF NOT EXISTS group_volume DECIMAL(10, 2) DEFAULT 0; -- GV
ALTER TABLE users ADD COLUMN IF NOT EXISTS left_volume DECIMAL(10, 2) DEFAULT 0; -- Volume gamba sinistra
ALTER TABLE users ADD COLUMN IF NOT EXISTS right_volume DECIMAL(10, 2) DEFAULT 0; -- Volume gamba destra
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_rank VARCHAR(50) DEFAULT 'Bronze'; -- Rank attuale
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_code VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS iban VARCHAR(34);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10, 2) DEFAULT 0; -- Saldo wallet
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(50) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'in_review', 'approved', 'rejected'));

-- ============================================
-- 2. WALLET & TRANSACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('commission', 'withdrawal', 'refund', 'bonus', 'penalty')),
  amount DECIMAL(10, 2) NOT NULL,
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  description TEXT,
  reference_id INTEGER, -- ID commissione, ordine, etc.
  reference_type VARCHAR(50), -- 'commission', 'order', etc.
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  withdrawal_method VARCHAR(50) NOT NULL CHECK (withdrawal_method IN ('bank_transfer', 'card')),
  bank_details JSONB, -- Iban, nome banca, etc.
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  fee DECIMAL(10, 2) DEFAULT 0,
  net_amount DECIMAL(10, 2) NOT NULL,
  processed_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. QUALIFICHE & RANK
-- ============================================

CREATE TABLE IF NOT EXISTS ranks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  level INTEGER NOT NULL,
  required_pv DECIMAL(10, 2) DEFAULT 0, -- Volume personale richiesto
  required_gv DECIMAL(10, 2) DEFAULT 0, -- Volume gruppo richiesto
  required_left_volume DECIMAL(10, 2) DEFAULT 0,
  required_right_volume DECIMAL(10, 2) DEFAULT 0,
  required_qualified_legs INTEGER DEFAULT 0, -- Linee qualificate richieste
  bonus_amount DECIMAL(10, 2) DEFAULT 0,
  rewards JSONB, -- Premi e bonus collegati
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_ranks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  rank_id INTEGER REFERENCES ranks(id),
  rank_name VARCHAR(100) NOT NULL,
  achieved_at TIMESTAMP NOT NULL,
  period_start DATE NOT NULL, -- Inizio periodo qualifica
  period_end DATE NOT NULL, -- Fine periodo qualifica
  pv DECIMAL(10, 2) DEFAULT 0,
  gv DECIMAL(10, 2) DEFAULT 0,
  left_volume DECIMAL(10, 2) DEFAULT 0,
  right_volume DECIMAL(10, 2) DEFAULT 0,
  qualified_legs INTEGER DEFAULT 0,
  bonus_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rank_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  target_rank_id INTEGER REFERENCES ranks(id),
  current_pv DECIMAL(10, 2) DEFAULT 0,
  current_gv DECIMAL(10, 2) DEFAULT 0,
  current_left_volume DECIMAL(10, 2) DEFAULT 0,
  current_right_volume DECIMAL(10, 2) DEFAULT 0,
  current_qualified_legs INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  missing_pv DECIMAL(10, 2) DEFAULT 0,
  missing_gv DECIMAL(10, 2) DEFAULT 0,
  missing_left_volume DECIMAL(10, 2) DEFAULT 0,
  missing_right_volume DECIMAL(10, 2) DEFAULT 0,
  missing_qualified_legs INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. EVENTI, VIAGGI, CHALLENGE
-- ============================================

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('digital', 'physical', 'webinar', 'training', 'summit', 'meeting')),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  location VARCHAR(255),
  location_url TEXT, -- Per eventi digitali (Zoom, Meet, etc.)
  registration_required BOOLEAN DEFAULT true,
  registration_deadline TIMESTAMP,
  max_participants INTEGER,
  requirements JSONB, -- Requisiti per partecipare
  materials JSONB, -- Materiali evento (video, PDF, etc.)
  status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  qr_code VARCHAR(255) UNIQUE, -- QR ticket
  status VARCHAR(50) DEFAULT 'registered' CHECK (status IN ('registered', 'checked_in', 'cancelled')),
  checked_in_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  destination VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  registration_deadline DATE,
  requirements JSONB, -- Requisiti per qualificarsi
  max_participants INTEGER,
  catalog_info JSONB, -- Info catalogo viaggio
  status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trip_qualifications (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  requirements_met JSONB,
  qualified BOOLEAN DEFAULT false,
  qualified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(trip_id, user_id)
);

CREATE TABLE IF NOT EXISTS challenges (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('monthly', 'quarterly', 'annual', 'special')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  requirements JSONB, -- Requisiti challenge (PV, nuovi affiliati, etc.)
  prizes JSONB, -- Premi challenge
  leaderboard_type VARCHAR(50) CHECK (leaderboard_type IN ('team', 'company', 'individual')),
  status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS challenge_participants (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  current_position INTEGER,
  requirements_met JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(challenge_id, user_id)
);

CREATE TABLE IF NOT EXISTS leaderboards (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  score DECIMAL(10, 2) DEFAULT 0,
  position INTEGER,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(challenge_id, user_id)
);

-- ============================================
-- 5. MARKETPLACE AVANZATO
-- ============================================

-- Prodotti con prezzi differenziati
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_vip DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_affiliate DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_package BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS package_type VARCHAR(50) CHECK (package_type IN ('monthly', 'annual', 'startup', NULL));
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_digital BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS digital_content TEXT; -- Link o contenuto digitale

-- Prezzi personalizzati per cliente
CREATE TABLE IF NOT EXISTS product_customer_prices (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, user_id)
);

-- Ordini per clienti (acquisto per conto cliente)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ordered_by_affiliate INTEGER REFERENCES users(id); -- Affiliato che ordina per cliente
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_link TEXT; -- Link pagamento da inviare
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50) UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_issued BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_data JSONB; -- Dati fattura

-- ============================================
-- 6. REFERRAL LINKS MULTIPLI
-- ============================================

CREATE TABLE IF NOT EXISTS referral_links (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('registration', 'product', 'funnel', 'event', 'generic')),
  name VARCHAR(255),
  url_slug VARCHAR(255) UNIQUE NOT NULL,
  target_product_id INTEGER REFERENCES products(id),
  target_funnel_id INTEGER,
  target_event_id INTEGER REFERENCES events(id),
  default_action VARCHAR(50) CHECK (default_action IN ('register', 'purchase', 'funnel', 'event')),
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. KYC AVANZATO (Documento, Selfie, Proof of Address)
-- ============================================

-- KYC Documents già esiste, aggiungiamo colonne
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS document_type VARCHAR(50) CHECK (document_type IN ('id_card', 'passport', 'driving_license'));
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS document_number VARCHAR(100);
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS document_expiry DATE;
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS selfie_path VARCHAR(500);
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS proof_of_address_path VARCHAR(500);
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS address_document_type VARCHAR(50) CHECK (address_document_type IN ('utility_bill', 'bank_statement', 'tax_bill', 'government_letter', NULL));

-- ============================================
-- 8. FUNNEL BUILDER
-- ============================================

CREATE TABLE IF NOT EXISTS funnels (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_type VARCHAR(50) CHECK (template_type IN ('product_sale', 'affiliate_recruitment', 'custom')),
  funnel_data JSONB NOT NULL, -- Struttura funnel (pagine, elementi, etc.)
  referral_link_id INTEGER REFERENCES referral_links(id),
  conversion_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  published_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS funnel_conversions (
  id SERIAL PRIMARY KEY,
  funnel_id INTEGER REFERENCES funnels(id) ON DELETE CASCADE,
  referral_link_id INTEGER REFERENCES referral_links(id),
  visitor_id VARCHAR(255),
  converted BOOLEAN DEFAULT false,
  conversion_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 9. ACADEMY / TRAINING
-- ============================================

CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  instructor VARCHAR(255),
  duration_minutes INTEGER,
  level VARCHAR(50) CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  price DECIMAL(10, 2) DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  thumbnail_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS course_modules (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  video_url VARCHAR(500),
  pdf_url VARCHAR(500),
  content TEXT,
  duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_course_enrollments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  completed_modules JSONB, -- Array di module IDs completati
  completed_at TIMESTAMP,
  certificate_issued BOOLEAN DEFAULT false,
  certificate_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS quizzes (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  questions JSONB NOT NULL, -- Array di domande e risposte
  passing_score DECIMAL(5, 2) DEFAULT 70.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  score DECIMAL(5, 2),
  passed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 10. AI AGENT
-- ============================================

CREATE TABLE IF NOT EXISTS ai_agent_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  level VARCHAR(50) DEFAULT 'base' CHECK (level IN ('base', 'pro', 'elite')),
  messages JSONB NOT NULL, -- Array di messaggi chat
  context JSONB, -- Contesto conversazione
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_generated_content (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_id INTEGER REFERENCES ai_agent_sessions(id) ON DELETE CASCADE,
  content_type VARCHAR(50) CHECK (content_type IN ('script', 'copy', 'pitch', 'follow_up', 'email')),
  content TEXT NOT NULL,
  prompt TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'prospect' CHECK (status IN ('prospect', 'lead', 'customer', 'affiliate')),
  notes TEXT,
  tags JSONB,
  last_contact_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 11. COMMISSIONI AVANZATE
-- ============================================

-- Commissions già esiste, aggiungiamo colonne
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS order_id INTEGER REFERENCES orders(id);
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS commission_type VARCHAR(50) CHECK (commission_type IN ('subscription', 'product_sale', 'rank_bonus', 'challenge_bonus', NULL));
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS period_start DATE;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS period_end DATE;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS calculation_date DATE;

-- ============================================
-- 12. SUPPORT TICKETS
-- ============================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  subject VARCHAR(255) NOT NULL,
  category VARCHAR(50) CHECK (category IN ('technical', 'billing', 'account', 'network', 'other')),
  priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to INTEGER REFERENCES users(id), -- Admin/Support staff
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Note interne staff
  attachments JSONB, -- Array di file allegati
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 13. LOGS & AUDIT
-- ============================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 14. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ranks_user_id ON user_ranks(user_id);
CREATE INDEX IF NOT EXISTS idx_rank_progress_user_id ON rank_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_qualifications_user_id ON trip_qualifications(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_id ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_user_id ON referral_links(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_slug ON referral_links(url_slug);
CREATE INDEX IF NOT EXISTS idx_funnels_user_id ON funnels(user_id);
CREATE INDEX IF NOT EXISTS idx_user_course_enrollments_user_id ON user_course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_sessions_user_id ON ai_agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_users_left_leg ON users(left_leg);
CREATE INDEX IF NOT EXISTS idx_users_right_leg ON users(right_leg);

-- ============================================
-- 15. TRIGGERS
-- ============================================

CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON withdrawals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trip_qualifications_updated_at BEFORE UPDATE ON trip_qualifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_links_updated_at BEFORE UPDATE ON referral_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funnels_updated_at BEFORE UPDATE ON funnels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_course_enrollments_updated_at BEFORE UPDATE ON user_course_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_agent_sessions_updated_at BEFORE UPDATE ON ai_agent_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 16. DATI INIZIALI - RANKS
-- ============================================

INSERT INTO ranks (name, display_name, level, required_pv, required_gv, required_left_volume, required_right_volume, required_qualified_legs, bonus_amount, rewards) VALUES
('bronze', 'Bronze', 1, 0, 0, 0, 0, 0, 0, '{"badge": "Bronze Badge", "benefits": []}'),
('silver', 'Silver', 2, 100, 500, 200, 200, 1, 50, '{"badge": "Silver Badge", "benefits": ["10% bonus commission"]}'),
('gold', 'Gold', 3, 500, 2000, 800, 800, 2, 200, '{"badge": "Gold Badge", "benefits": ["15% bonus commission", "Event access"]}'),
('platinum', 'Platinum', 4, 2000, 10000, 4000, 4000, 3, 500, '{"badge": "Platinum Badge", "benefits": ["20% bonus commission", "VIP events", "Personal coach"]}'),
('diamond', 'Diamond', 5, 10000, 50000, 20000, 20000, 5, 2000, '{"badge": "Diamond Badge", "benefits": ["25% bonus commission", "Luxury trips", "Exclusive events"]}')
ON CONFLICT (name) DO NOTHING;

