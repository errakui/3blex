/**
 * Route temporanea per setup iniziale database Fly.io
 * IMPORTANTE: Rimuovere questa route dopo il setup!
 */

const express = require('express')
const router = express.Router()
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')

// Connection pool dal database Fly.io
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('fly.dev') || process.env.DATABASE_URL?.includes('flympg.net') ? {
    rejectUnauthorized: false
  } : false
})

// Prodotti Mellow
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
    return { success: false, message: `File non trovato: ${filePath}` }
  }

  const sql = fs.readFileSync(filePath, 'utf8')
  // Rimuovi commenti multi-riga e commenti singola riga
  let cleanSQL = sql
    .replace(/\/\*[\s\S]*?\*\//g, '') // Commenti multi-riga
    .split('\n')
    .filter(line => !line.trim().startsWith('--')) // Commenti singola riga
    .join('\n')
  
  const statements = cleanSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length > 10) // Rimuovi statement troppo corti

  const results = []
  for (const statement of statements) {
    if (statement) {
      try {
        await pool.query(statement)
        results.push({ success: true })
      } catch (error) {
        // Ignora errori "already exists" ma registra altri errori
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            error.message.includes('does not exist')) {
          // Ignora solo se è un errore "already exists" per tabelle/colonne
          if (error.message.includes('already exists')) {
            results.push({ success: true, skipped: true, message: error.message.substring(0, 80) })
          } else {
            // Per altri errori, mostra l'errore ma continua
            console.warn(`⚠️  SQL Warning: ${error.message.substring(0, 80)}`)
            results.push({ success: true, warning: error.message.substring(0, 80) })
          }
        } else {
          // Errori critici
          console.error(`❌ SQL Error: ${error.message}`)
          results.push({ success: false, message: error.message })
          // Non fermare l'esecuzione per errori non critici
        }
      }
    }
  }
  return { success: true, results }
}

// Route di setup
router.post('/setup-database', async (req, res) => {
  try {
    console.log('🚀 Setup database avviato...')
    
    const results = {
      schemas: [],
      products: { inserted: 0, updated: 0 },
      admin: null
    }

    // 1. Applica schema
    const schemaFiles = [
      path.join(__dirname, '../db/schema.sql'),
      path.join(__dirname, '../db/schema_extended.sql'),
      path.join(__dirname, '../db/schema_broadcast.sql'),
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

    // 2. Importa prodotti
    console.log('📦 Importazione prodotti...')
    for (const product of mellowProducts) {
      const existing = await pool.query(
        'SELECT id FROM products WHERE name = $1',
        [product.name]
      )

      if (existing.rows.length > 0) {
        await pool.query(
          `UPDATE products 
           SET description = $1, price = $2, category = $3, 
               image_url = $4, stock = $5, updated_at = NOW()
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
        results.products.updated++
      } else {
        await pool.query(
          `INSERT INTO products (
            name, description, price, category, image_url, stock, created_at, updated_at
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
        results.products.inserted++
      }
    }

    // 3. Crea admin
    console.log('👤 Creazione admin...')
    const adminEmail = 'admin@3blex.com'
    const adminPassword = 'admin123'
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    const existingAdmin = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    )

    if (existingAdmin.rows.length > 0) {
      await pool.query(
        'UPDATE users SET password_hash = $1, role = $2, subscription_status = $3, kyc_status = $4 WHERE email = $5',
        [hashedPassword, 'admin', 'active', 'approved', adminEmail]
      )
      results.admin = { email: adminEmail, password: adminPassword, action: 'updated' }
    } else {
      await pool.query(
        `INSERT INTO users (email, password_hash, name, role, subscription_status, kyc_status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [adminEmail, hashedPassword, 'Admin', 'admin', 'active', 'approved']
      )
      results.admin = { email: adminEmail, password: adminPassword, action: 'created' }
    }

    // Verifica finale
    const productCount = await pool.query("SELECT COUNT(*) as count FROM products WHERE category = 'mellow'")
    const adminCheck = await pool.query("SELECT email, role FROM users WHERE email = 'admin@3blex.com'")

    res.json({
      success: true,
      message: '✅ Setup completato!',
      results: {
        schemas: results.schemas,
        products: {
          ...results.products,
          total_mellow: productCount.rows[0].count
        },
        admin: results.admin,
        verification: {
          products_count: productCount.rows[0].count,
          admin_exists: adminCheck.rows.length > 0
        }
      }
    })

  } catch (error) {
    console.error('❌ Errore setup:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

module.exports = router

