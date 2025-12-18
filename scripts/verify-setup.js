const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')
require('dotenv').config()

async function verifySetup() {
  console.log('🔍 Verifica Setup 3Blex Network...\n')
  
  let errors = []
  let warnings = []

  // 1. Verifica file .env
  console.log('1. Verifica file .env...')
  if (!fs.existsSync('.env')) {
    errors.push('❌ File .env mancante!')
  } else {
    const envContent = fs.readFileSync('.env', 'utf8')
    const requiredVars = ['DATABASE_URL', 'JWT_SECRET']
    requiredVars.forEach(varName => {
      if (!envContent.includes(varName)) {
        errors.push(`❌ Variabile ${varName} mancante in .env`)
      }
    })
    console.log('   ✅ File .env presente')
  }

  // 2. Verifica directory uploads
  console.log('2. Verifica directory uploads...')
  const uploadDirs = [
    'server/uploads',
    'server/uploads/kyc',
    'server/uploads/invoices'
  ]
  uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`   ✅ Creata directory ${dir}`)
    } else {
      console.log(`   ✅ Directory ${dir} presente`)
    }
  })

  // 3. Verifica file critici
  console.log('3. Verifica file critici...')
  const criticalFiles = [
    'server/index.js',
    'server/db/index.js',
    'server/middleware/auth.js',
    'server/db/schema.sql',
    'server/db/schema_extended.sql',
    'package.json'
  ]
  criticalFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      errors.push(`❌ File mancante: ${file}`)
    } else {
      console.log(`   ✅ ${file}`)
    }
  })

  // 4. Verifica connessione database
  console.log('4. Verifica connessione database...')
  if (process.env.DATABASE_URL) {
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      })
      
      await pool.query('SELECT NOW()')
      console.log('   ✅ Database connesso')

      // Verifica tabelle principali
      const tablesResult = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `)
      
      const tables = tablesResult.rows.map(r => r.table_name)
      const requiredTables = ['users', 'orders', 'products', 'commissions', 'subscriptions']
      
      requiredTables.forEach(table => {
        if (!tables.includes(table)) {
          warnings.push(`⚠️  Tabella ${table} mancante - eseguire schema.sql`)
        } else {
          console.log(`   ✅ Tabella ${table} presente`)
        }
      })

      await pool.end()
    } catch (error) {
      errors.push(`❌ Errore connessione database: ${error.message}`)
    }
  } else {
    warnings.push('⚠️  DATABASE_URL non configurata in .env')
  }

  // 5. Verifica dipendenze package.json
  console.log('5. Verifica dipendenze...')
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const requiredDeps = ['express', 'pg', 'jsonwebtoken', 'bcryptjs', 'stripe']
  requiredDeps.forEach(dep => {
    if (!packageJson.dependencies[dep]) {
      errors.push(`❌ Dipendenza mancante: ${dep}`)
    } else {
      console.log(`   ✅ ${dep}`)
    }
  })

  // Riepilogo
  console.log('\n' + '='.repeat(50))
  console.log('📊 RIEPILOGO VERIFICA')
  console.log('='.repeat(50))

  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n✅ TUTTO OK! Progetto pronto per l\'avvio! 🚀\n')
    process.exit(0)
  } else {
    if (errors.length > 0) {
      console.log('\n❌ ERRORI CRITICI:')
      errors.forEach(err => console.log('  ' + err))
    }
    if (warnings.length > 0) {
      console.log('\n⚠️  AVVISI:')
      warnings.forEach(warn => console.log('  ' + warn))
    }
    console.log('\n')
    if (errors.length > 0) {
      process.exit(1)
    }
  }
}

verifySetup().catch(error => {
  console.error('❌ Errore durante la verifica:', error)
  process.exit(1)
})

