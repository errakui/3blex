#!/bin/bash

echo "🚀 AVVIO PROGETTO 3BLEX NETWORK"
echo "=================================="
echo ""

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verifica Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js non trovato!${NC}"
    exit 1
fi

# Verifica PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL non trovato!${NC}"
    exit 1
fi

# Verifica .env
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  File .env non trovato. Creazione...${NC}"
    cat > .env << EOF
DATABASE_URL=postgresql://localhost:5432/3blex_network
JWT_SECRET=3blex-network-super-secret-jwt-key-2024-change-in-production
JWT_EXPIRES_IN=7d
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-password
EOF
    echo -e "${GREEN}✅ File .env creato! Modifica con i tuoi valori.${NC}"
fi

# Crea directory uploads
echo "📁 Creazione directory uploads..."
mkdir -p server/uploads/kyc
mkdir -p server/uploads/invoices
echo -e "${GREEN}✅ Directory create${NC}"

# Verifica database
echo "🔍 Verifica database..."
if psql -lqt | cut -d \| -f 1 | grep -qw 3blex_network; then
    echo -e "${GREEN}✅ Database 3blex_network esiste${NC}"
else
    echo -e "${YELLOW}⚠️  Database non trovato. Creazione...${NC}"
    createdb 3blex_network
    echo -e "${GREEN}✅ Database creato${NC}"
    
    echo "📦 Applicazione schema..."
    psql -d 3blex_network -f server/db/schema.sql 2>&1 | grep -v "already exists" || true
    psql -d 3blex_network -f server/db/schema_extended.sql 2>&1 | grep -v "already exists" || true
    psql -d 3blex_network -f server/db/schema_broadcast.sql 2>&1 | grep -v "already exists" || true
    echo -e "${GREEN}✅ Schema applicato${NC}"
fi

# Verifica dipendenze
echo "📦 Verifica dipendenze..."
if [ ! -d node_modules ]; then
    echo -e "${YELLOW}⚠️  node_modules non trovato. Installazione...${NC}"
    npm install
    echo -e "${GREEN}✅ Dipendenze installate${NC}"
else
    echo -e "${GREEN}✅ Dipendenze presenti${NC}"
fi

# Verifica sintassi
echo "🔍 Verifica sintassi codice..."
node scripts/verify-setup.js
VERIFY_EXIT=$?

if [ $VERIFY_EXIT -ne 0 ]; then
    echo -e "${RED}❌ Errori trovati durante la verifica${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ TUTTO PRONTO!${NC}"
echo ""
echo "Per avviare il progetto:"
echo "  Terminal 1: npm run server"
echo "  Terminal 2: npm run dev"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:3001"
echo ""

