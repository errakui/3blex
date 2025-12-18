#!/bin/bash

echo "📦 Applicazione schema database esteso..."

# Verifica che DATABASE_URL sia impostato
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERRORE: DATABASE_URL non impostato nel .env"
    exit 1
fi

# Applica lo schema esteso
echo "📝 Applicazione schema esteso..."
psql $DATABASE_URL -f server/db/schema_extended.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema esteso applicato con successo!"
else
    echo "❌ Errore nell'applicazione dello schema"
    exit 1
fi

echo "✅ COMPLETATO!"

