/**
 * Script per applicare lo schema database su Fly.io
 * Usa la connection string dal secret DATABASE_URL
 */

require('dotenv').config()
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

async function applySchema() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL non trovata nelle variabili d\'ambiente')
    console.log('\n💡 Per ottenere la connection string:')
    console.log('   fly secrets get DATABASE_URL -a 3blex-network')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('🔌 Connessione al database Fly.io...')
    await pool.query('SELECT NOW()')
    console.log('✅ Connesso al database!\n')

    // Leggi e applica schema base
    const schemaPath = path.join(__dirname, '../server/db/schema.sql')
    if (fs.existsSync(schemaPath)) {
      console.log('📄 Applicazione schema.sql...')
      const schema = fs.readFileSync(schemaPath, 'utf8')
      const statements = schema.split(';').filter(s => s.trim().length > 0)

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await pool.query(statement)
          } catch (error) {
            // Ignora errori "already exists"
            if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
              console.warn(`⚠️  Warning: ${error.message}`)
            }
          }
        }
      }
      console.log('✅ Schema base applicato!\n')
    }

    // Leggi e applica schema esteso
    const extendedSchemaPath = path.join(__dirname, '../server/db/schema_extended.sql')
    if (fs.existsSync(extendedSchemaPath)) {
      console.log('📄 Applicazione schema_extended.sql...')
      const extendedSchema = fs.readFileSync(extendedSchemaPath, 'utf8')
      const statements = extendedSchema.split(';').filter(s => s.trim().length > 0)

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await pool.query(statement)
          } catch (error) {
            // Ignora errori "already exists"
            if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
              console.warn(`⚠️  Warning: ${error.message}`)
            }
          }
        }
      }
      console.log('✅ Schema esteso applicato!\n')
    }

    // Applica schema broadcast se esiste
    const broadcastSchemaPath = path.join(__dirname, '../server/db/schema_broadcast.sql')
    if (fs.existsSync(broadcastSchemaPath)) {
      console.log('📄 Applicazione schema_broadcast.sql...')
      const broadcastSchema = fs.readFileSync(broadcastSchemaPath, 'utf8')
      const statements = broadcastSchema.split(';').filter(s => s.trim().length > 0)

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await pool.query(statement)
          } catch (error) {
            if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
              console.warn(`⚠️  Warning: ${error.message}`)
            }
          }
        }
      }
      console.log('✅ Schema broadcast applicato!\n')
    }

    console.log('✅✅✅ Schema database applicato con successo! ✅✅✅\n')

  } catch (error) {
    console.error('❌ Errore durante l\'applicazione dello schema:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

applySchema()

