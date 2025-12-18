/**
 * Script completo per setup database Fly.io
 * - Applica schema
 * - Importa prodotti Mellow
 * - Crea utente admin
 */

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

// Connection string da Fly.io secrets
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL non trovata!')
  console.log('\n💡 Per eseguire questo script:')
  console.log('   1. Ottieni la connection string: fly secrets get DATABASE_URL -a 3blex-network')
  console.log('   2. Esegui: DATABASE_URL="postgresql://..." node scripts/setup-flyio-database.js')
  process.exit(1)
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('flympg.net') ? {
    rejectUnauthorized: false
  } : false
})

// Prodotti Mellow
const mellowProducts = require('./import-mellow-products.js').mellowProducts || []

async function applySchema() {
  console.log('📄 Applicazione schema database...\n')
  
  const schemas = [
    'server/db/schema.sql',
    'server/db/schema_extended.sql',
    'server/db/schema_broadcast.sql'
  ]

  for (const schemaFile of schemas) {
    const schemaPath = path.join(__dirname, '..', schemaFile)
    if (fs.existsSync(schemaPath)) {
      console.log(`📄 Applicazione ${schemaFile}...`)
      const schema = fs.readFileSync(schemaPath, 'utf8')
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        if (statement) {
          try {
            await pool.query(statement)
          } catch (error) {
            // Ignora errori "already exists"
            if (!error.message.includes('already exists') && 
                !error.message.includes('duplicate') &&
                !error.message.includes('does not exist')) {
              console.warn(`⚠️  ${error.message.substring(0, 100)}`)
            }
          }
        }
      }
      console.log(`✅ ${schemaFile} applicato!\n`)
    }
  }
}

async function importProducts() {
  console.log('📦 Importazione prodotti Mellow...\n')
  
  const productsScript = path.join(__dirname, 'import-mellow-products.js')
  if (fs.existsSync(productsScript)) {
    // Usa lo script esistente
    const scriptContent = fs.readFileSync(productsScript, 'utf8')
    // Estrai i prodotti dallo script
    const productsMatch = scriptContent.match(/const mellowProducts = \[([\s\S]*?)\]/)
    
    if (productsMatch) {
      console.log('📦 Prodotti trovati nello script, importo...')
      // Importa i prodotti usando lo script esistente
      const { exec } = require('child_process')
      return new Promise((resolve, reject) => {
        exec(`DATABASE_URL="${DATABASE_URL}" node ${productsScript}`, (error, stdout, stderr) => {
          if (error) {
            console.error('Errore importazione:', error)
            reject(error)
          } else {
            console.log(stdout)
            resolve()
          }
        })
      })
    }
  }
  
  console.log('⚠️  Script import-mellow-products.js non trovato o non valido')
}

async function createAdminUser() {
  console.log('👤 Creazione utente admin...\n')
  
  const adminEmail = 'admin@3blex.com'
  const adminPassword = 'admin123'
  const hashedPassword = await bcrypt.hash(adminPassword, 10)
  
  try {
    // Verifica se l'admin esiste già
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    )
    
    if (existing.rows.length > 0) {
      console.log('⚠️  Utente admin già esistente, aggiorno password...')
      await pool.query(
        'UPDATE users SET password_hash = $1, role = $2 WHERE email = $3',
        [hashedPassword, 'admin', adminEmail]
      )
      console.log('✅ Password admin aggiornata!')
    } else {
      await pool.query(
        `INSERT INTO users (email, password_hash, name, role, subscription_status, kyc_status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [adminEmail, hashedPassword, 'Admin', 'admin', 'active', 'approved']
      )
      console.log('✅ Utente admin creato!')
    }
    
    console.log(`\n📧 Email: ${adminEmail}`)
    console.log(`🔑 Password: ${adminPassword}`)
    
  } catch (error) {
    console.error('❌ Errore creazione admin:', error.message)
    throw error
  }
}

async function main() {
  try {
    console.log('🚀 Setup database Fly.io per 3Blex Network\n')
    console.log('=' .repeat(50) + '\n')
    
    // Test connessione
    console.log('🔌 Test connessione database...')
    await pool.query('SELECT NOW()')
    console.log('✅ Connesso!\n')
    
    // Applica schema
    await applySchema()
    
    // Importa prodotti
    await importProducts()
    
    // Crea admin
    await createAdminUser()
    
    console.log('\n' + '='.repeat(50))
    console.log('✅✅✅ SETUP COMPLETATO! ✅✅✅\n')
    console.log('📧 Admin Login:')
    console.log('   Email: admin@3blex.com')
    console.log('   Password: admin123\n')
    
  } catch (error) {
    console.error('\n❌ Errore durante setup:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()

