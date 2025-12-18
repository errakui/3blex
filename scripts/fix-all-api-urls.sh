#!/bin/bash
# Script per aggiornare tutti i file per usare apiUrl() invece di localhost:3001

echo "🔄 Aggiornamento URL API in tutti i file..."

# Lista file da aggiornare (escludi quelli già aggiornati)
FILES=$(grep -r "process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'" app/ --files-with-matches)

for file in $FILES; do
  echo "📝 Aggiornando: $file"
  
  # Aggiungi import se non esiste
  if ! grep -q "import { apiUrl }" "$file"; then
    # Trova la prima riga di import
    FIRST_IMPORT=$(grep -n "^import" "$file" | head -1 | cut -d: -f1)
    if [ -n "$FIRST_IMPORT" ]; then
      # Aggiungi import dopo la prima riga di import
      sed -i.bak "${FIRST_IMPORT}a\\
import { apiUrl } from '@/lib/api'
" "$file"
    else
      # Se non ci sono import, aggiungi all'inizio (dopo 'use client')
      if grep -q "'use client'" "$file"; then
        sed -i.bak "/'use client'/a\\
import { apiUrl } from '@/lib/api'
" "$file"
      else
        # Aggiungi all'inizio
        sed -i.bak "1i\\
import { apiUrl } from '@/lib/api'
" "$file"
      fi
    fi
  fi
  
  # Sostituisci le chiamate API
  sed -i.bak "s|\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}\([^`]*\)\`|apiUrl('\1')|g" "$file"
  sed -i.bak "s|\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/\([^\"']*\)|apiUrl('/\1')|g" "$file"
  
  # Rimuovi file backup
  rm -f "$file.bak"
  
done

echo "✅ Completato!"

