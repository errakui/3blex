# 🚀 3Blex Network - Piattaforma MLM Binaria

Sistema professionale di Network Marketing (MLM) con struttura binaria a due gambe, commissioni multilivello e gestione completa affiliati.

## 📋 Caratteristiche Principali

### Sistema Binario Puro
- **Albero a 2 gambe** (left/right) con spillover automatico
- **Posizionamento BFS** per trovare il primo slot disponibile
- **Auto-balance** sulla gamba più debole
- **Sponsor Tree separato** dal Binary Tree

### Sistema Commissioni
| Tipo | Percentuale | Descrizione |
|------|-------------|-------------|
| **Diretta** | 20% | Sul primo ordine degli sponsorizzati diretti |
| **Binaria** | 10% | Sulla gamba debole (settimanale) |
| **Multilivello** | 5-0.25% | Fino a 10 livelli sullo Sponsor Tree |

### Sistema Qualifiche
| Rank | PV | Left Vol. | Right Vol. | Diretti Attivi | Bonus |
|------|-----|-----------|-----------|----------------|-------|
| Bronze | 100 | - | - | - | €0 |
| Silver | 100 | 1,000 | 1,000 | 2 | €100 |
| Gold | 200 | 5,000 | 5,000 | 4 | €500 |
| Platinum | 500 | 25,000 | 25,000 | 6 | €2,000 |
| Diamond | 1,000 | 100,000 | 100,000 | 10 | €10,000 |

## 🛠️ Stack Tecnologico

- **Frontend**: Next.js 14, React 18, TailwindCSS, TypeScript
- **Backend**: Node.js, Express, PostgreSQL
- **Auth**: JWT
- **Payments**: Stripe (opzionale)

## 🚀 Quick Start

### 1. Clona e installa

```bash
git clone https://github.com/errakui/3blex.git
cd 3blex
npm install
```

### 2. Configura l'ambiente

```bash
cp env.example .env
# Modifica .env con le tue configurazioni
```

Variabili richieste:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/3blex_network
JWT_SECRET=genera-una-stringa-sicura-32-caratteri
PORT=8080
```

### 3. Inizializza il database

```bash
# Crea il database
createdb 3blex_network

# Applica lo schema e crea admin
npm run db:init
```

### 4. Avvia il server

```bash
# Development
npm run dev

# Production
npm start
```

L'app sarà disponibile su `http://localhost:8080`

## 📚 API Endpoints

### Autenticazione
```
POST /api/auth/register     - Registrazione
POST /api/auth/login        - Login
GET  /api/auth/me           - Profilo utente
PUT  /api/auth/profile      - Aggiorna profilo
```

### Network
```
GET  /api/network/binary-tree     - Albero binario
GET  /api/network/binary-stats    - Statistiche binarie
GET  /api/network/sponsor-tree    - Sponsor tree
GET  /api/network/directs         - Affiliati diretti
GET  /api/network/upline          - Upline sponsor
GET  /api/network/downline        - Downline completa
POST /api/network/place           - Posiziona affiliato
```

### Commissioni
```
GET  /api/commissions             - Lista commissioni
GET  /api/commissions/summary     - Riepilogo per tipo
GET  /api/commissions/binary-history - Storico binario
```

### Wallet
```
GET  /api/wallet                  - Saldo e statistiche
GET  /api/wallet/transactions     - Storico transazioni
POST /api/wallet/withdraw         - Richiedi prelievo
GET  /api/wallet/withdrawals      - Storico prelievi
```

### Qualifiche
```
GET  /api/qualifications/ranks       - Lista rank
GET  /api/qualifications/my-progress - Progresso verso next rank
GET  /api/qualifications/history     - Storico qualifiche
GET  /api/qualifications/leaderboard - Classifica
```

## 📁 Struttura Progetto

```
3blex/
├── app/                    # Next.js App Router (Frontend)
├── components/             # Componenti React
├── server/
│   ├── db/
│   │   └── schema_3blex.sql   # Schema database completo
│   ├── middleware/
│   │   └── auth.js            # JWT authentication
│   ├── routes/                # API routes
│   │   ├── auth.js
│   │   ├── network.js
│   │   ├── commissions.js
│   │   ├── wallet.js
│   │   └── qualifications.js
│   └── services/              # Business logic
│       ├── BinaryTreeService.js
│       ├── SponsorTreeService.js
│       ├── CommissionService.js
│       ├── WalletService.js
│       ├── RankService.js
│       └── UserService.js
├── scripts/
│   └── init-database.js    # Script inizializzazione DB
├── server.js               # Entry point (Next.js + Express)
└── 3blex.md                # Specifiche tecniche complete
```

## 🔧 Deploy su Koyeb

Vedi [DEPLOY_KOYEB.md](./DEPLOY_KOYEB.md) per la guida completa.

Quick deploy:
1. Crea database PostgreSQL su Koyeb
2. Connetti il repo GitHub
3. Configura variabili ambiente
4. Deploy!

## 📖 Documentazione Tecnica

Il file `3blex.md` contiene:
- Specifiche complete del sistema binario
- Algoritmi di placement e spillover
- Logica commissioni dettagliata
- Schema database completo
- Flussi operativi

## 🆘 Troubleshooting

### Errore connessione DB
```bash
# Verifica che PostgreSQL sia attivo
pg_isready -h localhost -p 5432

# Verifica DATABASE_URL
psql $DATABASE_URL -c "SELECT 1"
```

### Reset database
```bash
npm run db:reset
```

### Logs
```bash
# I log sono visibili nella console del server
npm run dev
```

## 📄 Licenza

Proprietario - 3Blex Network © 2024

---

Made with ❤️ for the MLM community
