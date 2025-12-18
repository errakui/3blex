-- Broadcast Messages Table
CREATE TABLE IF NOT EXISTS broadcast_messages (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  target_audience VARCHAR(50) DEFAULT 'all' CHECK (target_audience IN ('all', 'affiliate_basic', 'network_member', 'admin')),
  priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'archived')),
  expires_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_broadcast_status ON broadcast_messages(status);
CREATE INDEX IF NOT EXISTS idx_broadcast_audience ON broadcast_messages(target_audience);

