/**
 * Production server starter
 * Avvia sia Express backend che Next.js frontend insieme
 */

require('dotenv').config()
const { spawn } = require('child_process')
const path = require('path')

const PORT = process.env.PORT || 8080
const API_PORT = process.env.API_PORT || 3001

console.log('🚀 Avvio 3Blex Network in produzione...')
console.log(`📡 Frontend port: ${PORT}`)
console.log(`🔌 Backend port: ${API_PORT}`)

// Avvia backend Express
console.log('📦 Avvio backend Express...')
const backend = spawn('node', ['server/index.js'], {
  env: {
    ...process.env,
    PORT: API_PORT,
    NODE_ENV: 'production'
  },
  stdio: 'inherit',
  cwd: path.join(__dirname, '..')
})

backend.on('error', (error) => {
  console.error('❌ Errore avvio backend:', error)
  process.exit(1)
})

backend.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Backend terminato con codice ${code}`)
    process.exit(code)
  }
})

// Attendi che il backend sia pronto
setTimeout(() => {
  console.log('🌐 Avvio frontend Next.js...')
  
  // Avvia Next.js
  const frontend = spawn('npm', ['start'], {
    env: {
      ...process.env,
      PORT: PORT,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || `http://localhost:${API_PORT}`,
      NODE_ENV: 'production'
    },
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  })

  frontend.on('error', (error) => {
    console.error('❌ Errore avvio frontend:', error)
    process.exit(1)
  })

  frontend.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Frontend terminato con codice ${code}`)
      process.exit(code)
    }
  })

  // Gestisci terminazione pulita
  process.on('SIGTERM', () => {
    console.log('🛑 Ricevuto SIGTERM, terminazione pulita...')
    backend.kill('SIGTERM')
    frontend.kill('SIGTERM')
    setTimeout(() => process.exit(0), 5000)
  })

  process.on('SIGINT', () => {
    console.log('🛑 Ricevuto SIGINT, terminazione pulita...')
    backend.kill('SIGINT')
    frontend.kill('SIGINT')
    setTimeout(() => process.exit(0), 5000)
  })

}, 3000) // Attendi 3 secondi per il backend

