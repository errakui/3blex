# 🚀 3Blex Network - Deploy su Fly.io

## 📦 File Configurati per Fly.io

### ✅ File Creati/Modificati:

1. **`Dockerfile`** - Container Docker multi-stage per Next.js + Express
2. **`fly.toml`** - Configurazione Fly.io (porte, health checks, scaling)
3. **`server.js`** - Server custom Next.js che integra Express (tutto su una porta)
4. **`.dockerignore`** - File da escludere dal build Docker
5. **`next.config.js`** - Configurazione Next.js per produzione (standalone mode)
6. **`DEPLOY_FLYIO.md`** - Guida completa deploy
7. **`DEPLOY_CHECKLIST.md`** - Checklist step-by-step

### 🔧 Modifiche Applicate:

- ✅ Server Express modificato per porta dinamica Fly.io
- ✅ CORS configurato per produzione Fly.io
- ✅ Next.js configurato per `standalone` output
- ✅ Scripts package.json aggiornati
- ✅ Health check endpoint `/api/health`

## 🚀 Quick Start

### 1. Installazione Fly CLI

```bash
# macOS
brew install flyctl

# Linux/Windows
curl -L https://fly.io/install.sh | sh
```

### 2. Login

```bash
fly auth login
```

### 3. Crea Database PostgreSQL

```bash
fly postgres create --name 3blex-db --region iad --vm-size shared-cpu-1x --volume-size 10
```

### 4. Crea App

```bash
fly launch --name 3blex-network --region iad
```

### 5. Configura Secrets

```bash
# Database (usa la connection string del database Fly.io)
fly secrets set DATABASE_URL="postgresql://user:pass@host:5432/db"

# JWT
fly secrets set JWT_SECRET="your-super-secret-key"

# URLs
fly secrets set FRONTEND_URL="https://3blex-network.fly.dev"
fly secrets set NEXT_PUBLIC_API_URL="https://3blex-network.fly.dev"

# Port
fly secrets set PORT="8080"
fly secrets set NODE_ENV="production"

# Stripe (se usato)
fly secrets set STRIPE_SECRET_KEY="sk_live_..."
fly secrets set STRIPE_PUBLISHABLE_KEY="pk_live_..."
fly secrets set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
```

### 6. Setup Database Schema

```bash
# Connetti al database
fly postgres connect -a 3blex-db

# Oppure usa la connection string per applicare schema
DATABASE_URL="postgresql://..." node server/db/applyExtendedSchema.js
```

### 7. Deploy!

```bash
fly deploy
```

### 8. Verifica

```bash
# Vedi logs
fly logs

# Verifica status
fly status

# Testa l'app
curl https://3blex-network.fly.dev/api/health
```

## 📋 Struttura del Progetto per Fly.io

```
3blex/
├── Dockerfile              # Build container
├── fly.toml               # Config Fly.io
├── server.js              # Server custom (Next.js + Express)
├── .dockerignore          # File da escludere dal build
├── next.config.js         # Next.js config (standalone)
├── package.json           # Scripts aggiornati
├── DEPLOY_FLYIO.md        # Guida completa
└── DEPLOY_CHECKLIST.md    # Checklist
```

## 🔍 Architettura

### Come Funziona:

1. **Server Custom** (`server.js`):
   - Avvia Next.js
   - Monta Express come middleware
   - Tutto su una singola porta (8080)

2. **Dockerfile**:
   - Multi-stage build
   - Ottimizzato per produzione
   - Include solo production dependencies

3. **Fly.io**:
   - Gestisce scaling automatico
   - Health checks automatici
   - SSL/TLS automatico
   - Load balancing

## 🐛 Troubleshooting

### App non si avvia

```bash
fly logs
fly status
```

### Build fallisce

```bash
# Test locale
docker build -t 3blex-test .
docker run -p 8080:8080 3blex-test
```

### Database non si connette

```bash
fly secrets get DATABASE_URL
fly postgres connect -a 3blex-db
```

### Porta errata

Verifica che `PORT=8080` sia impostato e che `fly.toml` usi `internal_port = 8080`.

## 📚 Documentazione

- **Guida Completa**: Vedi `DEPLOY_FLYIO.md`
- **Checklist**: Vedi `DEPLOY_CHECKLIST.md`
- **Fly.io Docs**: https://fly.io/docs/
- **Next.js Deployment**: https://nextjs.org/docs/deployment

## 🎯 Prossimi Passi

Dopo il deploy:

1. ✅ Verifica che tutto funzioni
2. ✅ Configura dominio personalizzato
3. ✅ Setup backup automatici database
4. ✅ Configura monitoring/alerting
5. ✅ Testa tutte le funzionalità

---

**Pronto per il deploy su Fly.io! 🚀**

