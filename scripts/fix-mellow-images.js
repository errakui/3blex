const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/3blex_network',
})

// Link immagini corrette da CDN Shopify
const imageLinks = {
  'Mellow® Sonno Profondo - Supergelée alle More': 'https://try-mellow.com/cdn/shop/files/prova1.jpg?v=1760618140&width=1100',
  'Mellow® Ashwaganda - Supergelée alla Fragola': 'https://try-mellow.com/cdn/shop/files/Ashwaganda.jpg',
  'Mellow® Anti-Age - Gummies alla Mela Verde': 'https://try-mellow.com/cdn/shop/files/1_guarantee.jpg?v=1761066260&width=1100',
  'Mellow® Lipo Fianchi - Supergelée agli Agrumi': 'https://try-mellow.com/cdn/shop/files/60_guarantee_05b11e50-b919-40bb-a636-93be56bd8eba.jpg',
  'Mellow® Capelli e Unghie - Supergelée Uva Rossa': 'https://try-mellow.com/cdn/shop/files/60_guarantee_7885a9d8-faad-47fe-8009-6519ef678ac3.jpg',
  'Mellow® Dolori Articolari – Supergelée alla Vaniglia': 'https://try-mellow.com/cdn/shop/files/60_guarantee_7885a9d8-faad-47fe-8009-6519ef678ac3.jpg?v=1761222450&width=1100',
}

async function fixImages() {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    
    console.log('🔄 Correzione link immagini Mellow...\n')
    
    for (const [productName, imageUrl] of Object.entries(imageLinks)) {
      const result = await client.query(
        'UPDATE products SET image_url = $1 WHERE name = $2 RETURNING id',
        [imageUrl, productName]
      )
      
      if (result.rows.length > 0) {
        console.log(`✅ Immagine aggiornata: ${productName}`)
      } else {
        console.log(`⚠️  Prodotto non trovato: ${productName}`)
      }
    }
    
    await client.query('COMMIT')
    console.log('\n✅ Tutte le immagini sono state aggiornate!')
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Errore:', error.message)
    throw error
  } finally {
    client.release()
  }
}

fixImages()
  .then(() => {
    console.log('\n🎉 Processo completato!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Errore fatale:', error.message)
    process.exit(1)
  })

