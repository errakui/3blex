#!/bin/bash

echo "🚀 3Blex Network - Quick Start"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creando file .env..."
    cp .env.example .env 2>/dev/null || echo "File .env creato manualmente"
fi

# Create uploads directory
echo "📁 Creando directory uploads..."
mkdir -p server/uploads

# Check if database exists
echo "🗄️  Controllo database..."
psql -lqt | cut -d \| -f 1 | grep -qw 3blex_network
if [ $? -ne 0 ]; then
    echo "⚠️  Database '3blex_network' non esiste!"
    echo "   Crealo con: createdb 3blex_network"
    echo "   Poi esegui lo schema con: psql -d 3blex_network -f server/db/schema.sql"
else
    echo "✅ Database esiste"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installazione dipendenze..."
    npm install
else
    echo "✅ Dipendenze già installate"
fi

echo ""
echo "✅ Setup completato!"
echo ""
echo "Prossimi passi:"
echo "1. Assicurati che il database sia configurato"
echo "2. Avvia il backend: npm run server"
echo "3. In un altro terminale, avvia il frontend: npm run dev"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend:  http://localhost:3001"

