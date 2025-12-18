/**
 * Script completo setup database Fly.io
 * - Applica schema completo
 * - Importa prodotti Mellow con immagini
 * - Crea utente admin
 */

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL non trovata!')
  console.log('\n💡 Usa: DATABASE_URL="postgresql://..." node scripts/setup-complete-flyio.js')
  process.exit(1)
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('flympg.net') || DATABASE_URL.includes('fly.dev') ? {
    rejectUnauthorized: false
  } : false
})

// Prodotti Mellow completi
const mellowProducts = [
  {
    name: 'Mellow® Sonno Profondo - Supergelée alle More',
    description: 'Trasforma la sera in un rituale di relax. Le supergelée al mirtillo Mellow uniscono gusto e funzionalità con Melatonina, GABA, Griffonia, Magnesio e Passiflora per favorire il rilassamento, migliorare la qualità del sonno e risvegliarti più lucido e rigenerato.\n\nBenefici:\n• Induce rilassamento profondo\n• Migliora la qualità del sonno\n• Riduce risvegli notturni\n• Favorisce lucidità mentale',
    price: 34.90,
    price_vip: 32.90,
    price_affiliate: 29.90,
    category: 'mellow',
    image_url: 'https://try-mellow.com/cdn/shop/files/prova1.jpg?v=1760618140&width=1100',
    stock: 100,
  },
  {
    name: 'Mellow® Ashwaganda - Supergelée alla Fragola',
    description: 'Ritrova calma ed equilibrio in modo naturale. Le nostre gummies alla fragola combinano gusto delicato e azione adattogena grazie a una formula sinergica con Ashwagandha KSM 66®, Magnesio, Vitamina B6, Rodiola e L-Teanina.',
    price: 34.90,
    price_vip: 32.90,
    price_affiliate: 29.90,
    category: 'mellow',
    image_url: 'https://try-mellow.com/cdn/shop/files/Ashwaganda.jpg',
    stock: 100,
  },
  {
    name: 'Mellow® Anti-Age - Gummies alla Mela Verde',
    description: 'Integratore in super-gelée anti-age con Resveratrolo, Acido Ialuronico, Collagene Marino, Vitamina C, Coenzima Q10.',
    price: 34.90,
    price_vip: 32.90,
    price_affiliate: 29.90,
    category: 'mellow',
    image_url: 'https://try-mellow.com/cdn/shop/files/1_guarantee.jpg?v=1761066260&width=1100',
    stock: 100,
  },
  {
    name: 'Mellow® Lipo Fianchi - Supergelée agli Agrumi',
    description: 'Supergelée Mellow® Lipo Fianchi per supportare il drenaggio e la riduzione della ritenzione idrica.',
    price: 34.90,
    price_vip: 32.90,
    price_affiliate: 29.90,
    category: 'mellow',
    image_url: 'https://try-mellow.com/cdn/shop/files/60_guarantee_05b11e50-b919-40bb-a636-93be56bd8eba.jpg',
    stock: 100,
  },
  {
    name: 'Mellow® Capelli e Unghie - Supergelée Uva Rossa',
    description: 'Supergelée Mellow® Capelli e Unghie per supportare la forza e la crescita di capelli e unghie.',
    price: 34.90,
    price_vip: 32.90,
    price_affiliate: 29.90,
    category: 'mellow',
    image_url: 'https://try-mellow.com/cdn/shop/files/60_guarantee_7885a9d8-faad-47fe-8009-6519ef678ac3.jpg?v=1761222450&width=1100',
    stock: 100,
  },
  {
    name: 'Mellow® Dolori Articolari – Supergelée alla Vaniglia',
    description: 'Supergelée Mellow® Dolori Articolari per supportare la mobilità articolare e il recupero post-workout.',
    price: 34.90,
    price_vip: 32.90,
    price_affiliate: 29.90,
    category: 'mellow',
    image_url: 'https://try-mellow.com/cdn/shop/files/60_guarantee_7885a9d8-faad-47fe-8009-6519ef678ac3.jpg',
    stock: 100,
  },
]

async function executeSQLFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File non trovato: ${filePath}`)
    return
  }

  const sql = fs.readFileSync(filePath, 'utf8')
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'))

  for (const statement of statements) {
    if (statement) {
      try {
        await pool.query(statement)
      } catch (error) {
        if (!error.message.includes('already exists') && 
            !error.message.includes('duplicate') &&
            !error.message.includes('does not exist')) {
          console.warn(`⚠️  ${error.message.substring(0, 80)}`)
        }
      }
    }
  }
}

async function applySchemas() {
  console.log('📄 Applicazione schema database...\n')
  
  const schemas = [
    path.join(__dirname, '..', 'server/db/schema.sql'),
    path.join(__dirname, '..', 'server/db/schema_extended.sql'),
  ]

  // Verifica se esiste schema_broadcast.sql
  const broadcastSchema = path.join(__dirname, '..', 'server/db/schema_broadcast.sql')
  if (fs.existsSync(broadcastSchema)) {
    schemas.push(broadcastSchema)
  }

  for (const schemaPath of schemas) {
    const fileName = path.basename(schemaPath)
    console.log(`📄 Applicazione ${fileName}...`)
    await executeSQLFile(schemaPath)
    console.log(`✅ ${fileName} applicato!\n`)
  }
}

async function importProducts() {
  console.log('📦 Importazione prodotti Mellow...\n')
  
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    let inserted = 0
    let updated = 0
    
    for (const product of mellowProducts) {
      const existing = await client.query(
        'SELECT id FROM products WHERE name = $1',
        [product.name]
      )
      
      if (existing.rows.length > 0) {
        // Aggiorna
        await client.query(
          `UPDATE products 
           SET description = $1, price = $2, category = $3, 
               image = $4, stock = $5, updated_at = NOW()
           WHERE name = $6`,
          [
            product.description,
            product.price,
            product.category,
            product.image_url,
            product.stock,
            product.name
          ]
        )
        updated++
      } else {
        // Inserisci
        await client.query(
          `INSERT INTO products (
            name, description, price, category, image, stock, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          [
            product.name,
            product.description,
            product.price,
            product.category,
            product.image_url,
            product.stock
          ]
        )
        inserted++
        console.log(`✅ Inserito: ${product.name}`)
      }
    }
    
    await client.query('COMMIT')
    console.log(`\n✅ Importazione completata: ${inserted} inseriti, ${updated} aggiornati\n`)
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Errore importazione:', error.message)
    throw error
  } finally {
    client.release()
  }
}

async function createAdminUser() {
  console.log('👤 Creazione utente admin...\n')
  
  const adminEmail = 'admin@3blex.com'
  const adminPassword = 'admin123'
  const hashedPassword = await bcrypt.hash(adminPassword, 10)
  
  const client = await pool.connect()
  try {
    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    )
    
    if (existing.rows.length > 0) {
      console.log('⚠️  Admin già esistente, aggiorno password...')
      await client.query(
        'UPDATE users SET password_hash = $1, role = $2, subscription_status = $3, kyc_status = $4 WHERE email = $5',
        [hashedPassword, 'admin', 'active', 'approved', adminEmail]
      )
    } else {
      await client.query(
        `INSERT INTO users (email, password_hash, name, role, subscription_status, kyc_status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [adminEmail, hashedPassword, 'Admin', 'admin', 'active', 'approved']
      )
      console.log('✅ Utente admin creato!')
    }
    
    console.log(`\n📧 Credenziali Admin:`)
    console.log(`   Email: ${adminEmail}`)
    console.log(`   Password: ${adminPassword}\n`)
    
  } catch (error) {
    console.error('❌ Errore creazione admin:', error.message)
    throw error
  } finally {
    client.release()
  }
}

async function main() {
  try {
    console.log('🚀 SETUP COMPLETO DATABASE FLY.IO')
    console.log('='.repeat(50) + '\n')
    
    // Test connessione
    console.log('🔌 Test connessione...')
    await pool.query('SELECT NOW()')
    console.log('✅ Connesso!\n')
    
    // Schema
    await applySchemas()
    
    // Prodotti
    await importProducts()
    
    // Admin
    await createAdminUser()
    
    console.log('='.repeat(50))
    console.log('✅✅✅ SETUP COMPLETATO! ✅✅✅\n')
    console.log('🌐 App: https://3blex-network.fly.dev')
    console.log('📧 Login: admin@3blex.com / admin123\n')
    
  } catch (error) {
    console.error('\n❌ Errore:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()

