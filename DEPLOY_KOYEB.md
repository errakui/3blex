# 🚀 Deploy 3Blex Network su Koyeb

Guida completa per il deploy della piattaforma 3Blex Network su Koyeb.

## 📋 Prerequisiti

1. Account [Koyeb](https://www.koyeb.com/) (piano gratuito disponibile)
2. Database PostgreSQL (Koyeb offre anche questo servizio)
3. Account Stripe per i pagamenti (opzionale per test)

---

## 🗄️ Step 1: Crea il Database PostgreSQL

### Opzione A: Database Koyeb (Consigliato)

1. Vai su [Koyeb Console](https://app.koyeb.com/)
2. Clicca su **"Create Database"**
3. Seleziona **PostgreSQL**
4. Scegli:
   - **Name**: `3blex-db`
   - **Region**: Scegli la più vicina (es. `fra` per Europa)
   - **Plan**: Starter (gratuito)
5. Clicca **"Create Database"**
6. Copia la **Connection String** che verrà mostrata

### Opzione B: Database Esterno (Neon, Supabase, Railway)

Puoi usare qualsiasi provider PostgreSQL. Esempi gratuiti:
- [Neon](https://neon.tech/) - 0.5GB gratuito
- [Supabase](https://supabase.com/) - 500MB gratuito
- [Railway](https://railway.app/) - $5 credito gratuito

---

## 🔧 Step 2: Deploy dell'Applicazione

### Via GitHub (Metodo Consigliato)

1. **Vai su Koyeb Console** → [app.koyeb.com](https://app.koyeb.com/)

2. **Clicca "Create App"** → **"GitHub"**

3. **Connetti il Repository**:
   - Autorizza Koyeb ad accedere a GitHub
   - Seleziona il repository: `errakui/3blex`
   - Branch: `master`

4. **Configura il Build**:
   - **Builder**: `Dockerfile`
   - **Dockerfile path**: `Dockerfile`
   - **Target**: lascia vuoto

5. **Configura il Service**:
   - **Name**: `3blex`
   - **Region**: `fra` (Frankfurt) o la più vicina
   - **Instance type**: `nano` (gratuito) o `small`
   - **Port**: `8080`

6. **Aggiungi le Variabili d'Ambiente** (vedi sezione sotto)

7. **Clicca "Deploy"**

---

## 🔐 Step 3: Variabili d'Ambiente

Aggiungi queste variabili in Koyeb → App Settings → Environment Variables:

### Obbligatorie

| Variabile | Valore | Descrizione |
|-----------|--------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | Connection string PostgreSQL |
| `JWT_SECRET` | `genera-una-stringa-sicura-32-caratteri` | Chiave segreta per JWT |
| `NODE_ENV` | `production` | Ambiente di produzione |
| `PORT` | `8080` | Porta dell'applicazione |

### Opzionali (ma consigliate)

| Variabile | Valore | Descrizione |
|-----------|--------|-------------|
| `FRONTEND_URL` | `https://tuoapp.koyeb.app` | URL pubblico dell'app |
| `NEXT_PUBLIC_API_URL` | `https://tuoapp.koyeb.app` | URL API per il frontend |
| `STRIPE_SECRET_KEY` | `sk_live_xxx` | Chiave Stripe per pagamenti |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_xxx` | Chiave pubblica Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_xxx` | Chiave Stripe per frontend |
| `SMTP_HOST` | `smtp.gmail.com` | Server SMTP per email |
| `SMTP_PORT` | `587` | Porta SMTP |
| `SMTP_USER` | `tua@email.com` | Username SMTP |
| `SMTP_PASS` | `app-password` | Password SMTP |

### Generare JWT_SECRET sicuro

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🗃️ Step 4: Inizializza il Database

Dopo il primo deploy, devi creare le tabelle nel database.

### Metodo 1: Via Koyeb Console (SSH)

1. Vai su Koyeb → Il tuo Service → **"Web Terminal"**
2. Esegui:

```bash
# Applica lo schema base
psql $DATABASE_URL -f server/db/schema.sql

# Applica lo schema esteso (binario, ranks, etc.)
psql $DATABASE_URL -f server/db/schema_extended.sql
```

### Metodo 2: Da Locale (consigliato)

```bash
# Copia la DATABASE_URL da Koyeb
export DATABASE_URL="postgresql://..."

# Applica gli schema
psql $DATABASE_URL -f server/db/schema.sql
psql $DATABASE_URL -f server/db/schema_extended.sql
```

### Metodo 3: Via Script Node

```bash
export DATABASE_URL="postgresql://..."
node scripts/setup-flyio-database.js
```

---

## ✅ Step 5: Verifica il Deploy

1. **Controlla i logs** su Koyeb → Service → Logs
2. **Accedi all'app**: `https://tuoapp-xxxxx.koyeb.app`
3. **Testa la registrazione** e il login

### URL di Test

- **Homepage**: `https://tuoapp.koyeb.app`
- **Login**: `https://tuoapp.koyeb.app/login`
- **API Health**: `https://tuoapp.koyeb.app/api/health`

---

## 🔄 Deploy Automatici

Koyeb fa automaticamente il redeploy quando:
- Fai push su GitHub (branch `master`)
- Modifichi variabili d'ambiente

Per disabilitare l'auto-deploy:
- Koyeb Console → App Settings → Disable "Auto-deploy"

---

## 📊 Monitoraggio

### Logs
- Koyeb Console → Service → **Logs** (real-time)

### Metriche
- Koyeb Console → Service → **Metrics**
  - CPU usage
  - Memory usage
  - Network I/O
  - Request count

### Health Checks
Koyeb esegue automaticamente health check su:
- **Path**: `/`
- **Port**: `8080`
- **Interval**: 10 secondi

---

## 💰 Costi Koyeb

| Piano | Prezzo | Risorse |
|-------|--------|---------|
| **Starter** | Gratuito | 1 nano instance, 512MB RAM |
| **Starter+** | €5.59/mese | 1 small instance, 1GB RAM |
| **Pro** | Da €11/mese | Multiple instances, autoscaling |

Il piano **Starter gratuito** è perfetto per iniziare e testare!

---

## 🆘 Troubleshooting

### L'app non si avvia

1. Controlla i **logs** su Koyeb
2. Verifica che `DATABASE_URL` sia corretto
3. Verifica che il database sia raggiungibile

### Errore "Connection refused" al DB

- Assicurati che il database Koyeb sia nella stessa region
- Se usi DB esterno, verifica che accetti connessioni esterne

### Build fallisce

1. Controlla che il `Dockerfile` sia corretto
2. Verifica che non ci siano errori TypeScript
3. Prova a buildare localmente: `docker build .`

### Variabili d'ambiente non funzionano

- Riavvia il service dopo aver modificato le variabili
- Verifica che non ci siano spazi extra nei valori

---

## 📝 Comandi Utili

```bash
# Login Koyeb CLI
koyeb login

# Lista apps
koyeb apps list

# Logs in tempo reale
koyeb service logs 3blex --follow

# Redeploy
koyeb service redeploy 3blex

# Scale
koyeb service scale 3blex --instances 2
```

---

## 🔗 Link Utili

- [Koyeb Dashboard](https://app.koyeb.com/)
- [Koyeb Docs](https://www.koyeb.com/docs)
- [GitHub Repository](https://github.com/errakui/3blex)
- [Koyeb CLI](https://www.koyeb.com/docs/cli)

---

*Deploy completato! La tua piattaforma 3Blex Network è ora online su Koyeb.* 🎉
