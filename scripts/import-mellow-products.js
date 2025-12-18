const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/3blex_network',
})

// Prodotti Mellow estratti da https://try-mellow.com con link CDN reali
const mellowProducts = [
  {
    name: 'Mellow® Sonno Profondo - Supergelée alle More',
    description: 'Trasforma la sera in un rituale di relax. Le supergelée al mirtillo Mellow uniscono gusto e funzionalità con Melatonina, GABA, Griffonia, Magnesio e Passiflora per favorire il rilassamento, migliorare la qualità del sonno e risvegliarti più lucido e rigenerato.\n\nBenefici:\n• Induce rilassamento profondo\n• Migliora la qualità del sonno\n• Riduce risvegli notturni\n• Favorisce lucidità mentale',
    price: 34.90,
    price_client: 34.90,
    price_vip: 32.90,
    price_affiliate: 29.90,
    category: 'mellow',
    subcategory: 'Sonno e Relax',
    image_url: 'https://try-mellow.com/cdn/shop/files/prova1.jpg?v=1760618140&width=1100',
    stock: 100,
  },
  {
    name: 'Mellow® Ashwaganda - Supergelée alla Fragola',
    description: 'Ritrova calma ed equilibrio in modo naturale. Le nostre gummies alla fragola combinano gusto delicato e azione adattogena grazie a una formula sinergica con Ashwagandha KSM 66®, Magnesio, Vitamina B6, Rodiola e L-Teanina. Insieme aiutano a ridurre lo stress e i livelli di cortisolo, migliorano la qualità del riposo e favoriscono concentrazione energia mentale e resistenza fisica. Un supporto quotidiano per affrontare la giornata con serenità e lucidità. Basta una piccola pausa Mellow per sentire la differenza.',
    price: 34.90,
    price_client: 34.90,
    price_vip: 32.90,
    price_affiliate: 29.90,
    category: 'mellow',
    subcategory: 'Difese e Mobilità',
    image_url: 'https://try-mellow.com/cdn/shop/files/Ashwaganda.jpg',
    stock: 100,
  },
  {
    name: 'Mellow® Anti-Age - Gummies alla Mela Verde',
    description: 'Integratore in super-gelée anti-age con Resveratrolo, Acido Ialuronico, Collagene Marino, Vitamina C, Coenzima Q10.\n\nBenefici:\n• Contrasta l\'invecchiamento cellulare\n• Stimola la produzione di collagene\n• Riduce rughe e discromie\n• Aumenta elasticità, tono e luminosità della pelle',
    price: 34.90,
    price_client: 34.90,
    price_vip: 32.90,
    price_affiliate: 29.90,
    category: 'mellow',
    subcategory: 'Bellezza e Pelle Giovane',
    image_url: 'https://try-mellow.com/products/mellow®-anti-age-gummies-alla-mela/1_guarantee.jpg',
    stock: 100,
  },
  {
    name: 'Mellow® Lipo Fianchi - Supergelée agli Agrumi',
    description: 'Supergelée Mellow® Lipo Fianchi per supportare il drenaggio e la riduzione della ritenzione idrica. Aiutano a sentirti più sgonfia e la pelle più tonica. Gusto agrumi, senza glutine. Consigliato l\'uso per più di un mese per vedere risultati concreti.',
    price: 34.90,
    price_client: 34.90,
    price_vip: 32.90,
    price_affiliate: 29.90,
    category: 'mellow',
    subcategory: 'Detox e Vitalità',
    image_url: 'https://try-mellow.com/cdn/shop/files/60_guarantee_05b11e50-b919-40bb-a636-93be56bd8eba.jpg',
    stock: 100,
  },
  {
    name: 'Mellow® Capelli e Unghie - Supergelée Uva Rossa',
    description: 'Supergelée Mellow® Capelli e Unghie per supportare la forza e la crescita di capelli e unghie. Formulate con ingredienti naturali per ridurre la caduta dei capelli e rinforzare le unghie.\n\nBenefici:\n• Riduce la caduta stagionale dei capelli\n• Favorisce una crescita più rapida e sana\n• Rafforza bulbo e fibra capillare\n• Unghie più forti e pelle più compatta\n\n30 supergelée | Gusto uva rossa\nValutazione: 4,95 su 5 (1.290+ recensioni)',
    price: 34.90,
    price_client: 34.90,
    price_vip: 32.90,
    price_affiliate: 29.90,
    category: 'mellow',
    subcategory: 'Bellezza e Pelle Giovane',
    image_url: 'https://try-mellow.com/cdn/shop/files/60_guarantee_7885a9d8-faad-47fe-8009-6519ef678ac3.jpg',
    stock: 100,
  },
  {
    name: 'Mellow® Dolori Articolari – Supergelée alla Vaniglia',
    description: 'Supergelée Mellow® Dolori Articolari per supportare la mobilità articolare e il recupero post-workout. Aiutano a sentire le articolazioni più sciolte e a recuperare meglio dopo gli allenamenti.\n\nBenefici:\n• Riduce dolore e infiammazione articolare\n• Migliora la flessibilità delle articolazioni\n• Favorisce la rigenerazione della cartilagine\n• Supporto quotidiano per articolazioni attive\n\n30 supergelée | Gusto vaniglia\nValutazione: 4,9 su 5 (220+ recensioni)',
    price: 34.90,
    price_client: 34.90,
    price_vip: 32.90,
    price_affiliate: 29.90,
    category: 'mellow',
    subcategory: 'Difese e Mobilità',
    image_url: 'https://try-mellow.com/cdn/shop/files/60_guarantee_7885a9d8-faad-47fe-8009-6519ef678ac3.jpg',
    stock: 100,
  },
]

async function importProducts() {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    
    console.log('🔄 Importazione prodotti Mellow...\n')
    
    let inserted = 0
    let updated = 0
    
    for (const product of mellowProducts) {
      // Verifica se il prodotto esiste già
      const existing = await client.query(
        'SELECT id FROM products WHERE name = $1',
        [product.name]
      )
      
      if (existing.rows.length > 0) {
        console.log(`⚠️  Prodotto già esistente, aggiorno: ${product.name}`)
        // Aggiorna il prodotto esistente (solo se ha colonne price_client, price_vip, price_affiliate)
        try {
          await client.query(
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
          updated++
          console.log(`✅ Prodotto aggiornato: ${product.name}`)
        } catch (err) {
          // Se le colonne price_client/vip/affiliate non esistono, usa solo price
          await client.query(
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
          updated++
          console.log(`✅ Prodotto aggiornato: ${product.name}`)
        }
      } else {
        // Inserisce il nuovo prodotto
        console.log(`➕ Inserisco nuovo prodotto: ${product.name}`)
        await client.query(
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
        inserted++
        console.log(`✅ Prodotto inserito: ${product.name}`)
      }
    }
    
    await client.query('COMMIT')
    console.log('\n✅ Importazione completata con successo!')
    console.log(`📦 ${inserted} prodotti inseriti, ${updated} prodotti aggiornati`)
    console.log(`🎯 Categoria: "mellow"`)
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Errore durante l\'importazione:', error.message)
    console.error('Stack:', error.stack)
    throw error
  } finally {
    client.release()
  }
}

// Esegue l'importazione
importProducts()
  .then(() => {
    console.log('\n🎉 Processo completato!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Errore fatale:', error.message)
    process.exit(1)
  })
