/**
 * Route temporanea per setup iniziale database
 * IMPORTANTE: Rimuovere questa route dopo il setup!
 */

const express = require('express')
const router = express.Router()
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')

// Connection pool - use SSL for production databases
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
    rejectUnauthorized: false
  }
})

async function executeSQLFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { success: false, message: `File non trovato: ${filePath}` }
  }

  const sql = fs.readFileSync(filePath, 'utf8')
  let cleanSQL = sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n')
  
  const statements = cleanSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length > 10)

  const results = []
  for (const statement of statements) {
    if (statement) {
      try {
        await pool.query(statement)
        results.push({ success: true })
      } catch (error) {
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            error.message.includes('does not exist')) {
          results.push({ success: true, warning: error.message.substring(0, 80) })
        } else {
          console.error(`❌ SQL Error: ${error.message}`)
          results.push({ success: false, message: error.message })
        }
      }
    }
  }
  return { success: true, results }
}

// Route per applicare solo lo schema email
router.post('/apply-email-schema', async (req, res) => {
  try {
    const schemaFile = path.join(__dirname, '../db/schema_email_updates.sql')
    const result = await executeSQLFile(schemaFile)
    res.json({ success: true, result })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Route per resettare la password admin
router.post('/reset-admin-password', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash('Admin123!', 10)
    
    await pool.query(
      `UPDATE users SET password_hash = $1 WHERE email = $2`,
      [hashedPassword, 'admin@3blex.com']
    )
    
    res.json({ 
      success: true, 
      message: 'Password admin resettata',
      credentials: {
        email: 'admin@3blex.com',
        password: 'Admin123!'
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Route di setup completo
router.post('/setup-database', async (req, res) => {
  try {
    console.log('🚀 Setup database avviato...')
    
    const results = {
      schemas: [],
      admin: null
    }

    // 1. Applica schema
    const schemaFiles = [
      path.join(__dirname, '../db/schema_email_updates.sql')
    ]

    for (const schemaFile of schemaFiles) {
      if (fs.existsSync(schemaFile)) {
        const fileName = path.basename(schemaFile)
        console.log(`📄 Applicazione ${fileName}...`)
        const result = await executeSQLFile(schemaFile)
        results.schemas.push({ file: fileName, ...result })
      }
    }

    // 2. Aggiorna admin con password corretta
    console.log('👤 Aggiornamento admin...')
    const hashedPassword = await bcrypt.hash('Admin123!', 10)

    const existingAdmin = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@3blex.com']
    )

    if (existingAdmin.rows.length > 0) {
      await pool.query(
        'UPDATE users SET password_hash = $1, role = $2, status = $3, kyc_status = $4 WHERE email = $5',
        [hashedPassword, 'admin', 'active', 'approved', 'admin@3blex.com']
      )
      results.admin = { email: 'admin@3blex.com', password: 'Admin123!', action: 'updated' }
    }

    res.json({
      success: true,
      message: '✅ Setup completato!',
      results
    })

  } catch (error) {
    console.error('❌ Errore setup:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

module.exports = router
