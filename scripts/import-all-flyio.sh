#!/bin/bash
# Script per importare schema, prodotti e creare admin su Fly.io
# Esegui questo script connettendoti al database Fly.io

echo "🚀 Setup completo database Fly.io"
echo "=================================="
echo ""
echo "📝 Istruzioni:"
echo "1. Connettiti al database: fly postgres connect -a 3blex-db"
echo "2. Esegui i file SQL uno per uno:"
echo "   \\i server/db/schema.sql"
echo "   \\i server/db/schema_extended.sql"
echo "   \\i server/db/schema_broadcast.sql"
echo ""
echo "3. Poi esegui questo script locale per importare prodotti e creare admin"
echo ""

