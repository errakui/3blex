# 🚀 Deploy 3Blex Network su Fly.io

Guida completa per il deploy della piattaforma 3Blex Network su Fly.io.

## 📋 Prerequisiti

1. **Account Fly.io**: Registrati su [fly.io](https://fly.io)
2. **Fly CLI**: Installa il CLI Fly.io
   ```bash
   curl -L https://fly.io/install.sh | sh
   # Oppure con Homebrew (macOS)
   brew install flyctl
   ```
3. **Git**: Repository git configurato

## 🔧 Setup Iniziale

### 1. Login a Fly.io
```bash
fly auth login
```

### 2. Crea il Database PostgreSQL

Fly.io offre PostgreSQL gestito. Crea un database:

```bash
fly postgres create --name 3blex-db --region iad --vm-size shared-cpu-1x --volume-size 10
```

Salva le credenziali del database che vengono mostrate!

### 3. Crea l'App Fly.io

```bash
cd /path/to/3blex
fly launch --name 3blex-network --region iad
```

Rispondi alle domande:
- **Nome app**: `3blex-network` (o quello che preferisci)
- **Regione**: `iad` (Washington DC) o quella più vicina a te
- **PostgreSQL**: Collega al database creato prima (se chiede)

### 4. Crea Volume per Uploads

```bash
fly volumes create 3blex_uploads --region iad --size 1
```

## 🔐 Configura Variabili Ambiente

Imposta tutte le variabili d'ambiente necessarie:

```bash
# Database (sostituisci con le tue credenziali)
fly secrets set DATABASE_URL="postgresql://user:password@host:5432/database"

# JWT
fly secrets set JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Frontend URL (sarà il tuo dominio Fly.io)
fly secrets set FRONTEND_URL="https://3blex-network.fly.dev"
fly secrets set NEXT_PUBLIC_API_URL="https://3blex-network.fly.dev"

# Stripe (se usi Stripe)
fly secrets set STRIPE_SECRET_KEY="sk_live_your_key"
fly secrets set STRIPE_PUBLISHABLE_KEY="pk_live_your_key"
fly secrets set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_your_key"

# Email (se configurato)
fly secrets set EMAIL_HOST="smtp.example.com"
fly secrets set EMAIL_PORT="587"
fly secrets set EMAIL_USER="your-email@example.com"
fly secrets set EMAIL_PASS="your-password"

# Port (Fly.io lo imposta automaticamente)
fly secrets set PORT="8080"
fly secrets set NODE_ENV="production"
```

### Variabili Multiple in una Volta

Puoi anche creare un file `.env.production` e importarlo:

```bash
fly secrets import < .env.production
```

## 🗄️ Setup Database

### 1. Connetti al Database Remoto

```bash
# Ottieni la connection string
fly postgres connect -a 3blex-db

# Oppure esporta la connection string
fly secrets get DATABASE_URL
```

### 2. Applica Schema Database

Una volta connesso al database:

```sql
-- Applica schema base
\i server/db/schema.sql

-- Applica schema esteso
\i server/db/schema_extended.sql

-- Applica schema broadcast (se esiste)
\i server/db/schema_broadcast.sql
```

**Oppure** usa uno script di migrazione:

```bash
# In locale, con la connection string del database Fly.io
DATABASE_URL="postgresql://..." node server/db/applyExtendedSchema.js
```

## 🚀 Deploy

### Deploy Iniziale

```bash
# Build e deploy
fly deploy
```

### Deploy Successivi

```bash
git add .
git commit -m "Deploy update"
fly deploy
```

## 📊 Monitoraggio

### Logs

```bash
# Vedi logs in tempo reale
fly logs

# Vedi logs dell'app specifica
fly logs -a 3blex-network
```

### Status

```bash
# Stato dell'app
fly status

# Info macchine
fly machines list
```

### SSH nella Macchina

```bash
fly ssh console
```

## 🔧 Configurazioni Avanzate

### 1. Domini Personalizzati

```bash
# Aggiungi dominio custom
fly certs add yourdomain.com

# Verifica certificati
fly certs show
```

Aggiorna `FRONTEND_URL` con il tuo dominio:

```bash
fly secrets set FRONTEND_URL="https://yourdomain.com"
fly secrets set NEXT_PUBLIC_API_URL="https://yourdomain.com"
```

### 2. Scaling

```bash
# Scala verticalmente (più CPU/RAM)
fly scale vm shared-cpu-2x --memory 2048

# Scala orizzontalmente (più istanze)
fly scale count 2
```

### 3. Backup Database

```bash
# Backup manuale
fly postgres backup create -a 3blex-db

# Lista backup
fly postgres backup list -a 3blex-db

# Restore backup
fly postgres backup restore <backup-id> -a 3blex-db
```

## 🐛 Troubleshooting

### App Non Si Avvia

```bash
# Controlla logs
fly logs

# Verifica variabili ambiente
fly secrets list

# Verifica status
fly status
```

### Errori Database

```bash
# Verifica connessione database
fly postgres connect -a 3blex-db

# Controlla se il database esiste
psql $DATABASE_URL -c "\l"
```

### Build Fallisce

```bash
# Build locale per testare
docker build -t 3blex-test .

# Verifica Dockerfile
fly deploy --local-only
```

### Porta Non Configurata

Verifica che `fly.toml` abbia la porta corretta (8080) e che `PORT` environment variable sia impostata.

## 📝 Comandi Utili

```bash
# Riavvia l'app
fly apps restart 3blex-network

# Vedi info app
fly info

# Apri dashboard web
fly dashboard

# Modifica fly.toml
fly config validate
fly config save

# Elimina app (ATTENZIONE!)
fly apps destroy 3blex-network
```

## 🔄 CI/CD (Opzionale)

### GitHub Actions

Crea `.github/workflows/fly-deploy.yml`:

```yaml
name: Deploy to Fly.io

on:
  push:
    branches: [main]

jobs:
  deploy:
    name: Deploy app
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

## 📚 Risorse

- [Fly.io Docs](https://fly.io/docs/)
- [Fly.io Postgres Docs](https://fly.io/docs/postgres/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## ✅ Checklist Pre-Deploy

- [ ] Account Fly.io creato
- [ ] Fly CLI installato
- [ ] Database PostgreSQL creato
- [ ] Volume per uploads creato
- [ ] Variabili ambiente configurate
- [ ] Schema database applicato
- [ ] Test locale completato
- [ ] `.env` file non committato (solo secrets su Fly.io)
- [ ] `fly.toml` configurato correttamente
- [ ] Health check funzionante (`/api/health`)

## 🎉 Post-Deploy

Dopo il deploy:

1. Verifica che l'app sia online: `https://3blex-network.fly.dev`
2. Testa l'endpoint health: `https://3blex-network.fly.dev/api/health`
3. Testa il login/admin
4. Configura dominio personalizzato (opzionale)
5. Setup backup automatici database

---

**Buon deploy! 🚀**

