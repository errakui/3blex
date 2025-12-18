# ⚡ Quick Deploy - 3Blex Network su Fly.io

## 🚀 Deploy in 5 Minuti

### Step 1: Setup Fly.io (se non già fatto)

```bash
# Installa Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login
```

### Step 2: Crea Database

```bash
fly postgres create --name 3blex-db --region iad
```

**Salva la connection string che vedi!**

### Step 3: Crea App e Deploy

```bash
# Crea app
fly launch --name 3blex-network --region iad

# Quando chiede di collegare il database, scegli quello creato sopra
```

### Step 4: Configura Secrets

```bash
# Database (usa la connection string del passo 2)
fly secrets set DATABASE_URL="postgresql://..."

# JWT (genera una chiave segreta)
fly secrets set JWT_SECRET="$(openssl rand -base64 32)"

# URLs (usa il tuo dominio Fly.io)
fly secrets set FRONTEND_URL="https://3blex-network.fly.dev"
fly secrets set NEXT_PUBLIC_API_URL="https://3blex-network.fly.dev"
fly secrets set PORT="8080"
fly secrets set NODE_ENV="production"

# Stripe (se hai le chiavi)
fly secrets set STRIPE_SECRET_KEY="sk_live_..."
fly secrets set STRIPE_PUBLISHABLE_KEY="pk_live_..."
fly secrets set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
```

### Step 5: Setup Database Schema

```bash
# Connetti al database
fly postgres connect -a 3blex-db

# Poi esegui nello psql:
\i server/db/schema.sql
\i server/db/schema_extended.sql
```

**Oppure** da locale con la connection string:

```bash
DATABASE_URL="postgresql://..." node server/db/applyExtendedSchema.js
```

### Step 6: Deploy!

```bash
fly deploy
```

### Step 7: Verifica

```bash
# Vedi logs
fly logs

# Testa
curl https://3blex-network.fly.dev/api/health
```

## ✅ Fatto!

L'app è ora live su: `https://3blex-network.fly.dev`

## 🔧 Comandi Utili

```bash
# Logs in tempo reale
fly logs

# Restart app
fly apps restart 3blex-network

# Status
fly status

# SSH nella macchina
fly ssh console
```

## 🐛 Problemi?

1. **App non si avvia**: `fly logs` per vedere errori
2. **Database non si connette**: Verifica `DATABASE_URL` con `fly secrets list`
3. **Build fallisce**: Verifica Dockerfile e dipendenze

---

**Per dettagli completi, vedi `DEPLOY_FLYIO.md`**

