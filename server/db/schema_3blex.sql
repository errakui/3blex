-- ============================================
-- SCHEMA DATABASE 3BLEX NETWORK
-- Sistema Binario Puro come da specifiche 3blex.md
-- ============================================

-- Pulisci tabelle esistenti (solo in development)
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;

-- ============================================
-- ESTENSIONI
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- 1. TABELLA UTENTI
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'suspended')),
    role VARCHAR(20) DEFAULT 'affiliate' CHECK (role IN ('affiliate', 'admin')),
    
    -- KYC
    kyc_status VARCHAR(20) DEFAULT 'not_submitted' CHECK (kyc_status IN ('not_submitted', 'pending', 'approved', 'rejected')),
    kyc_submitted_at TIMESTAMP,
    kyc_approved_at TIMESTAMP,
    
    -- Rank
    current_rank VARCHAR(20) DEFAULT 'UNRANKED',
    highest_rank VARCHAR(20) DEFAULT 'UNRANKED',
    
    -- Referral
    referral_code VARCHAR(20) UNIQUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP
);

-- ============================================
-- 2. TABELLA ALBERO BINARIO
-- Struttura dell'albero con posizioni left/right
-- ============================================
CREATE TABLE IF NOT EXISTS binary_tree (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Posizione nell'albero
    parent_id UUID REFERENCES binary_tree(id),
    position VARCHAR(5) CHECK (position IN ('left', 'right') OR parent_id IS NULL),
    
    -- Figli diretti (denormalizzati per performance)
    left_child_id UUID REFERENCES binary_tree(id),
    right_child_id UUID REFERENCES binary_tree(id),
    
    -- Volumi (cumulativi, aggiornati ad ogni ordine)
    left_volume DECIMAL(15,2) DEFAULT 0,
    right_volume DECIMAL(15,2) DEFAULT 0,
    personal_volume DECIMAL(15,2) DEFAULT 0,
    
    -- Profondità nell'albero (0 = root)
    depth INTEGER DEFAULT 0,
    
    -- Path materializzato per query veloci (es: "uuid1.uuid2.uuid3")
    path TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- ============================================
-- 3. TABELLA SPONSOR TREE
-- Relazioni di sponsorizzazione (chi ha reclutato chi)
-- ============================================
CREATE TABLE IF NOT EXISTS sponsor_tree (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sponsor_id UUID REFERENCES users(id),
    
    -- Livello diretto dallo sponsor (1 = sponsorizzato direttamente)
    level INTEGER NOT NULL DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- Tabella chiusura transitiva per query multilivello efficienti
CREATE TABLE IF NOT EXISTS sponsor_tree_closure (
    ancestor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    descendant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    depth INTEGER NOT NULL,
    
    PRIMARY KEY (ancestor_id, descendant_id)
);

-- ============================================
-- 4. TABELLA WALLET
-- ============================================
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Saldi
    available_balance DECIMAL(15,2) DEFAULT 0,
    pending_balance DECIMAL(15,2) DEFAULT 0,
    
    -- Statistiche lifetime
    total_earned DECIMAL(15,2) DEFAULT 0,
    total_withdrawn DECIMAL(15,2) DEFAULT 0,
    
    -- Commissioni per tipo (lifetime)
    direct_earned DECIMAL(15,2) DEFAULT 0,
    binary_earned DECIMAL(15,2) DEFAULT 0,
    multilevel_earned DECIMAL(15,2) DEFAULT 0,
    bonus_earned DECIMAL(15,2) DEFAULT 0,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- ============================================
-- 5. TABELLA TRANSAZIONI WALLET
-- ============================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    
    -- Tipo transazione
    type VARCHAR(30) NOT NULL CHECK (type IN (
        'COMMISSION_DIRECT', 
        'COMMISSION_BINARY', 
        'COMMISSION_MULTILEVEL',
        'BONUS_RANK', 
        'BONUS_POOL', 
        'WITHDRAWAL', 
        'ADJUSTMENT',
        'REFUND'
    )),
    
    amount DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2) NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    
    -- Riferimenti
    reference_type VARCHAR(30),
    reference_id UUID,
    
    -- Per commissioni multilivello
    source_user_id UUID REFERENCES users(id),
    commission_level INTEGER,
    
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. TABELLA PRELIEVI
-- ============================================
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    amount DECIMAL(15,2) NOT NULL,
    fee DECIMAL(15,2) DEFAULT 0,
    net_amount DECIMAL(15,2) NOT NULL,
    
    method VARCHAR(30) NOT NULL CHECK (method IN ('bank_transfer', 'paypal', 'crypto')),
    bank_details JSONB,
    
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected', 'cancelled')),
    
    rejection_reason TEXT,
    processed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. TABELLA PRODOTTI
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Prezzi
    price DECIMAL(15,2) NOT NULL,
    price_affiliate DECIMAL(15,2),
    
    -- PV/BV
    pv_value DECIMAL(15,2) DEFAULT 0,
    
    -- Categorizzazione
    category VARCHAR(100),
    is_activation_pack BOOLEAN DEFAULT FALSE,
    is_digital BOOLEAN DEFAULT FALSE,
    
    -- Stock
    stock INTEGER DEFAULT 0,
    
    -- Media
    image_url VARCHAR(500),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'out_of_stock')),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 8. TABELLA ORDINI
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Importi
    subtotal DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    shipping_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    
    -- Valore commissionabile
    commissionable_amount DECIMAL(15,2) NOT NULL,
    
    -- PV generato
    pv_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
    )),
    
    -- Pagamento
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR(30),
    payment_intent_id VARCHAR(255),
    
    -- Flag
    is_activation_order BOOLEAN DEFAULT FALSE,
    commissions_processed BOOLEAN DEFAULT FALSE,
    
    -- Spedizione
    shipping_address JSONB,
    tracking_number VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP
);

-- ============================================
-- 9. TABELLA ORDER ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    pv_amount DECIMAL(15,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 10. TABELLA COMMISSIONI
-- ============================================
CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Chi riceve la commissione
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Origine della commissione
    order_id UUID REFERENCES orders(id),
    source_user_id UUID REFERENCES users(id),
    
    -- Tipo
    type VARCHAR(30) NOT NULL CHECK (type IN (
        'DIRECT', 'BINARY', 'MULTILEVEL', 'RANK_BONUS', 'LEADERSHIP_POOL'
    )),
    
    -- Per multilivello
    sponsor_level INTEGER,
    
    -- Importi
    base_amount DECIMAL(15,2) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    
    -- Riferimento periodo (per binary)
    period_id UUID,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    paid_at TIMESTAMP
);

-- ============================================
-- 11. TABELLA PERIODI VOLUME (per calcolo binario)
-- ============================================
CREATE TABLE IF NOT EXISTS volume_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Periodo
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    period_type VARCHAR(20) DEFAULT 'weekly' CHECK (period_type IN ('weekly', 'monthly')),
    
    -- Volumi del periodo
    left_volume DECIMAL(15,2) DEFAULT 0,
    right_volume DECIMAL(15,2) DEFAULT 0,
    personal_volume DECIMAL(15,2) DEFAULT 0,
    
    -- Carryover dal periodo precedente
    carryover_left DECIMAL(15,2) DEFAULT 0,
    carryover_right DECIMAL(15,2) DEFAULT 0,
    
    -- Volumi totali (periodo + carryover)
    total_left DECIMAL(15,2) DEFAULT 0,
    total_right DECIMAL(15,2) DEFAULT 0,
    
    -- Risultati
    matched_volume DECIMAL(15,2) DEFAULT 0,
    binary_commission DECIMAL(15,2) DEFAULT 0,
    new_carryover_left DECIMAL(15,2) DEFAULT 0,
    new_carryover_right DECIMAL(15,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'calculating', 'closed')),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    calculated_at TIMESTAMP,
    
    UNIQUE(user_id, period_start)
);

-- ============================================
-- 12. TABELLA CARRYOVER LEDGER
-- ============================================
CREATE TABLE IF NOT EXISTS carryover_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    left_carryover DECIMAL(15,2) DEFAULT 0,
    right_carryover DECIMAL(15,2) DEFAULT 0,
    
    -- Cicli di accumulo (max 3)
    left_cycles INTEGER DEFAULT 0,
    right_cycles INTEGER DEFAULT 0,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- ============================================
-- 13. TABELLA RANKS
-- ============================================
CREATE TABLE IF NOT EXISTS ranks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(20) UNIQUE NOT NULL,
    level INTEGER NOT NULL,
    
    -- Requisiti
    personal_pv_required DECIMAL(15,2) DEFAULT 0,
    left_volume_required DECIMAL(15,2) DEFAULT 0,
    right_volume_required DECIMAL(15,2) DEFAULT 0,
    group_volume_required DECIMAL(15,2) DEFAULT 0,
    active_directs_required INTEGER DEFAULT 0,
    
    -- Bonus
    bonus_onetime DECIMAL(15,2) DEFAULT 0,
    bonus_monthly DECIMAL(15,2) DEFAULT 0,
    commission_multiplier DECIMAL(5,2) DEFAULT 1.0,
    
    -- Pool leadership
    pool_shares INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 14. TABELLA RANK HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS rank_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    old_rank VARCHAR(20),
    new_rank VARCHAR(20) NOT NULL,
    
    -- Snapshot metriche
    personal_pv DECIMAL(15,2),
    left_volume DECIMAL(15,2),
    right_volume DECIMAL(15,2),
    group_volume DECIMAL(15,2),
    active_directs INTEGER,
    
    bonus_paid DECIMAL(15,2) DEFAULT 0,
    
    achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 15. TABELLA CONFIGURAZIONE COMMISSIONI
-- ============================================
CREATE TABLE IF NOT EXISTS commission_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(30) UNIQUE NOT NULL,
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 16. TABELLA KYC DOCUMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS kyc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('id_card', 'passport', 'driving_license')),
    document_number VARCHAR(100),
    document_expiry DATE,
    
    -- File paths
    front_path VARCHAR(500),
    back_path VARCHAR(500),
    selfie_path VARCHAR(500),
    proof_of_address_path VARCHAR(500),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 17. TABELLA NOTIFICHE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    -- Link opzionale
    action_url VARCHAR(500),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 18. TABELLA ACTIVITY LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDICI
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_rank ON users(current_rank);

CREATE INDEX IF NOT EXISTS idx_binary_tree_user ON binary_tree(user_id);
CREATE INDEX IF NOT EXISTS idx_binary_tree_parent ON binary_tree(parent_id);
CREATE INDEX IF NOT EXISTS idx_binary_tree_left_child ON binary_tree(left_child_id);
CREATE INDEX IF NOT EXISTS idx_binary_tree_right_child ON binary_tree(right_child_id);

CREATE INDEX IF NOT EXISTS idx_sponsor_tree_user ON sponsor_tree(user_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_tree_sponsor ON sponsor_tree(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_closure_ancestor ON sponsor_tree_closure(ancestor_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_closure_descendant ON sponsor_tree_closure(descendant_id);

CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_trans_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_trans_created ON wallet_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_commissions_user ON commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_order ON commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_type ON commissions(type);

CREATE INDEX IF NOT EXISTS idx_volume_periods_user ON volume_periods(user_id);
CREATE INDEX IF NOT EXISTS idx_volume_periods_dates ON volume_periods(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

-- ============================================
-- FUNZIONI
-- ============================================

-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funzione per generare referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(20) AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result VARCHAR(20) := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Funzione per generare order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(50) AS $$
BEGIN
    RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Funzione per aggiornare volumi nell'albero binario
CREATE OR REPLACE FUNCTION update_binary_volumes(
    p_user_id UUID,
    p_pv_amount DECIMAL
) RETURNS VOID AS $$
DECLARE
    v_node RECORD;
    v_parent_node RECORD;
    v_position VARCHAR(5);
BEGIN
    -- Trova il nodo dell'utente
    SELECT * INTO v_node FROM binary_tree WHERE user_id = p_user_id;
    
    IF v_node IS NULL THEN
        RETURN;
    END IF;
    
    -- Aggiorna il PV personale
    UPDATE binary_tree 
    SET personal_volume = personal_volume + p_pv_amount
    WHERE user_id = p_user_id;
    
    -- Risali l'albero fino alla root
    WHILE v_node.parent_id IS NOT NULL LOOP
        -- Trova il parent
        SELECT * INTO v_parent_node FROM binary_tree WHERE id = v_node.parent_id;
        
        -- Determina la posizione
        v_position := v_node.position;
        
        -- Aggiorna il volume della gamba corrispondente
        IF v_position = 'left' THEN
            UPDATE binary_tree 
            SET left_volume = left_volume + p_pv_amount
            WHERE id = v_parent_node.id;
        ELSE
            UPDATE binary_tree 
            SET right_volume = right_volume + p_pv_amount
            WHERE id = v_parent_node.id;
        END IF;
        
        -- Passa al nodo parent
        v_node := v_parent_node;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Funzione per inserire nella sponsor_tree_closure
CREATE OR REPLACE FUNCTION update_sponsor_closure()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserisci la relazione diretta
    INSERT INTO sponsor_tree_closure (ancestor_id, descendant_id, depth)
    VALUES (NEW.sponsor_id, NEW.user_id, 1)
    ON CONFLICT DO NOTHING;
    
    -- Inserisci tutte le relazioni indirette (antenati dello sponsor)
    INSERT INTO sponsor_tree_closure (ancestor_id, descendant_id, depth)
    SELECT ancestor_id, NEW.user_id, depth + 1
    FROM sponsor_tree_closure
    WHERE descendant_id = NEW.sponsor_id
    ON CONFLICT DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger per updated_at
DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS wallets_updated_at ON wallets;
CREATE TRIGGER wallets_updated_at 
    BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at 
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS withdrawals_updated_at ON withdrawals;
CREATE TRIGGER withdrawals_updated_at 
    BEFORE UPDATE ON withdrawals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at 
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS kyc_documents_updated_at ON kyc_documents;
CREATE TRIGGER kyc_documents_updated_at 
    BEFORE UPDATE ON kyc_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger per sponsor_tree_closure
DROP TRIGGER IF EXISTS sponsor_tree_closure_trigger ON sponsor_tree;
CREATE TRIGGER sponsor_tree_closure_trigger
    AFTER INSERT ON sponsor_tree
    FOR EACH ROW
    WHEN (NEW.sponsor_id IS NOT NULL)
    EXECUTE FUNCTION update_sponsor_closure();

-- ============================================
-- DATI INIZIALI
-- ============================================

-- Ranks
INSERT INTO ranks (name, level, personal_pv_required, left_volume_required, right_volume_required, group_volume_required, active_directs_required, bonus_onetime, bonus_monthly, pool_shares) VALUES
('UNRANKED', 0, 0, 0, 0, 0, 0, 0, 0, 0),
('BRONZE', 1, 100, 0, 0, 0, 0, 0, 0, 0),
('SILVER', 2, 100, 1000, 1000, 2500, 2, 100, 25, 0),
('GOLD', 3, 200, 5000, 5000, 12500, 4, 500, 100, 0),
('PLATINUM', 4, 500, 25000, 25000, 60000, 6, 2000, 300, 1),
('DIAMOND', 5, 1000, 100000, 100000, 250000, 10, 10000, 1000, 3)
ON CONFLICT (name) DO UPDATE SET
    level = EXCLUDED.level,
    personal_pv_required = EXCLUDED.personal_pv_required,
    left_volume_required = EXCLUDED.left_volume_required,
    right_volume_required = EXCLUDED.right_volume_required,
    group_volume_required = EXCLUDED.group_volume_required,
    active_directs_required = EXCLUDED.active_directs_required,
    bonus_onetime = EXCLUDED.bonus_onetime,
    bonus_monthly = EXCLUDED.bonus_monthly,
    pool_shares = EXCLUDED.pool_shares;

-- Configurazione commissioni
INSERT INTO commission_config (type, config) VALUES
('DIRECT', '{"percentage": 20, "first_order_only": true}'),
('BINARY', '{"percentage": 10, "weekly_cap": 10000, "min_personal_pv": 100, "max_carryover_cycles": 3}'),
('MULTILEVEL', '{"levels": [5, 3, 2, 1.5, 1, 1, 0.75, 0.5, 0.5, 0.25], "pv_requirements": [100, 100, 150, 150, 200, 200, 250, 250, 300, 300]}'),
('LEADERSHIP_POOL', '{"percentage_of_revenue": 2, "distribution": "monthly"}')
ON CONFLICT (type) DO UPDATE SET
    config = EXCLUDED.config,
    updated_at = CURRENT_TIMESTAMP;

-- Prodotto di attivazione di default
INSERT INTO products (id, name, description, price, pv_value, category, is_activation_pack, status) VALUES
(uuid_generate_v4(), 'Pack Attivazione Bronze', 'Pack di attivazione per iniziare il tuo business', 100.00, 100.00, 'activation', TRUE, 'active'),
(uuid_generate_v4(), 'Pack Attivazione Silver', 'Pack di attivazione con più prodotti', 250.00, 250.00, 'activation', TRUE, 'active'),
(uuid_generate_v4(), 'Pack Attivazione Gold', 'Pack di attivazione premium', 500.00, 500.00, 'activation', TRUE, 'active')
ON CONFLICT DO NOTHING;

-- ============================================
-- FINE SCHEMA
-- ============================================
