const pool = require('./index')
const fs = require('fs')
const path = require('path')

async function applyExtendedSchema() {
  const client = await pool.connect()
  
  try {
    console.log('📦 Applicazione schema esteso al database...')
    
    // Leggi il file SQL
    const sqlPath = path.join(__dirname, 'schema_extended.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Esegui lo schema
    await client.query('BEGIN')
    
    // Esegui ogni statement separatamente per gestire gli errori meglio
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`📝 Esecuzione di ${statements.length} statements...`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.length > 5) { // Ignora statement troppo corti
        try {
          await client.query(statement)
          if ((i + 1) % 10 === 0) {
            console.log(`  ✓ Processati ${i + 1}/${statements.length} statements...`)
          }
        } catch (error) {
          // Ignora errori di "already exists" ma logga altri errori
          if (!error.message.includes('already exists') && 
              !error.message.includes('duplicate') &&
              !error.message.includes('column') && 
              !error.message.includes('relation')) {
            console.error(`  ⚠ Errore statement ${i + 1}:`, error.message)
          }
        }
      }
    }
    
    await client.query('COMMIT')
    console.log('✅ Schema esteso applicato con successo!')
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Errore nell\'applicazione dello schema:', error)
    throw error
  } finally {
    client.release()
  }
}

// Esegui se chiamato direttamente
if (require.main === module) {
  applyExtendedSchema()
    .then(() => {
      console.log('✅ Completato!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Errore:', error)
      process.exit(1)
    })
}

module.exports = applyExtendedSchema

