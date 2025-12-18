# 3Blex Network - Piattaforma di Network Marketing

Software professionale web-based per Network Marketing (MLM) con gestione completa di affiliati, abbonamenti, commissioni e KYC.

## 🎯 Caratteristiche

- **Sistema di Autenticazione JWT** con gestione ruoli
- **Dashboard Network** per utenti paganti
- **Sistema Commissioni 20%** automatico
- **Verifica KYC** con upload documenti
- **E-commerce integrato** con catalogo e ordini
- **Abbonamenti** mensili/annuali con Stripe
- **Pannello Admin** completo

## 🛠️ Stack Tecnologico

### Frontend
- Next.js 14
- React 18
- TailwindCSS
- TypeScript
- Lucide React (icone)

### Backend
- Node.js
- Express
- PostgreSQL
- JWT (autenticazione)
- Stripe (pagamenti)
- Multer (upload file)

## 📋 Prerequisiti

- Node.js 18+
- PostgreSQL 12+
- Stripe Account (per i pagamenti)

## 🚀 Installazione

1. **Clona il repository**
```bash
git clone <repository-url>
cd 3blex
```

2. **Installa le dipendenze**
```bash
npm install
```

3. **Configura il database**
```bash
# Crea il database PostgreSQL
createdb 3blex_network

# Esegui lo schema SQL
psql -d 3blex_network -f server/db/schema.sql
```

4. **Configura le variabili d'ambiente**
```bash
cp .env.example .env
```

Modifica `.env` con le tue configurazioni:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/3blex_network
JWT_SECRET=your-super-secret-jwt-key
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
FRONTEND_URL=http://localhost:3000
```

5. **Crea la directory uploads**
```bash
mkdir -p server/uploads
```

## 🏃 Avvio

### Sviluppo

**Terminale 1 - Frontend (Next.js)**
```bash
npm run dev
```

**Terminale 2 - Backend (Express)**
```bash
npm run server
```

Il frontend sarà disponibile su `http://localhost:3000`
Il backend sarà disponibile su `http://localhost:3001`

### Produzione

```bash
npm run build
npm start
```

## 📁 Struttura del Progetto

```
3blex/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Dashboard principale
│   ├── login/             # Pagina di login
│   ├── register/          # Pagina di registrazione
│   ├── network/           # Dashboard Network
│   ├── kyc/               # Verifica KYC
│   ├── subscription/      # Abbonamenti
│   ├── products/          # Catalogo prodotti
│   └── orders/            # Ordini utente
├── components/            # Componenti React
│   ├── ui/               # Componenti UI riutilizzabili
│   └── layout/           # Componenti layout
├── server/                # Backend Express
│   ├── routes/           # Route API
│   ├── middleware/       # Middleware (auth, etc.)
│   ├── db/               # Database (schema, pool)
│   └── uploads/          # File caricati (KYC)
└── assets/               # Asset statici (logo, etc.)
```

## 👥 Ruoli Utente

### 1. Affiliate Basic
- Registrazione gratuita
- Accesso limitato
- Può acquistare prodotti
- NON può accedere al Network

### 2. Network Member
- Utente pagante
- Accesso completo al Network
- Link di referral personale
- Commissioni 20% su nuovi affiliati paganti
- Dashboard Network completa

### 3. Admin
- Accesso completo al sistema
- Gestione utenti, prodotti, ordini
- Approvazione KYC
- Gestione commissioni

## 💳 Sistema Commissioni

- **20%** su ogni nuovo affiliato che acquista un abbonamento
- Commissioni in stato **pending** fino all'approvazione KYC del referrer
- Una volta verificato il KYC, le commissioni diventano **available**
- L'admin può pagare le commissioni cambiandone lo stato a **paid**

## 🔐 Sistema KYC

1. L'utente carica i documenti (ID, passaporto, etc.)
2. I documenti vengono salvati in `server/uploads`
3. L'admin li rivede e approva/rifiuta
4. Con KYC approvato, l'utente può prelevare commissioni

## 🎨 Design

Il design utilizza la palette colori:
- **Viola principale**: #9F08F9
- **Viola scuro**: #623386
- **Accento**: #C796E1
- **Background**: #FBFAFC
- **Bordo**: #E5E4E5

## 📝 Note

- Il logo si trova in `assets/logo.png`
- Le variabili d'ambiente sono necessarie per il funzionamento
- Stripe deve essere configurato per i pagamenti
- PostgreSQL deve essere in esecuzione

## 🔧 Troubleshooting

**Errore connessione database**
- Verifica che PostgreSQL sia in esecuzione
- Controlla DATABASE_URL in `.env`

**Errore upload file**
- Verifica che `server/uploads` esista
- Controlla i permessi della directory

**Errore Stripe**
- Verifica le chiavi API in `.env`
- Controlla che il webhook sia configurato correttamente

## 📄 Licenza

Proprietario - 3Blex Network

