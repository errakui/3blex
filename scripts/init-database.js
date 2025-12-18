/**
 * Script per inizializzare il database 3Blex Network
 * Esegue lo schema e crea l'utente admin di default
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDatabase() {
  console.log('🚀 Inizializzazione database 3Blex Network...\n');
  
  const client = await pool.connect();
  
  try {
    // Leggi ed esegui lo schema
    const schemaPath = path.join(__dirname, '../server/db/schema_3blex.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📦 Applicazione schema database...');
    await client.query(schema);
    console.log('✅ Schema applicato con successo!\n');
    
    // Verifica se esiste già un admin
    const adminCheck = await client.query(
      `SELECT id FROM users WHERE role = 'admin' LIMIT 1`
    );
    
    if (adminCheck.rows.length === 0) {
      console.log('👤 Creazione utente admin...');
      
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@3blex.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      
      // Crea admin
      const adminResult = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, status, kyc_status, current_rank, referral_code)
         VALUES ($1, $2, 'Admin', '3Blex', 'admin', 'active', 'approved', 'DIAMOND', 'ADMIN001')
         RETURNING id`,
        [adminEmail, passwordHash]
      );
      
      const adminId = adminResult.rows[0].id;
      
      // Crea nodo root nell'albero binario
      await client.query(
        `INSERT INTO binary_tree (user_id, depth, path)
         VALUES ($1, 0, '')`,
        [adminId]
      );
      
      // Crea wallet admin
      await client.query(
        `INSERT INTO wallets (user_id)
         VALUES ($1)`,
        [adminId]
      );
      
      console.log(`✅ Admin creato: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log('   ⚠️  CAMBIA LA PASSWORD DOPO IL PRIMO LOGIN!\n');
    } else {
      console.log('ℹ️  Admin già esistente, skip creazione.\n');
    }
    
    // Statistiche finali
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM products) as products,
        (SELECT COUNT(*) FROM ranks) as ranks
    `);
    
    console.log('📊 Statistiche database:');
    console.log(`   - Utenti: ${stats.rows[0].users}`);
    console.log(`   - Prodotti: ${stats.rows[0].products}`);
    console.log(`   - Rank: ${stats.rows[0].ranks}`);
    
    console.log('\n✅ Inizializzazione completata!');
    console.log('🌐 Puoi avviare il server con: npm run dev');
    
  } catch (error) {
    console.error('❌ Errore durante l\'inizializzazione:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Esegui
initDatabase().catch(err => {
  console.error(err);
  process.exit(1);
});
