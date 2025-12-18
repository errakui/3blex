# Dockerfile per 3Blex Network su Fly.io
# Multi-stage build per ottimizzare l'immagine

# Stage 1: Build Next.js
FROM node:20-alpine AS nextjs-builder

WORKDIR /app

# Copia file di dipendenze
COPY package*.json ./
COPY next.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY tsconfig.json ./

# Installa dipendenze (incluso dev dependencies per build)
RUN npm ci

# Copia codice sorgente
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY public ./public
COPY server ./server
COPY scripts ./scripts
COPY server.js ./

# Build Next.js
RUN npm run build

# Stage 2: Produzione
FROM node:20-alpine AS production

WORKDIR /app

# Installa dumb-init per gestire i processi
RUN apk add --no-cache dumb-init

# Copia package.json
COPY package*.json ./

# Installa solo production dependencies
RUN npm ci --only=production

# Copia Next.js build da builder
COPY --from=nextjs-builder /app/.next ./.next
COPY --from=nextjs-builder /app/public ./public
COPY --from=nextjs-builder /app/next.config.js ./next.config.js
COPY --from=nextjs-builder /app/package.json ./package.json

# Copia server e altri file necessari
COPY --from=nextjs-builder /app/server ./server
COPY --from=nextjs-builder /app/server.js ./server.js
COPY --from=nextjs-builder /app/app ./app
COPY --from=nextjs-builder /app/lib ./lib
COPY --from=nextjs-builder /app/components ./components
COPY --from=nextjs-builder /app/scripts ./scripts

# Crea directory per uploads
RUN mkdir -p server/uploads && chmod 755 server/uploads

# Esponi porta (Fly.io userà PORT environment variable)
EXPOSE 8080

# Variabili ambiente
ENV NODE_ENV=production
ENV PORT=8080

# Usa dumb-init per gestire i segnali correttamente
ENTRYPOINT ["dumb-init", "--"]

# Avvia il server custom (Next.js + Express)
CMD ["node", "server.js"]

