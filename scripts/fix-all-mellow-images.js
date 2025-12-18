const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/3blex_network',
})

// Link immagini CORRETTI per ogni prodotto - da verificare uno per uno
const productImages = {
  'Mellow® Sonno Profondo - Supergelée alle More': 'https://try-mellow.com/cdn/shop/files/prova1.jpg?v=1760618140&width=1100',
  'Mellow® Ashwaganda - Supergelée alla Fragola': 'https://try-mellow.com/cdn/shop/files/Ashwaganda.jpg',
  'Mellow® Anti-Age - Gummies alla Mela Verde': 'https://try-mellow.com/cdn/shop/files/1_guarantee.jpg?v=1761066260&width=1100',
  'Mellow® Lipo Fianchi - Supergelée agli Agrumi': 'https://try-mellow.com/cdn/shop/files/60_guarantee_05b11e50-b919-40bb-a636-93be56bd8eba.jpg',
  'Mellow® Capelli e Unghie - Supergelée Uva Rossa': 'https://try-mellow.com/cdn/shop/files/60_guarantee.jpg?v=1761074961&width=1100',
  'Mellow® Dolori Articolari – Supergelée alla Vaniglia': 'https://try-mellow.com/cdn/shop/files/60_guarantee_7885a9d8-faad-47fe-8009-6519ef678ac3.jpg?v=1761222450&width=1100',
}

async function fixAllImages() {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    
    console.log('🔄 Correzione IMMAGINI PRODOTTI MELLOW...\n')
    
    // Prima vediamo quali prodotti esistono
    const allProducts = await client.query(
      "SELECT id, name FROM products WHERE category = 'mellow' ORDER BY id"
    )
    
    console.log('📦 Prodotti trovati nel database:')
    allProducts.rows.forEach(p => {
      console.log(`  - ID ${p.id}: ${p.name}`)
    })
    console.log('')
    
    // Aggiorna ogni prodotto con la sua immagine corretta
    for (const [productName, imageUrl] of Object.entries(productImages)) {
      const result = await client.query(
        'UPDATE products SET image_url = $1 WHERE name = $2 RETURNING id, name',
        [imageUrl, productName]
      )
      
      if (result.rows.length > 0) {
        console.log(`✅ ${result.rows[0].id}. ${result.rows[0].name}`)
        console.log(`   🖼️  ${imageUrl.substring(0, 80)}...`)
      } else {
        console.log(`⚠️  Prodotto NON trovato: ${productName}`)
      }
    }
    
    await client.query('COMMIT')
    
    console.log('\n✅ Verifica finale:')
    const verify = await client.query(
      "SELECT id, name, image_url FROM products WHERE category = 'mellow' ORDER BY id"
    )
    
    verify.rows.forEach(p => {
      console.log(`\n${p.id}. ${p.name}`)
      console.log(`   Immagine: ${p.image_url}`)
    })
    
    console.log('\n✅ Tutte le immagini sono state aggiornate!')
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Errore:', error.message)
    throw error
  } finally {
    client.release()
  }
}

fixAllImages()
  .then(() => {
    console.log('\n🎉 Processo completato!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Errore fatale:', error.message)
    process.exit(1)
  })

