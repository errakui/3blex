# ✅ Checklist Deploy Fly.io

## Pre-Deploy

### 1. Setup Fly.io Account
- [ ] Account Fly.io creato
- [ ] Fly CLI installato (`fly version` per verificare)
- [ ] Login eseguito (`fly auth login`)

### 2. Database Setup
- [ ] Database PostgreSQL creato su Fly.io
- [ ] Credenziali database salvate
- [ ] Connection string ottenuta

### 3. File di Configurazione
- [ ] `Dockerfile` creato ✅
- [ ] `fly.toml` creato ✅
- [ ] `.dockerignore` creato ✅
- [ ] `server.js` (custom server) creato ✅
- [ ] `next.config.js` configurato per produzione ✅

### 4. Variabili Ambiente
Prepara tutte le variabili da impostare:

```bash
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
FRONTEND_URL="https://3blex-network.fly.dev"
NEXT_PUBLIC_API_URL="https://3blex-network.fly.dev"
PORT="8080"
NODE_ENV="production"
STRIPE_SECRET_KEY="..."
STRIPE_PUBLISHABLE_KEY="..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="..."
```

### 5. Database Schema
- [ ] Schema base applicato al database Fly.io
- [ ] Schema esteso applicato
- [ ] Schema broadcast applicato (se esiste)
- [ ] Admin user creato (opzionale)

### 6. Test Locale
- [ ] Build Docker locale testato (`docker build -t 3blex-test .`)
- [ ] Server custom testato localmente
- [ ] Health check funzionante

## Deploy

### 1. Creazione App
```bash
fly launch --name 3blex-network --region iad
```

- [ ] App creata con successo
- [ ] `fly.toml` generato/modificato

### 2. Database
- [ ] Database collegato all'app (se non già fatto)
- [ ] Connection string verificata

### 3. Volume (Opzionale)
Se necessario per uploads persistenti:
```bash
fly volumes create 3blex_uploads --region iad --size 1
```
- [ ] Volume creato
- [ ] `fly.toml` aggiornato con mount

### 4. Secrets
```bash
fly secrets set DATABASE_URL="..."
fly secrets set JWT_SECRET="..."
# ... altre variabili
```

- [ ] Tutte le variabili ambiente impostate
- [ ] Secrets verificati (`fly secrets list`)

### 5. Deploy
```bash
fly deploy
```

- [ ] Build completato senza errori
- [ ] App avviata correttamente
- [ ] Health check risponde

## Post-Deploy

### 1. Verifica Funzionamento
- [ ] App accessibile: `https://3blex-network.fly.dev`
- [ ] Health check: `https://3blex-network.fly.dev/api/health`
- [ ] Homepage carica correttamente
- [ ] Login funziona
- [ ] Database connesso

### 2. Test Funzionalità
- [ ] Login utente
- [ ] Registrazione nuovo utente
- [ ] Dashboard caricamento
- [ ] Upload file KYC (se applicabile)
- [ ] Marketplace prodotti
- [ ] Creazione ordine

### 3. Monitoraggio
```bash
fly logs
fly status
```

- [ ] Logs senza errori critici
- [ ] App in stato "running"
- [ ] CPU/Memory usage normale

### 4. Configurazioni Avanzate (Opzionale)
- [ ] Dominio personalizzato configurato
- [ ] Certificati SSL verificati
- [ ] Backup database configurato
- [ ] Monitoring/Alerting configurato

## Troubleshooting

### Se l'app non si avvia:
1. Verifica logs: `fly logs`
2. Verifica secrets: `fly secrets list`
3. Verifica database connection
4. Verifica porta: deve essere 8080

### Se il build fallisce:
1. Test build locale: `docker build -t test .`
2. Verifica Dockerfile
3. Verifica dipendenze in package.json

### Se database non si connette:
1. Verifica DATABASE_URL: `fly secrets get DATABASE_URL`
2. Test connessione: `fly postgres connect -a 3blex-db`
3. Verifica schema applicato

## Comandi Utili

```bash
# Logs
fly logs -a 3blex-network

# Status
fly status -a 3blex-network

# Restart
fly apps restart 3blex-network

# SSH
fly ssh console -a 3blex-network

# Secrets
fly secrets list -a 3blex-network
fly secrets set KEY=value -a 3blex-network

# Database
fly postgres connect -a 3blex-db

# Deploy
fly deploy -a 3blex-network
```

---

**Una volta completata la checklist, il progetto sarà live su Fly.io! 🚀**

